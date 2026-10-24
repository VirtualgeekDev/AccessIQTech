<?php
/**
 * PayPal Webhook Endpoint
 * Handles real-time events from PayPal
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/security.php';
require_once __DIR__ . '/../../config/email.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

try {
    // Get the raw POST body and headers
    $payload = @file_get_contents('php://input');
    $headers = getallheaders();
    
    if (empty($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing payload']);
        exit();
    }
    
    // Get PayPal webhook verification headers
    $transmissionId = $headers['Paypal-Transmission-Id'] ?? '';
    $transmissionTime = $headers['Paypal-Transmission-Time'] ?? '';
    $transmissionSig = $headers['Paypal-Transmission-Sig'] ?? '';
    $certUrl = $headers['Paypal-Cert-Url'] ?? '';
    
    if (empty($transmissionId) || empty($transmissionSig)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing PayPal headers']);
        exit();
    }
    
    // Get webhook ID from database
    $stmt = $db->query(
        "SELECT setting_value, is_encrypted FROM settings WHERE setting_key = 'paypal_webhook_id'"
    );
    $webhookSetting = $stmt->fetch();
    
    if (!$webhookSetting) {
        error_log("PayPal webhook ID not configured");
        http_response_code(500);
        echo json_encode(['error' => 'Webhook not configured']);
        exit();
    }
    
    $webhookId = $webhookSetting['setting_value'];
    if ($webhookSetting['is_encrypted']) {
        $webhookId = $security->decrypt($webhookId);
    }
    
    // Verify webhook with PayPal
    $verificationResult = verifyPayPalWebhook(
        $payload, 
        $transmissionId, 
        $transmissionTime, 
        $transmissionSig, 
        $certUrl, 
        $webhookId
    );
    
    if (!$verificationResult['success']) {
        error_log("PayPal webhook verification failed: " . $verificationResult['error']);
        http_response_code(400);
        echo json_encode(['error' => 'Webhook verification failed']);
        exit();
    }
    
    // Parse the event
    $event = json_decode($payload, true);
    if (!$event) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload']);
        exit();
    }
    
    $eventId = $event['id'] ?? uniqid('paypal_');
    $eventType = $event['event_type'] ?? 'unknown';
    
    // Check if we've already processed this event (idempotency)
    $stmt = $db->query(
        "SELECT id FROM webhook_events WHERE event_id = ? AND provider = 'paypal'",
        [$eventId]
    );
    
    if ($stmt->fetch()) {
        // Already processed
        http_response_code(200);
        echo json_encode(['status' => 'already_processed']);
        exit();
    }
    
    // Log the webhook event
    $db->query(
        "INSERT INTO webhook_events (event_id, provider, event_type, payload, processed_at) 
         VALUES (?, 'paypal', ?, ?, NOW())",
        [$eventId, $eventType, $payload]
    );
    
    // Process the event based on type
    switch ($eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
            handlePayPalSubscriptionActivated($event);
            break;
            
        case 'BILLING.SUBSCRIPTION.CANCELLED':
            handlePayPalSubscriptionCancelled($event);
            break;
            
        case 'BILLING.SUBSCRIPTION.EXPIRED':
            handlePayPalSubscriptionExpired($event);
            break;
            
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
            handlePayPalSubscriptionPaymentFailed($event);
            break;
            
        case 'PAYMENT.SALE.COMPLETED':
            handlePayPalPaymentCompleted($event);
            break;
            
        case 'PAYMENT.SALE.REFUNDED':
            handlePayPalPaymentRefunded($event);
            break;
            
        default:
            error_log("Unhandled PayPal webhook event type: " . $eventType);
            break;
    }
    
    // Log successful processing
    $security->logSecurityEvent('paypal_webhook_processed', [
        'event_id' => $eventId,
        'event_type' => $eventType,
        'resource_id' => $event['resource']['id'] ?? null
    ]);
    
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    error_log("PayPal webhook error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function verifyPayPalWebhook($payload, $transmissionId, $transmissionTime, $transmissionSig, $certUrl, $webhookId) {
    try {
        // Get PayPal access token
        $accessToken = getPayPalAccessToken();
        if (!$accessToken) {
            return ['success' => false, 'error' => 'Failed to get PayPal access token'];
        }
        
        $environment = $_ENV['PAYPAL_ENVIRONMENT'] ?? 'sandbox';
        $baseUrl = $environment === 'sandbox' 
            ? 'https://api.sandbox.paypal.com' 
            : 'https://api.paypal.com';
        
        // Prepare verification request
        $verificationData = [
            'transmission_id' => $transmissionId,
            'transmission_time' => $transmissionTime,
            'transmission_sig' => $transmissionSig,
            'cert_url' => $certUrl,
            'webhook_id' => $webhookId,
            'webhook_event' => json_decode($payload, true)
        ];
        
        // Send verification request to PayPal
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $baseUrl . '/v1/notifications/verify-webhook-signature',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($verificationData),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $accessToken,
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            return ['success' => false, 'error' => 'cURL error: ' . $curlError];
        }
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data && ($data['verification_status'] ?? '') === 'SUCCESS') {
                return ['success' => true];
            }
        }
        
        return ['success' => false, 'error' => 'Verification failed'];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function getPayPalAccessToken() {
    global $db, $security;
    
    try {
        // Get PayPal credentials
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('paypal_client_id', 'paypal_secret')"
        );
        
        $credentials = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            if ($row['is_encrypted']) {
                $value = $security->decrypt($value);
            }
            $credentials[$row['setting_key']] = $value;
        }
        
        $clientId = $credentials['paypal_client_id'] ?? '';
        $clientSecret = $credentials['paypal_secret'] ?? '';
        
        if (empty($clientId) || empty($clientSecret)) {
            return null;
        }
        
        $environment = $_ENV['PAYPAL_ENVIRONMENT'] ?? 'sandbox';
        $baseUrl = $environment === 'sandbox' 
            ? 'https://api.sandbox.paypal.com' 
            : 'https://api.paypal.com';
        
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
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            return $data['access_token'] ?? null;
        }
        
        return null;
        
    } catch (Exception $e) {
        error_log("PayPal access token error: " . $e->getMessage());
        return null;
    }
}

function handlePayPalSubscriptionActivated($event) {
    global $db;
    
    try {
        $resource = $event['resource'] ?? [];
        $subscriptionId = $resource['id'] ?? '';
        
        if ($subscriptionId) {
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'active',
                 updated_at = NOW()
                 WHERE paypal_subscription_id = ?",
                [$subscriptionId]
            );
        }
        
        error_log("Processed BILLING.SUBSCRIPTION.ACTIVATED for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing BILLING.SUBSCRIPTION.ACTIVATED: " . $e->getMessage());
    }
}

function handlePayPalSubscriptionCancelled($event) {
    global $db;
    
    try {
        $resource = $event['resource'] ?? [];
        $subscriptionId = $resource['id'] ?? '';
        
        if ($subscriptionId) {
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'canceled',
                 canceled_at = NOW(),
                 updated_at = NOW()
                 WHERE paypal_subscription_id = ?",
                [$subscriptionId]
            );
        }
        
        error_log("Processed BILLING.SUBSCRIPTION.CANCELLED for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing BILLING.SUBSCRIPTION.CANCELLED: " . $e->getMessage());
    }
}

function handlePayPalSubscriptionExpired($event) {
    global $db;
    
    try {
        $resource = $event['resource'] ?? [];
        $subscriptionId = $resource['id'] ?? '';
        
        if ($subscriptionId) {
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'expired',
                 updated_at = NOW()
                 WHERE paypal_subscription_id = ?",
                [$subscriptionId]
            );
        }
        
        error_log("Processed BILLING.SUBSCRIPTION.EXPIRED for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing BILLING.SUBSCRIPTION.EXPIRED: " . $e->getMessage());
    }
}

function handlePayPalSubscriptionPaymentFailed($event) {
    global $db, $emailService;
    
    try {
        $resource = $event['resource'] ?? [];
        $subscriptionId = $resource['id'] ?? '';
        
        if ($subscriptionId) {
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'past_due',
                 updated_at = NOW()
                 WHERE paypal_subscription_id = ?",
                [$subscriptionId]
            );
            
            // Get user for email notification
            $stmt = $db->query(
                "SELECT u.id, u.name, u.email FROM users u
                 JOIN subscriptions s ON u.id = s.user_id
                 WHERE s.paypal_subscription_id = ?",
                [$subscriptionId]
            );
            
            $user = $stmt->fetch();
            if ($user) {
                // Send payment failed email
                $emailService = new EmailService();
                $emailService->sendPaymentFailedEmail($user, $resource);
            }
        }
        
        error_log("Processed BILLING.SUBSCRIPTION.PAYMENT.FAILED for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing BILLING.SUBSCRIPTION.PAYMENT.FAILED: " . $e->getMessage());
    }
}

function handlePayPalPaymentCompleted($event) {
    global $db;
    
    try {
        $resource = $event['resource'] ?? [];
        $paymentId = $resource['id'] ?? '';
        $amount = $resource['amount']['total'] ?? 0;
        $currency = $resource['amount']['currency'] ?? 'USD';
        
        // Update payment record if exists
        if ($paymentId) {
            $db->query(
                "UPDATE payments SET 
                 payment_status = 'completed',
                 transaction_id = ?,
                 updated_at = NOW()
                 WHERE transaction_id = ? OR order_id = ?",
                [$paymentId, $paymentId, $paymentId]
            );
        }
        
        error_log("Processed PAYMENT.SALE.COMPLETED for payment: " . $paymentId);
        
    } catch (Exception $e) {
        error_log("Error processing PAYMENT.SALE.COMPLETED: " . $e->getMessage());
    }
}

function handlePayPalPaymentRefunded($event) {
    global $db;
    
    try {
        $resource = $event['resource'] ?? [];
        $refundId = $resource['id'] ?? '';
        $parentPayment = $resource['parent_payment'] ?? '';
        
        if ($parentPayment) {
            $db->query(
                "UPDATE payments SET 
                 payment_status = 'refunded',
                 updated_at = NOW()
                 WHERE transaction_id = ?",
                [$parentPayment]
            );
        }
        
        error_log("Processed PAYMENT.SALE.REFUNDED for payment: " . $parentPayment);
        
    } catch (Exception $e) {
        error_log("Error processing PAYMENT.SALE.REFUNDED: " . $e->getMessage());
    }
}
?>