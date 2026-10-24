<?php
/**
 * Stripe Webhook Endpoint
 * Handles real-time events from Stripe
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/security.php';
require_once __DIR__ . '/../../config/email.php';

// Load Stripe library
require_once __DIR__ . '/../../vendor/autoload.php';

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
    // Get the raw POST body
    $payload = @file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    
    if (empty($payload) || empty($sig_header)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing payload or signature']);
        exit();
    }
    
    // Get webhook secret from database
    $stmt = $db->query(
        "SELECT setting_value, is_encrypted FROM settings WHERE setting_key = 'stripe_webhook_secret'"
    );
    $secretSetting = $stmt->fetch();
    
    if (!$secretSetting) {
        error_log("Stripe webhook secret not configured");
        http_response_code(500);
        echo json_encode(['error' => 'Webhook not configured']);
        exit();
    }
    
    $webhookSecret = $secretSetting['setting_value'];
    if ($secretSetting['is_encrypted']) {
        $webhookSecret = $security->decrypt($webhookSecret);
    }
    
    // Verify webhook signature
    \Stripe\Stripe::setApiKey(getStripeSecretKey());
    
    try {
        $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $webhookSecret);
    } catch (\UnexpectedValueException $e) {
        error_log("Stripe webhook invalid payload: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payload']);
        exit();
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        error_log("Stripe webhook invalid signature: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit();
    }
    
    // Check if we've already processed this event (idempotency)
    $eventId = $event->id;
    $stmt = $db->query(
        "SELECT id FROM webhook_events WHERE event_id = ? AND provider = 'stripe'",
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
         VALUES (?, 'stripe', ?, ?, NOW())",
        [$eventId, $event->type, $payload]
    );
    
    // Process the event based on type
    switch ($event->type) {
        case 'checkout.session.completed':
            handleCheckoutSessionCompleted($event->data->object);
            break;
            
        case 'customer.subscription.created':
            handleSubscriptionCreated($event->data->object);
            break;
            
        case 'customer.subscription.updated':
            handleSubscriptionUpdated($event->data->object);
            break;
            
        case 'customer.subscription.deleted':
            handleSubscriptionDeleted($event->data->object);
            break;
            
        case 'invoice.payment_succeeded':
            handleInvoicePaymentSucceeded($event->data->object);
            break;
            
        case 'invoice.payment_failed':
            handleInvoicePaymentFailed($event->data->object);
            break;
            
        case 'customer.subscription.trial_will_end':
            handleTrialWillEnd($event->data->object);
            break;
            
        default:
            error_log("Unhandled Stripe webhook event type: " . $event->type);
            break;
    }
    
    // Log successful processing
    $security->logSecurityEvent('stripe_webhook_processed', [
        'event_id' => $eventId,
        'event_type' => $event->type,
        'customer_id' => $event->data->object->customer ?? null
    ]);
    
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    error_log("Stripe webhook error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getStripeSecretKey() {
    global $db, $security;
    
    $stmt = $db->query(
        "SELECT setting_value, is_encrypted FROM settings WHERE setting_key = 'stripe_secret_key'"
    );
    $setting = $stmt->fetch();
    
    if (!$setting) {
        throw new Exception("Stripe secret key not configured");
    }
    
    $secretKey = $setting['setting_value'];
    if ($setting['is_encrypted']) {
        $secretKey = $security->decrypt($secretKey);
    }
    
    return $secretKey;
}

function handleCheckoutSessionCompleted($session) {
    global $db;
    
    try {
        $customerId = $session->customer;
        $subscriptionId = $session->subscription;
        
        if ($subscriptionId) {
            // Update subscription status
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'active', 
                 stripe_customer_id = ?, 
                 stripe_subscription_id = ?,
                 updated_at = NOW()
                 WHERE stripe_subscription_id = ? OR stripe_customer_id = ?",
                [$customerId, $subscriptionId, $subscriptionId, $customerId]
            );
        }
        
        error_log("Processed checkout.session.completed for customer: " . $customerId);
        
    } catch (Exception $e) {
        error_log("Error processing checkout.session.completed: " . $e->getMessage());
    }
}

function handleSubscriptionCreated($subscription) {
    global $db;
    
    try {
        $customerId = $subscription->customer;
        $subscriptionId = $subscription->id;
        $status = $subscription->status; // active, trialing, etc.
        
        // Update subscription record
        $db->query(
            "UPDATE subscriptions SET 
             status = ?, 
             stripe_customer_id = ?, 
             stripe_subscription_id = ?,
             current_period_start = FROM_UNIXTIME(?),
             current_period_end = FROM_UNIXTIME(?),
             updated_at = NOW()
             WHERE stripe_subscription_id = ? OR stripe_customer_id = ?",
            [
                $status, 
                $customerId, 
                $subscriptionId,
                $subscription->current_period_start,
                $subscription->current_period_end,
                $subscriptionId, 
                $customerId
            ]
        );
        
        error_log("Processed customer.subscription.created for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing customer.subscription.created: " . $e->getMessage());
    }
}

function handleSubscriptionUpdated($subscription) {
    global $db;
    
    try {
        $subscriptionId = $subscription->id;
        $status = $subscription->status;
        
        $db->query(
            "UPDATE subscriptions SET 
             status = ?,
             current_period_start = FROM_UNIXTIME(?),
             current_period_end = FROM_UNIXTIME(?),
             updated_at = NOW()
             WHERE stripe_subscription_id = ?",
            [
                $status,
                $subscription->current_period_start,
                $subscription->current_period_end,
                $subscriptionId
            ]
        );
        
        error_log("Processed customer.subscription.updated for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing customer.subscription.updated: " . $e->getMessage());
    }
}

function handleSubscriptionDeleted($subscription) {
    global $db;
    
    try {
        $subscriptionId = $subscription->id;
        
        $db->query(
            "UPDATE subscriptions SET 
             status = 'canceled',
             canceled_at = NOW(),
             updated_at = NOW()
             WHERE stripe_subscription_id = ?",
            [$subscriptionId]
        );
        
        error_log("Processed customer.subscription.deleted for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing customer.subscription.deleted: " . $e->getMessage());
    }
}

function handleInvoicePaymentSucceeded($invoice) {
    global $db, $emailService;
    
    try {
        $customerId = $invoice->customer;
        $subscriptionId = $invoice->subscription;
        
        if ($subscriptionId) {
            // Update subscription to active
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'active',
                 updated_at = NOW()
                 WHERE stripe_subscription_id = ?",
                [$subscriptionId]
            );
            
            // Get user for email notification
            $stmt = $db->query(
                "SELECT u.id, u.name, u.email FROM users u
                 JOIN subscriptions s ON u.id = s.user_id
                 WHERE s.stripe_subscription_id = ?",
                [$subscriptionId]
            );
            
            $user = $stmt->fetch();
            if ($user) {
                // Send payment confirmation email
                $emailService = new EmailService();
                $emailService->sendPaymentConfirmationEmail($user, $invoice);
            }
        }
        
        error_log("Processed invoice.payment_succeeded for customer: " . $customerId);
        
    } catch (Exception $e) {
        error_log("Error processing invoice.payment_succeeded: " . $e->getMessage());
    }
}

function handleInvoicePaymentFailed($invoice) {
    global $db, $emailService;
    
    try {
        $customerId = $invoice->customer;
        $subscriptionId = $invoice->subscription;
        
        if ($subscriptionId) {
            // Update subscription to past_due
            $db->query(
                "UPDATE subscriptions SET 
                 status = 'past_due',
                 updated_at = NOW()
                 WHERE stripe_subscription_id = ?",
                [$subscriptionId]
            );
            
            // Get user for email notification
            $stmt = $db->query(
                "SELECT u.id, u.name, u.email FROM users u
                 JOIN subscriptions s ON u.id = s.user_id
                 WHERE s.stripe_subscription_id = ?",
                [$subscriptionId]
            );
            
            $user = $stmt->fetch();
            if ($user) {
                // Send payment failed email
                $emailService = new EmailService();
                $emailService->sendPaymentFailedEmail($user, $invoice);
            }
        }
        
        error_log("Processed invoice.payment_failed for customer: " . $customerId);
        
    } catch (Exception $e) {
        error_log("Error processing invoice.payment_failed: " . $e->getMessage());
    }
}

function handleTrialWillEnd($subscription) {
    global $db, $emailService;
    
    try {
        $subscriptionId = $subscription->id;
        
        // Get user for trial ending notification
        $stmt = $db->query(
            "SELECT u.id, u.name, u.email FROM users u
             JOIN subscriptions s ON u.id = s.user_id
             WHERE s.stripe_subscription_id = ?",
            [$subscriptionId]
        );
        
        $user = $stmt->fetch();
        if ($user) {
            // Send trial ending email
            $emailService = new EmailService();
            $emailService->sendTrialEndingEmail($user);
        }
        
        error_log("Processed customer.subscription.trial_will_end for subscription: " . $subscriptionId);
        
    } catch (Exception $e) {
        error_log("Error processing customer.subscription.trial_will_end: " . $e->getMessage());
    }
}

// Create webhook_events table if it doesn't exist
try {
    $db->query("
        CREATE TABLE IF NOT EXISTS webhook_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id VARCHAR(255) UNIQUE NOT NULL,
            provider ENUM('stripe', 'paypal') NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            payload LONGTEXT NOT NULL,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_id (event_id),
            INDEX idx_provider (provider),
            INDEX idx_event_type (event_type),
            INDEX idx_processed_at (processed_at)
        )
    ");
} catch (Exception $e) {
    error_log("Failed to create webhook_events table: " . $e->getMessage());
}
?>