<?php
/**
 * Billing API Endpoints
 * Handles billing information, payment methods, and subscription management
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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

// Parse the request path to determine the action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract action from URL (e.g., /api/billing/overview -> overview)
$action = end($pathParts);

try {
    switch ($action) {
        case 'overview':
            handleBillingOverview();
            break;
        case 'history':
            handleBillingHistory();
            break;
        case 'payment-method':
            handlePaymentMethod();
            break;
        case 'usage':
            handleUsageStats();
            break;
        default:
            // Default to overview if no specific action
            handleBillingOverview();
            break;
    }
} catch (Exception $e) {
    error_log("Billing API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleBillingOverview() {
    global $user, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get current subscription
    $stmt = $db->query(
        "SELECT s.*, p.name as plan_name, p.price_monthly, p.price_annual, p.features 
         FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? 
         ORDER BY s.started_at DESC LIMIT 1",
        [$user['id']]
    );
    
    $subscription = $stmt->fetch();
    
    if (!$subscription) {
        http_response_code(404);
        echo json_encode(['error' => 'No subscription found']);
        return;
    }
    
    // Calculate next billing date
    $nextBillingDate = null;
    if ($subscription['status'] === 'active') {
        $nextBillingDate = $subscription['current_period_end'];
    } elseif ($subscription['status'] === 'trialing') {
        $nextBillingDate = $subscription['trial_end'];
    }
    
    // Get payment method (simplified - in production, fetch from Stripe/PayPal)
    $paymentMethod = [
        'type' => 'card',
        'last4' => '4242',
        'brand' => 'Visa',
        'expiryMonth' => 12,
        'expiryYear' => 2027
    ];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'current_plan' => [
                'name' => $subscription['plan_name'],
                'price_monthly' => (float)$subscription['price_monthly'],
                'price_annual' => (float)$subscription['price_annual'],
                'features' => json_decode($subscription['features'], true),
                'billing_cycle' => $subscription['billing_cycle'],
                'status' => $subscription['status']
            ],
            'next_billing' => [
                'date' => $nextBillingDate,
                'amount' => $subscription['billing_cycle'] === 'annual' 
                    ? (float)$subscription['price_annual'] 
                    : (float)$subscription['price_monthly']
            ],
            'payment_method' => $paymentMethod,
            'trial_info' => [
                'is_trial' => $subscription['status'] === 'trialing',
                'trial_end' => $subscription['trial_end'],
                'days_remaining' => $subscription['status'] === 'trialing' 
                    ? max(0, ceil((strtotime($subscription['trial_end']) - time()) / 86400))
                    : 0
            ]
        ]
    ]);
}

function handleBillingHistory() {
    global $user, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // In a real implementation, you'd fetch from a payments/invoices table
    // For now, we'll generate some sample data based on subscription
    $stmt = $db->query(
        "SELECT s.*, p.name as plan_name, p.price_monthly, p.price_annual 
         FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? AND s.status IN ('active', 'canceled')
         ORDER BY s.started_at DESC",
        [$user['id']]
    );
    
    $subscriptions = $stmt->fetchAll();
    $billingHistory = [];
    
    foreach ($subscriptions as $sub) {
        // Generate mock billing entries for active subscriptions
        if ($sub['status'] === 'active') {
            $startDate = new DateTime($sub['started_at']);
            $now = new DateTime();
            $interval = $sub['billing_cycle'] === 'annual' ? 'P1Y' : 'P1M';
            $amount = $sub['billing_cycle'] === 'annual' ? $sub['price_annual'] : $sub['price_monthly'];
            
            $currentDate = clone $startDate;
            $invoiceNum = 1;
            
            while ($currentDate <= $now) {
                $billingHistory[] = [
                    'id' => $sub['id'] . '_' . $invoiceNum,
                    'date' => $currentDate->format('Y-m-d'),
                    'description' => $sub['plan_name'] . ' Plan - ' . ucfirst($sub['billing_cycle']),
                    'amount' => (float)$amount,
                    'status' => 'paid',
                    'invoice' => 'INV-' . $currentDate->format('Y-m') . '-' . str_pad($invoiceNum, 3, '0', STR_PAD_LEFT)
                ];
                
                $currentDate->add(new DateInterval($interval));
                $invoiceNum++;
            }
        }
    }
    
    // Sort by date descending
    usort($billingHistory, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    echo json_encode([
        'success' => true,
        'data' => array_slice($billingHistory, 0, 12) // Last 12 entries
    ]);
}

function handlePaymentMethod() {
    global $user, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get subscription with payment info
    $stmt = $db->query(
        "SELECT stripe_customer_id, paypal_customer_id 
         FROM subscriptions 
         WHERE user_id = ? AND status IN ('active', 'trialing')
         ORDER BY started_at DESC LIMIT 1",
        [$user['id']]
    );
    
    $subscription = $stmt->fetch();
    
    // In production, you'd fetch actual payment method from Stripe/PayPal
    $paymentMethod = [
        'type' => 'card',
        'last4' => '4242',
        'brand' => 'Visa',
        'expiryMonth' => 12,
        'expiryYear' => 2027,
        'is_default' => true
    ];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'payment_method' => $paymentMethod,
            'billing_address' => [
                'name' => $user['name'],
                'email' => $user['email'],
                'address' => '123 Business Street',
                'city' => 'San Francisco',
                'state' => 'CA',
                'postal_code' => '94105',
                'country' => 'US'
            ]
        ]
    ]);
}

function handleUsageStats() {
    global $user, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get current month usage
    $stmt = $db->query(
        "SELECT COUNT(*) as scans_used 
         FROM scans 
         WHERE user_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')",
        [$user['id']]
    );
    
    $usage = $stmt->fetch();
    
    // Get unique websites scanned this month
    $stmt = $db->query(
        "SELECT COUNT(DISTINCT url) as websites_scanned 
         FROM scans 
         WHERE user_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')",
        [$user['id']]
    );
    
    $websites = $stmt->fetch();
    
    // Get reports generated (completed scans)
    $stmt = $db->query(
        "SELECT COUNT(*) as reports_generated 
         FROM scans 
         WHERE user_id = ? AND status = 'completed' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')",
        [$user['id']]
    );
    
    $reports = $stmt->fetch();
    
    // Get user's plan limits
    $stmt = $db->query(
        "SELECT p.name, p.features 
         FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? AND s.status IN ('active', 'trialing')
         ORDER BY s.started_at DESC LIMIT 1",
        [$user['id']]
    );
    
    $plan = $stmt->fetch();
    
    // Determine scan limit based on plan
    $scanLimit = 5; // Default for starter
    if ($plan) {
        switch (strtolower($plan['name'])) {
            case 'professional':
                $scanLimit = 25;
                break;
            case 'enterprise':
                $scanLimit = 999999; // Unlimited
                break;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'scans_used' => (int)$usage['scans_used'],
            'scan_limit' => $scanLimit,
            'websites_scanned' => (int)$websites['websites_scanned'],
            'reports_generated' => (int)$reports['reports_generated'],
            'plan_name' => $plan['name'] ?? 'Starter'
        ]
    ]);
}