<?php
/**
 * Admin Analytics API Endpoint
 * Provides business metrics and KPIs for admin dashboard
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Require admin authentication
$admin = requireAdmin();

$db = Database::getInstance();

try {
    // Get analytics data from database or calculate
    $analytics = [];
    
    // Monthly Recurring Revenue (MRR)
    $stmt = $db->query(
        "SELECT SUM(
            CASE 
                WHEN s.billing_cycle = 'monthly' THEN p.price_monthly
                WHEN s.billing_cycle = 'annual' THEN p.price_annual / 12
                ELSE 0
            END
        ) as mrr
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'"
    );
    $mrrResult = $stmt->fetch();
    $analytics['mrr'] = (float)($mrrResult['mrr'] ?? 0);
    
    // Active Users
    $stmt = $db->query(
        "SELECT COUNT(*) as active_users 
         FROM users u
         JOIN subscriptions s ON u.id = s.user_id
         WHERE s.status IN ('active', 'trialing') AND u.email_verified = 1"
    );
    $activeResult = $stmt->fetch();
    $analytics['active_users'] = (int)($activeResult['active_users'] ?? 0);
    
    // Trial Conversion Rate (last 30 days)
    $stmt = $db->query(
        "SELECT 
            COUNT(CASE WHEN s.status = 'active' THEN 1 END) as converted,
            COUNT(*) as total_trials
         FROM subscriptions s
         WHERE s.trial_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    $conversionResult = $stmt->fetch();
    $totalTrials = (int)($conversionResult['total_trials'] ?? 0);
    $converted = (int)($conversionResult['converted'] ?? 0);
    $analytics['trial_conversions'] = $totalTrials > 0 ? round(($converted / $totalTrials) * 100, 1) : 0;
    
    // Churn Rate (last 30 days)
    $stmt = $db->query(
        "SELECT 
            COUNT(CASE WHEN s.canceled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as churned,
            COUNT(CASE WHEN s.status = 'active' OR s.canceled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as total_active
         FROM subscriptions s"
    );
    $churnResult = $stmt->fetch();
    $totalActive = (int)($churnResult['total_active'] ?? 0);
    $churned = (int)($churnResult['churned'] ?? 0);
    $analytics['churn_rate'] = $totalActive > 0 ? round(($churned / $totalActive) * 100, 1) : 0;
    
    // Additional metrics
    $stmt = $db->query("SELECT COUNT(*) as total_scans FROM scans WHERE status = 'completed'");
    $scansResult = $stmt->fetch();
    $analytics['total_scans'] = (int)($scansResult['total_scans'] ?? 0);
    
    $stmt = $db->query("SELECT AVG(score) as avg_score FROM scans WHERE status = 'completed' AND score > 0");
    $scoreResult = $stmt->fetch();
    $analytics['avg_accessibility_score'] = round((float)($scoreResult['avg_score'] ?? 0));
    
    // Recent activity
    $stmt = $db->query(
        "SELECT u.name, u.email, s.created_at, p.name as plan_name
         FROM subscriptions s
         JOIN users u ON s.user_id = u.id
         JOIN plans p ON s.plan_id = p.id
         WHERE s.status IN ('active', 'trialing')
         ORDER BY s.created_at DESC
         LIMIT 10"
    );
    
    $recentActivity = [];
    while ($row = $stmt->fetch()) {
        $recentActivity[] = [
            'user_name' => $row['name'],
            'user_email' => $row['email'],
            'plan_name' => $row['plan_name'],
            'created_at' => $row['created_at']
        ];
    }
    
    $analytics['recent_activity'] = $recentActivity;
    
    echo json_encode([
        'success' => true,
        'analytics' => $analytics
    ]);
    
} catch (Exception $e) {
    error_log("Admin analytics error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve analytics']);
}
?>