<?php
/**
 * Plans API Endpoints
 * Handles CRUD operations for subscription plans
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

// Parse the request path to determine the action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract plan ID if present (e.g., /api/plans/123 -> 123)
$planId = null;
if (count($pathParts) > 2 && is_numeric(end($pathParts))) {
    $planId = end($pathParts);
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetPlans();
            break;
        case 'POST':
            handleCreatePlan();
            break;
        case 'PUT':
            handleUpdatePlan($planId);
            break;
        case 'DELETE':
            handleDeletePlan($planId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Plans API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGetPlans() {
    global $db;
    
    // Public endpoint - no authentication required for viewing plans
    try {
        $stmt = $db->query(
            "SELECT id, name, slug, price_monthly, price_annual, features, is_popular, is_active, created_at, updated_at 
             FROM plans 
             ORDER BY price_monthly ASC"
        );
        
        $plans = [];
        while ($row = $stmt->fetch()) {
            $plans[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'slug' => $row['slug'],
                'priceMonthly' => (float)$row['price_monthly'],
                'priceAnnual' => (float)$row['price_annual'],
                'features' => json_decode($row['features'], true),
                'popular' => (bool)$row['is_popular'],
                'active' => (bool)$row['is_active'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'plans' => $plans
        ]);
        
    } catch (Exception $e) {
        error_log("Get plans error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve plans']);
    }
}

function handleCreatePlan() {
    global $security, $db;
    
    // Require admin authentication
    $user = requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $slug = $security->sanitizeInput($input['slug'] ?? '');
    $priceMonthly = (float)($input['priceMonthly'] ?? 0);
    $priceAnnual = (float)($input['priceAnnual'] ?? 0);
    $features = $input['features'] ?? [];
    $isPopular = (bool)($input['popular'] ?? false);
    $isActive = (bool)($input['active'] ?? true);
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Plan name must be at least 2 characters';
    }
    
    if (empty($slug) || strlen($slug) < 2) {
        $errors['slug'] = 'Plan slug must be at least 2 characters';
    } elseif (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        $errors['slug'] = 'Plan slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if ($priceMonthly < 0) {
        $errors['priceMonthly'] = 'Monthly price must be a positive number';
    }
    
    if ($priceAnnual < 0) {
        $errors['priceAnnual'] = 'Annual price must be a positive number';
    }
    
    if (!is_array($features) || empty($features)) {
        $errors['features'] = 'Plan must have at least one feature';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Check if slug already exists
    $stmt = $db->query("SELECT id FROM plans WHERE slug = ?", [$slug]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Plan with this slug already exists']);
        return;
    }
    
    try {
        // If this plan is set as popular, remove popular flag from other plans
        if ($isPopular) {
            $db->query("UPDATE plans SET is_popular = FALSE");
        }
        
        $stmt = $db->query(
            "INSERT INTO plans (name, slug, price_monthly, price_annual, features, is_popular, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            [$name, $slug, $priceMonthly, $priceAnnual, json_encode($features), $isPopular, $isActive]
        );
        
        $planId = $db->lastInsertId();
        
        // Log the action
        $security->logSecurityEvent('plan_created', [
            'plan_id' => $planId,
            'admin_user_id' => $user['id'],
            'plan_name' => $name
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Plan created successfully',
            'plan_id' => $planId
        ]);
        
    } catch (Exception $e) {
        error_log("Create plan error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create plan']);
    }
}

function handleUpdatePlan($planId) {
    global $security, $db;
    
    // Require admin authentication
    $user = requireAdmin();
    
    if (!$planId) {
        http_response_code(400);
        echo json_encode(['error' => 'Plan ID is required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Check if plan exists
    $stmt = $db->query("SELECT id, name FROM plans WHERE id = ?", [$planId]);
    $existingPlan = $stmt->fetch();
    
    if (!$existingPlan) {
        http_response_code(404);
        echo json_encode(['error' => 'Plan not found']);
        return;
    }
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $slug = $security->sanitizeInput($input['slug'] ?? '');
    $priceMonthly = (float)($input['priceMonthly'] ?? 0);
    $priceAnnual = (float)($input['priceAnnual'] ?? 0);
    $features = $input['features'] ?? [];
    $isPopular = (bool)($input['popular'] ?? false);
    $isActive = (bool)($input['active'] ?? true);
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Plan name must be at least 2 characters';
    }
    
    if (empty($slug) || strlen($slug) < 2) {
        $errors['slug'] = 'Plan slug must be at least 2 characters';
    } elseif (!preg_match('/^[a-z0-9-]+$/', $slug)) {
        $errors['slug'] = 'Plan slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if ($priceMonthly < 0) {
        $errors['priceMonthly'] = 'Monthly price must be a positive number';
    }
    
    if ($priceAnnual < 0) {
        $errors['priceAnnual'] = 'Annual price must be a positive number';
    }
    
    if (!is_array($features) || empty($features)) {
        $errors['features'] = 'Plan must have at least one feature';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Check if slug already exists for a different plan
    $stmt = $db->query("SELECT id FROM plans WHERE slug = ? AND id != ?", [$slug, $planId]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Plan with this slug already exists']);
        return;
    }
    
    try {
        // If this plan is set as popular, remove popular flag from other plans
        if ($isPopular) {
            $db->query("UPDATE plans SET is_popular = FALSE WHERE id != ?", [$planId]);
        }
        
        $stmt = $db->query(
            "UPDATE plans 
             SET name = ?, slug = ?, price_monthly = ?, price_annual = ?, features = ?, is_popular = ?, is_active = ?, updated_at = NOW()
             WHERE id = ?",
            [$name, $slug, $priceMonthly, $priceAnnual, json_encode($features), $isPopular, $isActive, $planId]
        );
        
        // Log the action
        $security->logSecurityEvent('plan_updated', [
            'plan_id' => $planId,
            'admin_user_id' => $user['id'],
            'plan_name' => $name,
            'old_plan_name' => $existingPlan['name']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Plan updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update plan error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update plan']);
    }
}

function handleDeletePlan($planId) {
    global $security, $db;
    
    // Require admin authentication
    $user = requireAdmin();
    
    if (!$planId) {
        http_response_code(400);
        echo json_encode(['error' => 'Plan ID is required']);
        return;
    }
    
    // Check if plan exists
    $stmt = $db->query("SELECT id, name FROM plans WHERE id = ?", [$planId]);
    $existingPlan = $stmt->fetch();
    
    if (!$existingPlan) {
        http_response_code(404);
        echo json_encode(['error' => 'Plan not found']);
        return;
    }
    
    // Check if plan has active subscriptions
    $stmt = $db->query(
        "SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status IN ('active', 'trialing')",
        [$planId]
    );
    
    $result = $stmt->fetch();
    $activeSubscriptions = (int)$result['count'];
    
    if ($activeSubscriptions > 0) {
        http_response_code(409);
        echo json_encode([
            'error' => "Cannot delete plan with {$activeSubscriptions} active subscriptions. Please migrate users to another plan first."
        ]);
        return;
    }
    
    try {
        // Soft delete by setting is_active to false instead of hard delete
        // This preserves historical data for canceled subscriptions
        $stmt = $db->query(
            "UPDATE plans SET is_active = FALSE, updated_at = NOW() WHERE id = ?",
            [$planId]
        );
        
        // Log the action
        $security->logSecurityEvent('plan_deleted', [
            'plan_id' => $planId,
            'admin_user_id' => $user['id'],
            'plan_name' => $existingPlan['name']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Plan deactivated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete plan error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete plan']);
    }
}
?>