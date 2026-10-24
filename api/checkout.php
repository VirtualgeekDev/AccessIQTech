<?php
/**
 * Checkout API Endpoint
 * Handles subscription creation and payment processing
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Authenticate user
$user = authenticateUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $planId = $security->sanitizeInput($input['plan_id'] ?? '');
    $billingCycle = $security->sanitizeInput($input['billing_cycle'] ?? 'monthly');
    $paymentMethod = $security->sanitizeInput($input['payment_method'] ?? 'stripe');
    $paymentData = $input['payment_data'] ?? [];
    $skipPayment = (bool)($input['skip_payment'] ?? false);
    
    if (empty($planId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Plan ID is required']);
        exit();
    }
    
    if (!in_array($billingCycle, ['monthly', 'annual'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid billing cycle']);
        exit();
    }
    
    if (!in_array($paymentMethod, ['stripe', 'paypal', 'none'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payment method']);
        exit();
    }
    
    // Get plan details
    $stmt = $db->query("SELECT * FROM plans WHERE id = ? AND is_active = 1", [$planId]);
    $plan = $stmt->fetch();
    
    if (!$plan) {
        http_response_code(404);
        echo json_encode(['error' => 'Plan not found']);
        exit();
    }
    
    // Check if user already has an active subscription
    $stmt = $db->query(
        "SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active', 'trialing')",
        [$user['id']]
    );
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'User already has an active subscription']);
        exit();
    }
    
    // Calculate amount
    $amount = $billingCycle === 'annual' ? $plan['price_annual'] : $plan['price_monthly'];
    
    // Check if payment is required
    $paymentRequiredStmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'payment_required'");
    $paymentRequiredSetting = $paymentRequiredStmt->fetch();
    $paymentRequired = $paymentRequiredSetting ? filter_var($paymentRequiredSetting['setting_value'], FILTER_VALIDATE_BOOLEAN) : true;
    
    // Process payment based on method and requirement
    $paymentResult = null;
    
    if ($paymentRequired && !$skipPayment) {
        if ($paymentMethod === 'stripe') {
            $paymentResult = processStripePayment($paymentData, $amount, $user, $plan, $billingCycle);
        } elseif ($paymentMethod === 'paypal') {
            $paymentResult = processPayPalPayment($paymentData, $amount, $user, $plan, $billingCycle);
        }
        
        if (!$paymentResult || !$paymentResult['success']) {
            http_response_code(400);
            echo json_encode(['error' => $paymentResult['error'] ?? 'Payment processing failed']);
            exit();
        }
    } else {
        // No payment required - create mock payment result
        $paymentResult = [
            'success' => true,
            'stripe_subscription_id' => null,
            'stripe_customer_id' => null,
            'paypal_subscription_id' => null,
            'paypal_customer_id' => null,
            'no_payment_required' => true
        ];
    }
    
    // Create subscription record
    $trialLengthStmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'trial_length_days'");
    $trialLengthSetting = $trialLengthStmt ? $trialLengthStmt->fetch() : null;
    $trialLengthDays = $trialLengthSetting && !empty($trialLengthSetting['setting_value']) ? (int)$trialLengthSetting['setting_value'] : 8;
    
    $trialEnd = date('Y-m-d H:i:s', strtotime("+{$trialLengthDays} days"));
    $currentPeriodEnd = $billingCycle === 'annual' 
        ? date('Y-m-d H:i:s', strtotime('+1 year'))
        : date('Y-m-d H:i:s', strtotime('+1 month'));
    
    $stmt = $db->query(
        "INSERT INTO subscriptions (
            user_id, plan_id, status, billing_cycle, 
            stripe_subscription_id, stripe_customer_id,
            paypal_subscription_id, paypal_customer_id,
            current_period_start, current_period_end,
            trial_start, trial_end
        ) VALUES (?, ?, 'trialing', ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)",
        [
            $user['id'],
            $planId,
            $billingCycle,
            $paymentResult['stripe_subscription_id'] ?? null,
            $paymentResult['stripe_customer_id'] ?? null,
            $paymentResult['paypal_subscription_id'] ?? null,
            $paymentResult['paypal_customer_id'] ?? null,
            $currentPeriodEnd,
            $trialEnd
        ]
    );
    
    $subscriptionId = $db->lastInsertId();
    
    // Update user trial expiration
    $db->query(
        "UPDATE users SET trial_expires_at = ? WHERE id = ?",
        [$trialEnd, $user['id']]
    );
    
    // Log the subscription creation
    $security->logSecurityEvent('subscription_created', [
        'user_id' => $user['id'],
        'subscription_id' => $subscriptionId,
        'plan_id' => $planId,
        'billing_cycle' => $billingCycle,
        'payment_method' => $paymentMethod
    ]);
    
    echo json_encode([
        'success' => true,
        'subscription_id' => $subscriptionId,
        'trial_end' => $trialEnd,
        'message' => ($paymentRequired && !$skipPayment)
            ? "Subscription created successfully! Your {$trialLengthDays}-day free trial has started."
            : "Subscription created successfully! Your {$trialLengthDays}-day free trial has started. One of our team members will contact you to complete the payment."
    ]);
    
} catch (Exception $e) {
    error_log("Checkout API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function processStripePayment($paymentData, $amount, $user, $plan, $billingCycle) {
    // Get Stripe credentials from database
    $stripeCredentials = getStripeCredentials();
    
    if (!$stripeCredentials['enabled'] || !$stripeCredentials['configured']) {
        return ['success' => false, 'error' => 'Stripe payment processing is not available'];
    }
    
    // Initialize Stripe
    \Stripe\Stripe::setApiKey($stripeCredentials['secret_key']);
    
    // Validate required payment data
    $requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'name'];
    foreach ($requiredFields as $field) {
        if (empty($paymentData[$field])) {
            return ['success' => false, 'error' => "Missing required field: {$field}"];
        }
    }
    
    // Validate card data
    $cardNumber = preg_replace('/\s+/', '', $paymentData['cardNumber']);
    if (strlen($cardNumber) < 13 || strlen($cardNumber) > 19) {
        return ['success' => false, 'error' => 'Invalid card number length'];
    }
    
    // Validate CVV
    if (strlen($paymentData['cvv']) < 3 || strlen($paymentData['cvv']) > 4) {
        return ['success' => false, 'error' => 'Invalid CVV'];
    }
    
    // Validate and parse expiry date
    $expiryParts = explode('/', $paymentData['expiryDate']);
    if (count($expiryParts) !== 2) {
        return ['success' => false, 'error' => 'Invalid expiry date format'];
    }
    
    $month = (int)$expiryParts[0];
    try {
        // 1. Create Stripe customer
        $customer = \Stripe\Customer::create([
            'email' => $user['email'],
            'name' => $paymentData['name'],
            'address' => [
                'line1' => $paymentData['address'],
                'city' => $paymentData['city'],
                'postal_code' => $paymentData['postalCode'],
                'country' => $paymentData['country'],
            ],
            'metadata' => [
                'user_id' => $user['id'],
                'plan_name' => $plan['name'],
                'billing_cycle' => $billingCycle
            ]
        ]);
        
        // 2. Create payment method
        $paymentMethod = \Stripe\PaymentMethod::create([
            'type' => 'card',
            'card' => [
                'number' => $paymentData['cardNumber'],
                'exp_month' => $expiryParts[0],
                'exp_year' => $expiryParts[1],
                'cvc' => $paymentData['cvv'],
            ],
            'billing_details' => [
                'name' => $paymentData['name'],
                'email' => $user['email'],
                'address' => [
                    'line1' => $paymentData['address'],
                    'city' => $paymentData['city'],
                    'postal_code' => $paymentData['postalCode'],
                    'country' => $paymentData['country'],
                ]
            ]
        ]);
        
        // 3. Attach payment method to customer
        $paymentMethod->attach(['customer' => $customer->id]);
        
        // 4. Set as default payment method
        \Stripe\Customer::update($customer->id, [
            'invoice_settings' => ['default_payment_method' => $paymentMethod->id]
        ]);
        
        // 5. Create or get price object for subscription
        $priceId = getOrCreateStripePrice($plan, $billingCycle);
        
        if (!$priceId) {
            throw new \Exception('Failed to create Stripe price');
        }
        
        // 6. Create subscription with trial
        $subscriptionData = [
            'customer' => $customer->id,
            'items' => [['price' => $priceId]],
            'default_payment_method' => $paymentMethod->id,
            'trial_period_days' => 14,
            'expand' => ['latest_invoice.payment_intent'],
            'metadata' => [
                'user_id' => $user['id'],
                'plan_id' => $plan['id'],
                'billing_cycle' => $billingCycle
            ]
        ];
        
        $subscription = \Stripe\Subscription::create($subscriptionData);
        
        // 7. Handle payment intent status
        $paymentIntent = $subscription->latest_invoice->payment_intent ?? null;
        
        if ($paymentIntent && $paymentIntent->status === 'requires_action') {
            return [
                'success' => false,
                'requires_action' => true,
                'payment_intent_client_secret' => $paymentIntent->client_secret,
                'stripe_customer_id' => $customer->id,
                'stripe_subscription_id' => $subscription->id,
                'message' => '3D Secure authentication required'
            ];
        }
        
        return [
            'success' => true,
            'stripe_customer_id' => $customer->id,
            'stripe_subscription_id' => $subscription->id,
            'payment_intent_id' => $paymentIntent ? $paymentIntent->id : null,
            'subscription_status' => $subscription->status
        ];
        
    } catch (\Stripe\Exception\CardException $e) {
        error_log("Stripe card error: " . $e->getMessage());
        return [
            'success' => false, 
            'error' => $e->getError()->message,
            'stripe_error_code' => $e->getError()->code,
            'decline_code' => $e->getError()->decline_code ?? null
        ];
    } catch (\Stripe\Exception\RateLimitException $e) {
        error_log("Stripe rate limit error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Too many requests. Please try again in a moment.'];
    } catch (\Stripe\Exception\InvalidRequestException $e) {
        error_log("Stripe invalid request error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Invalid payment information provided'];
    } catch (\Stripe\Exception\AuthenticationException $e) {
        error_log("Stripe authentication error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Payment processing configuration error'];
    } catch (\Stripe\Exception\ApiConnectionException $e) {
        error_log("Stripe connection error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Unable to connect to payment processor'];
    } catch (\Stripe\Exception\ApiErrorException $e) {
        error_log("Stripe API error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Payment processing error occurred'];
    } catch (\Exception $e) {
        error_log("General Stripe error: " . $e->getMessage());
        return ['success' => false, 'error' => 'An unexpected error occurred during payment processing'];
    }
}

function getStripeCredentials() {
    global $db, $security;
    
    try {
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('stripe_enabled', 'stripe_secret_key', 'stripe_publishable_key')"
        );
        
        $credentials = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            
            // Decrypt if encrypted
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            
            // Convert boolean values
            if ($row['setting_key'] === 'stripe_enabled') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
            
            $credentials[$row['setting_key']] = $value;
        }
        
        return [
            'enabled' => $credentials['stripe_enabled'] ?? false,
            'configured' => !empty($credentials['stripe_secret_key']) && !empty($credentials['stripe_publishable_key']),
            'secret_key' => $credentials['stripe_secret_key'] ?? '',
            'publishable_key' => $credentials['stripe_publishable_key'] ?? ''
        ];
        
    } catch (Exception $e) {
        error_log("Failed to retrieve Stripe credentials: " . $e->getMessage());
        return [
            'enabled' => false,
            'configured' => false,
            'secret_key' => '',
            'publishable_key' => ''
        ];
    }
}

function getOrCreateStripePrice($plan, $billingCycle) {
    try {
        // Check if price already exists in Stripe
        $priceId = "price_{$plan['slug']}_{$billingCycle}";
        
        try {
            $existingPrice = \Stripe\Price::retrieve($priceId);
            if ($existingPrice && $existingPrice->active) {
                return $existingPrice->id;
            }
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            // Price doesn't exist, we'll create it
        }
        
        // Create new price
        $priceData = [
            'id' => $priceId,
            'currency' => 'usd',
            'product_data' => [
                'name' => $plan['name'] . ' Plan',
                'description' => 'AccessIQ Tech ' . $plan['name'] . ' subscription',
                'metadata' => [
                    'plan_id' => $plan['id'],
                    'plan_slug' => $plan['slug']
                ]
            ],
            'unit_amount' => $billingCycle === 'annual' ? $plan['price_annual'] * 100 : $plan['price_monthly'] * 100,
            'recurring' => [
                'interval' => $billingCycle === 'annual' ? 'year' : 'month'
            ],
            'metadata' => [
                'plan_id' => $plan['id'],
                'billing_cycle' => $billingCycle
            ]
        ];
        
        $price = \Stripe\Price::create($priceData);
        return $price->id;
        
    } catch (\Exception $e) {
        error_log("Failed to create Stripe price: " . $e->getMessage());
        return null;
        'simulated' => true,
        'requires_3ds' => $requires3DS,
        'processing_time' => rand(1500, 4000) . 'ms',
        'transaction_id' => 'txn_' . uniqid()
    ];
}

function processPayPalPayment($paymentData, $amount, $user, $plan, $billingCycle) {
    // Get PayPal credentials from database
    $paypalCredentials = getPayPalCredentials();
    
    if (!$paypalCredentials['enabled'] || !$paypalCredentials['configured']) {
        return ['success' => false, 'error' => 'PayPal payment processing is not available'];
    }
    
    $clientId = $paypalCredentials['client_id'];
    $clientSecret = $paypalCredentials['client_secret'];
    $environment = $_ENV['PAYPAL_ENVIRONMENT'] ?? 'sandbox';
    $baseUrl = $environment === 'sandbox' 
        ? 'https://api.sandbox.paypal.com' 
        : 'https://api.paypal.com';
    
    try {
        // 1. Get PayPal access token
        $tokenResponse = getPayPalAccessToken($clientId, $clientSecret, $baseUrl);
        
        if (!$tokenResponse['success']) {
            return ['success' => false, 'error' => 'PayPal authentication failed'];
        }
        
        // 2. Create PayPal product
        $productData = [
            'name' => 'AccessIQ Tech ' . $plan['name'] . ' Plan',
            'description' => 'AI-powered web accessibility compliance platform',
            'type' => 'SERVICE',
            'category' => 'SOFTWARE'
        ];
        
        $productResponse = createPayPalProduct($productData, $tokenResponse['access_token'], $baseUrl);
        
        if (!$productResponse['success']) {
            return ['success' => false, 'error' => 'Failed to create PayPal product'];
        }
        
        // 3. Create PayPal billing plan
        $planData = [
            'product_id' => $productResponse['product_id'],
            'name' => $plan['name'] . ' Plan - ' . ucfirst($billingCycle),
            'description' => 'AccessIQ Tech subscription plan',
            'billing_cycles' => [
                [
                    'frequency' => [
                        'interval_unit' => $billingCycle === 'annual' ? 'YEAR' : 'MONTH',
                        'interval_count' => 1
                    ],
                    'tenure_type' => 'TRIAL',
                    'sequence' => 1,
                    'total_cycles' => 1,
                    'pricing_scheme' => [
                        'fixed_price' => [
                            'value' => '0',
                            'currency_code' => 'USD'
                        ]
                    ]
                ],
                [
                    'frequency' => [
                        'interval_unit' => $billingCycle === 'annual' ? 'YEAR' : 'MONTH',
                        'interval_count' => 1
                    ],
                    'tenure_type' => 'REGULAR',
                    'sequence' => 2,
                    'total_cycles' => 0, // Infinite
                    'pricing_scheme' => [
                        'fixed_price' => [
                            'value' => $billingCycle === 'annual' ? $plan['price_annual'] : $plan['price_monthly'],
                            'currency_code' => 'USD'
                        ]
                    ]
                ]
            ],
            'payment_preferences' => [
                'auto_bill_outstanding' => true,
                'setup_fee' => [
                    'value' => '0',
                    'currency_code' => 'USD'
                ],
                'setup_fee_failure_action' => 'CONTINUE',
                'payment_failure_threshold' => 3
            ],
            'taxes' => [
                'percentage' => '0',
                'inclusive' => false
            ]
        ];
        
        $planResponse = createPayPalPlan($planData, $tokenResponse['access_token'], $baseUrl);
        
        if (!$planResponse['success']) {
            return ['success' => false, 'error' => 'Failed to create PayPal billing plan'];
        }
        
        // 4. Create subscription
        $subscriptionData = [
            'plan_id' => $planResponse['plan_id'],
            'subscriber' => [
                'name' => [
                    'given_name' => explode(' ', $user['name'])[0],
                    'surname' => explode(' ', $user['name'], 2)[1] ?? ''
                ],
                'email_address' => $user['email'],
                'shipping_address' => [
                    'name' => ['full_name' => $user['name']],
                    'address' => [
                        'address_line_1' => $paymentData['address'] ?? '',
                        'admin_area_2' => $paymentData['city'] ?? '',
                        'postal_code' => $paymentData['postalCode'] ?? '',
                        'country_code' => $paymentData['country'] ?? 'US'
                    ]
                ]
            ],
            'application_context' => [
                'brand_name' => 'AccessIQ Tech',
                'locale' => 'en-US',
                'user_action' => 'SUBSCRIBE_NOW',
                'payment_method' => [
                    'payer_selected' => 'PAYPAL',
                    'payee_preferred' => 'IMMEDIATE_PAYMENT_REQUIRED'
                ],
                'return_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/checkout/success',
                'cancel_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/checkout/cancel'
            ]
        ];
        
        $subscriptionResponse = createPayPalSubscription($subscriptionData, $tokenResponse['access_token'], $baseUrl);
        
        if ($subscriptionResponse['success']) {
            return [
                'success' => true,
                'paypal_subscription_id' => $subscriptionResponse['subscription_id'],
                'paypal_customer_id' => $subscriptionResponse['subscriber_id'] ?? null,
                'approval_url' => $subscriptionResponse['approval_url'],
                'subscription_status' => $subscriptionResponse['status'] ?? 'APPROVAL_PENDING',
                'requires_approval' => true
            ];
        } else {
            return [
                'success' => false, 
                'error' => 'PayPal subscription creation failed',
                'paypal_error' => $subscriptionResponse['error'] ?? 'Unknown error'
            ];
        }
        
    } catch (Exception $e) {
        error_log("PayPal subscription error: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'PayPal processing failed: ' . $e->getMessage()
        ];
    }
}

function getPayPalCredentials() {
    global $db, $security;
    
    try {
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('paypal_enabled', 'paypal_client_id', 'paypal_secret')"
        );
        
        $credentials = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            
            // Decrypt if encrypted
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            
            // Convert boolean values
            if ($row['setting_key'] === 'paypal_enabled') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
            
            $credentials[$row['setting_key']] = $value;
        }
        
        return [
            'enabled' => $credentials['paypal_enabled'] ?? false,
            'configured' => !empty($credentials['paypal_client_id']) && !empty($credentials['paypal_secret']),
            'client_id' => $credentials['paypal_client_id'] ?? '',
            'client_secret' => $credentials['paypal_secret'] ?? ''
        ];
        
    } catch (Exception $e) {
        error_log("Failed to retrieve PayPal credentials: " . $e->getMessage());
        return [
            'enabled' => false,
            'configured' => false,
            'client_id' => '',
            'client_secret' => ''
        ];
    }
}

function getPayPalAccessToken($clientId, $clientSecret, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v1/oauth2/token',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => $clientId . ':' . $clientSecret,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en_US',
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("PayPal cURL error: " . $curlError);
        return ['success' => false, 'error' => 'Connection to PayPal failed'];
    }
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if ($data && isset($data['access_token'])) {
            return [
                'success' => true,
                'access_token' => $data['access_token'],
                'expires_in' => $data['expires_in'] ?? 3600
            ];
        }
    }
    
    error_log("PayPal token request failed: HTTP {$httpCode}, Response: {$response}");
    return ['success' => false, 'error' => 'PayPal authentication failed'];
}

function createPayPalProduct($productData, $accessToken, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v1/catalogs/products',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($productData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'PayPal-Request-Id: ' . uniqid(),
            'Prefer: return=representation'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("PayPal product creation cURL error: " . $curlError);
        return ['success' => false, 'error' => 'Connection to PayPal failed'];
    }
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        if ($data && isset($data['id'])) {
            return [
                'success' => true,
                'product_id' => $data['id']
            ];
        }
    }
    
    error_log("PayPal product creation failed: HTTP {$httpCode}, Response: {$response}");
    return ['success' => false, 'error' => 'Failed to create PayPal product'];
}

function createPayPalPlan($planData, $accessToken, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v1/billing/plans',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($planData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'PayPal-Request-Id: ' . uniqid(),
            'Prefer: return=representation'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("PayPal plan creation cURL error: " . $curlError);
        return ['success' => false, 'error' => 'Connection to PayPal failed'];
    }
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        if ($data && isset($data['id'])) {
            return [
                'success' => true,
                'plan_id' => $data['id']
            ];
        }
    }
    
    error_log("PayPal plan creation failed: HTTP {$httpCode}, Response: {$response}");
    return ['success' => false, 'error' => 'Failed to create PayPal billing plan'];
}

function createPayPalSubscription($subscriptionData, $accessToken, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v1/billing/subscriptions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($subscriptionData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'PayPal-Request-Id: ' . uniqid(),
            'Prefer: return=representation'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("PayPal subscription creation cURL error: " . $curlError);
        return ['success' => false, 'error' => 'Connection to PayPal failed'];
    }
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        if ($data && isset($data['id'])) {
            // Find approval URL
            $approvalUrl = null;
            if (isset($data['links'])) {
                foreach ($data['links'] as $link) {
                    if ($link['rel'] === 'approve') {
                        $approvalUrl = $link['href'];
                        break;
                    }
                }
            }
            
            return [
                'success' => true,
                'subscription_id' => $data['id'],
                'subscriber_id' => $data['subscriber']['payer_id'] ?? null,
                'approval_url' => $approvalUrl,
                'status' => $data['status'] ?? 'APPROVAL_PENDING'
            ];
        }
    }
    
    error_log("PayPal subscription creation failed: HTTP {$httpCode}, Response: {$response}");
    return ['success' => false, 'error' => 'Failed to create PayPal subscription'];