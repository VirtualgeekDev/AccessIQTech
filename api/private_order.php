<?php
/**
 * Private Order API Endpoint
 * Handles orders from the private checkout page with Stripe and PayPal integration
 */

// Load environment variables if .env file exists
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '"\'');
        }
    }
}

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
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

$security = SecurityManager::getInstance();
$db = Database::getInstance();

// Create payments table if it doesn't exist
createPaymentsTable();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }
    
    // Sanitize and validate input
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $fullName = $security->sanitizeInput($input['fullName'] ?? '');
    $phone = $security->sanitizeInput($input['phone'] ?? '');
    $adultPack = (bool)($input['adultPack'] ?? false);
    $paymentMethod = $security->sanitizeInput($input['paymentMethod'] ?? '');
    $product = $security->sanitizeInput($input['product'] ?? '');
    $price = (float)($input['price'] ?? 0);
    $currency = $security->sanitizeInput($input['currency'] ?? 'USD');
    $timestamp = $input['timestamp'] ?? date('Y-m-d H:i:s');
    
    // Validation
    $errors = [];
    
    if (!$security->validateInput($email, 'email')) {
        $errors['email'] = 'Valid email address is required';
    }
    
    if (empty($fullName) || strlen($fullName) < 2) {
        $errors['fullName'] = 'Full name is required';
    }
    
    if (!in_array($paymentMethod, ['stripe', 'paypal'])) {
        $errors['paymentMethod'] = 'Invalid payment method';
    }
    
    if ($price <= 0) {
        $errors['price'] = 'Invalid price amount';
    }
    
    if (!in_array($currency, ['USD', 'EUR', 'GBP', 'CAD'])) {
        $errors['currency'] = 'Unsupported currency';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        exit();
    }
    
    // Rate limiting using database
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!$security->checkRateLimit("private_order_{$clientIp}", 5, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many order attempts. Please try again later.']);
        exit();
    }
    
    // Retrieve payment gateway credentials from database
    $paymentCredentials = getPaymentCredentials($paymentMethod);
    
    if (!$paymentCredentials['enabled']) {
        http_response_code(503);
        echo json_encode(['error' => ucfirst($paymentMethod) . ' payment processing is currently disabled']);
        exit();
    }
    
    if (!$paymentCredentials['configured']) {
        http_response_code(503);
        echo json_encode(['error' => ucfirst($paymentMethod) . ' is not properly configured']);
        exit();
    }
    
    // Generate unique order ID
    $orderId = 'ORD-' . strtoupper(uniqid());
    
    // Prepare order data
    $orderData = [
        'order_id' => $orderId,
        'email' => $email,
        'full_name' => $fullName,
        'phone' => $phone,
        'adult_pack' => $adultPack,
        'product' => $product,
        'price' => $price,
        'currency' => $currency,
        'payment_method' => $paymentMethod,
        'ip_address' => $clientIp,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    // Process payment based on method
    $paymentResult = null;
    
    if ($paymentMethod === 'stripe') {
        $paymentResult = processStripePaymentPrivate($orderData, $paymentCredentials);
    } elseif ($paymentMethod === 'paypal') {
        $paymentResult = processPayPalPaymentPrivate($orderData, $paymentCredentials);
    }
    
    if (!$paymentResult || !$paymentResult['success']) {
        // Store failed payment attempt
        storePaymentRecord($orderData, 'failed', $paymentResult['error'] ?? 'Payment processing failed');
        
        http_response_code(400);
        echo json_encode([
            'error' => $paymentResult['error'] ?? 'Payment processing failed',
            'order_id' => $orderId
        ]);
        exit();
    }
    
    // Store successful payment
    $paymentRecord = storePaymentRecord($orderData, 'completed', null, $paymentResult);
    
    // Log the successful order
    $security->logSecurityEvent('private_order_completed', [
        'order_id' => $orderId,
        'email' => $email,
        'payment_method' => $paymentMethod,
        'amount' => $price,
        'currency' => $currency,
        'transaction_id' => $paymentResult['transaction_id'] ?? null
    ]);
    
    $response = [
        'success' => true,
        'order_id' => $orderId,
        'message' => 'Order processed successfully',
        'payment_method' => $paymentMethod,
        'transaction_id' => $paymentResult['transaction_id'] ?? null
    ];
    
    // Add redirect URL for PayPal if needed
    if ($paymentMethod === 'paypal' && isset($paymentResult['redirect_url'])) {
        $response['redirect_url'] = $paymentResult['redirect_url'];
        $response['requires_redirect'] = true;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Private order API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function createPaymentsTable() {
    global $db;
    
    try {
        $db->query("
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NULL,
                product VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                payment_method ENUM('stripe', 'paypal') NOT NULL,
                payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                transaction_id VARCHAR(255) NULL,
                gateway_response JSON NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                adult_pack BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_order_id (order_id),
                INDEX idx_email (email),
                INDEX idx_payment_status (payment_status),
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_created_at (created_at)
            )
        ");
    } catch (Exception $e) {
        error_log("Failed to create payments table: " . $e->getMessage());
        throw new Exception("Database setup failed");
    }
}

function getPaymentCredentials($paymentMethod) {
    global $db, $security;
    
    try {
        $settingKeys = [];
        
        if ($paymentMethod === 'stripe') {
            $settingKeys = ['stripe_enabled', 'stripe_secret_key', 'stripe_publishable_key'];
        } elseif ($paymentMethod === 'paypal') {
            $settingKeys = ['paypal_enabled', 'paypal_client_id', 'paypal_secret'];
        }
        
        $placeholders = str_repeat('?,', count($settingKeys) - 1) . '?';
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted FROM settings WHERE setting_key IN ({$placeholders})",
            $settingKeys
        );
        
        $credentials = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            
            // Decrypt if encrypted
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            
            // Convert boolean values
            if ($row['setting_key'] === 'stripe_enabled' || $row['setting_key'] === 'paypal_enabled') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }
            
            $credentials[$row['setting_key']] = $value;
        }
        
        // Check if payment method is enabled and configured
        $enabled = false;
        $configured = false;
        
        if ($paymentMethod === 'stripe') {
            $enabled = $credentials['stripe_enabled'] ?? false;
            $configured = !empty($credentials['stripe_secret_key']) && !empty($credentials['stripe_publishable_key']);
        } elseif ($paymentMethod === 'paypal') {
            $enabled = $credentials['paypal_enabled'] ?? false;
            $configured = !empty($credentials['paypal_client_id']) && !empty($credentials['paypal_secret']);
        }
        
        return [
            'enabled' => $enabled,
            'configured' => $configured,
            'credentials' => $credentials
        ];
        
    } catch (Exception $e) {
        error_log("Failed to retrieve payment credentials: " . $e->getMessage());
        return [
            'enabled' => false,
            'configured' => false,
            'credentials' => []
        ];
    }
}

function processStripePaymentPrivate($orderData, $credentialsData) {
    $credentials = $credentialsData['credentials'];
    $secretKey = $credentials['stripe_secret_key'] ?? '';
    
    if (empty($secretKey)) {
        return ['success' => false, 'error' => 'Stripe secret key not configured'];
    }
    
    // Initialize Stripe
    \Stripe\Stripe::setApiKey($secretKey);
    
    try {
        // 1. Create Stripe customer
        $customer = \Stripe\Customer::create([
            'email' => $orderData['email'],
            'name' => $orderData['full_name'],
            'phone' => $orderData['phone'],
            'metadata' => [
                'order_id' => $orderData['order_id'],
                'product' => $orderData['product'],
                'adult_pack' => $orderData['adult_pack'] ? 'yes' : 'no'
            ]
        ]);
        
        // 2. Create payment intent
        $paymentIntent = \Stripe\PaymentIntent::create([
            'amount' => $orderData['price'] * 100, // Convert to cents
            'currency' => strtolower($orderData['currency']),
            'customer' => $customer->id,
            'description' => $orderData['product'],
            'confirmation_method' => 'manual',
            'confirm' => true,
            'metadata' => [
                'order_id' => $orderData['order_id'],
                'customer_email' => $orderData['email'],
                'adult_pack' => $orderData['adult_pack'] ? 'yes' : 'no'
            ],
            'receipt_email' => $orderData['email']
        ]);
        
        // Handle different payment intent statuses
        if ($paymentIntent->status === 'requires_action') {
            return [
                'success' => false,
                'requires_action' => true,
                'payment_intent_client_secret' => $paymentIntent->client_secret,
                'customer_id' => $customer->id,
                'message' => '3D Secure authentication required'
            ];
        }
        
        if ($paymentIntent->status === 'succeeded') {
            return [
                'success' => true,
                'transaction_id' => $paymentIntent->id,
                'customer_id' => $customer->id,
                'status' => $paymentIntent->status,
                'receipt_url' => $paymentIntent->charges->data[0]->receipt_url ?? null
            ];
        }
        
        return [
            'success' => true,
            'transaction_id' => $paymentIntent->id,
            'customer_id' => $customer->id,
            'status' => $paymentIntent->status
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
        return [
            'success' => false,
            'error' => 'Payment processing error occurred'
        ];
    } catch (\Exception $e) {
        error_log("General Stripe error: " . $e->getMessage());
        return ['success' => false, 'error' => 'An unexpected error occurred during payment processing'];
    }
}

function processPayPalPaymentPrivate($orderData, $credentialsData) {
    $credentials = $credentialsData['credentials'];
    $clientId = $credentials['paypal_client_id'] ?? '';
    $clientSecret = $credentials['paypal_secret'] ?? '';
    
    if (empty($clientId) || empty($clientSecret)) {
        return ['success' => false, 'error' => 'PayPal credentials not configured'];
    }
    
    $environment = $_ENV['PAYPAL_ENVIRONMENT'] ?? 'sandbox';
    $paypalBaseUrl = $environment === 'sandbox' 
        ? 'https://api.sandbox.paypal.com' 
        : 'https://api.paypal.com';
    
    try {
        // 1. Get access token
        $tokenResponse = getPayPalAccessTokenPrivate($clientId, $clientSecret, $paypalBaseUrl);
        
        if (!$tokenResponse['success']) {
            return ['success' => false, 'error' => 'PayPal authentication failed'];
        }
        
        // 2. Create order
        $orderPayload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => $orderData['currency'],
                    'value' => number_format($orderData['price'], 2, '.', '')
                ],
                'description' => $orderData['product'],
                'custom_id' => $orderData['order_id']
            ]],
            'payer' => [
                'name' => [
                    'given_name' => explode(' ', $orderData['full_name'])[0],
                    'surname' => explode(' ', $orderData['full_name'], 2)[1] ?? ''
                ],
                'email_address' => $orderData['email']
            ],
            'application_context' => [
                'brand_name' => 'AccessIQ Tech',
                'locale' => 'en-US',
                'user_action' => 'PAY_NOW',
                'return_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/payment/success',
                'cancel_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/payment/cancel'
            ]
        ];
        
        // Add phone if provided
        if (!empty($orderData['phone'])) {
            $orderPayload['payer']['phone'] = [
                'phone_number' => [
                    'national_number' => preg_replace('/[^0-9]/', '', $orderData['phone'])
                ]
            ];
        }
        
        $orderResponse = createPayPalOrderPrivate($orderPayload, $tokenResponse['access_token'], $paypalBaseUrl);
        
        if ($orderResponse['success']) {
            return [
                'success' => true,
                'transaction_id' => $orderResponse['order_id'],
                'redirect_url' => $orderResponse['approval_url'],
                'requires_redirect' => true,
                'status' => 'pending_approval'
            ];
        } else {
            return [
                'success' => false,
                'error' => 'PayPal order creation failed',
                'paypal_error' => $orderResponse['error'] ?? 'Unknown error'
            ];
        }
        
    } catch (Exception $e) {
        error_log("PayPal private payment error: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'PayPal processing failed: ' . $e->getMessage()
        ];
    }
}

function getPayPalAccessTokenPrivate($clientId, $clientSecret, $baseUrl) {
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

function createPayPalOrderPrivate($orderData, $accessToken, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v2/checkout/orders',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($orderData),
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
        error_log("PayPal order creation cURL error: " . $curlError);
        return ['success' => false, 'error' => 'Connection to PayPal failed'];
    }
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        
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
            'order_id' => $data['id'],
            'approval_url' => $approvalUrl,
            'status' => $data['status'] ?? 'CREATED'
        ];
    }
    
    error_log("PayPal order creation failed: HTTP {$httpCode}, Response: {$response}");
    return [
        'success' => false,
        'error' => 'Failed to create PayPal order',
        'response' => $response
    ];
}

function storePaymentRecord($orderData, $status, $errorMessage = null, $paymentResult = null) {
    global $db;
    
    try {
        $gatewayResponse = null;
        $transactionId = null;
        
        if ($paymentResult) {
            $gatewayResponse = json_encode($paymentResult);
            $transactionId = $paymentResult['transaction_id'] ?? null;
        }
        
        if ($errorMessage) {
            $gatewayResponse = json_encode(['error' => $errorMessage]);
        }
        
        $stmt = $db->query(
            "INSERT INTO payments 
             (order_id, email, full_name, phone, product, price, currency, payment_method, 
              payment_status, transaction_id, gateway_response, ip_address, user_agent, adult_pack) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $orderData['order_id'],
                $orderData['email'],
                $orderData['full_name'],
                $orderData['phone'],
                $orderData['product'],
                $orderData['price'],
                $orderData['currency'],
                $orderData['payment_method'],
                $status,
                $transactionId,
                $gatewayResponse,
                $orderData['ip_address'],
                $orderData['user_agent'],
                $orderData['adult_pack']
            ]
        );
        
        return $db->lastInsertId();
        
    } catch (Exception $e) {
        error_log("Failed to store payment record: " . $e->getMessage());
        throw new Exception("Failed to store payment record");
    }
}

/*
PRODUCTION HELPER FUNCTIONS FOR PAYPAL:

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
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        return [
            'success' => true,
            'access_token' => $data['access_token'],
            'expires_in' => $data['expires_in']
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Failed to get PayPal access token'
        ];
    }
}

function createPayPalOrder($orderData, $accessToken, $baseUrl) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/v2/checkout/orders',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($orderData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken,
            'PayPal-Request-Id: ' . uniqid(),
            'Prefer: return=representation'
        ],
        CURLOPT_TIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201) {
        $data = json_decode($response, true);
        
        // Find approval URL
        $approvalUrl = null;
        foreach ($data['links'] as $link) {
            if ($link['rel'] === 'approve') {
                $approvalUrl = $link['href'];
                break;
            }
        }
        
        return [
            'success' => true,
            'order_id' => $data['id'],
            'approval_url' => $approvalUrl,
            'status' => $data['status']
        ];
    } else {
        return [
            'success' => false,
            'error' => 'Failed to create PayPal order',
            'response' => $response
        ];
    }
}
*/

?>