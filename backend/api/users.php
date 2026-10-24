<?php
/**
 * Users API Endpoints
 * Handles user management for admin panel
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

// Extract user ID if present (e.g., /api/users/123 -> 123)
$userId = null;
if (count($pathParts) > 2 && is_numeric(end($pathParts))) {
    $userId = end($pathParts);
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetUsers();
            break;
        case 'POST':
            handleCreateUser();
            break;
        case 'PUT':
            handleUpdateUser($userId);
            break;
        case 'DELETE':
            handleDeleteUser($userId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Users API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGetUsers() {
    global $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    try {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 50);
        $search = $_GET['search'] ?? '';
        $role = $_GET['role'] ?? '';
        
        $offset = ($page - 1) * $limit;
        
        // Build query with filters
        $whereConditions = [];
        $params = [];
        
        if (!empty($search)) {
            $whereConditions[] = "(u.name LIKE ? OR u.email LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        
        if (!empty($role) && in_array($role, ['user', 'admin'])) {
            $whereConditions[] = "u.role = ?";
            $params[] = $role;
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM users u {$whereClause}";
        $stmt = $db->query($countQuery, $params);
        $totalResult = $stmt->fetch();
        $total = (int)$totalResult['total'];
        
        // Get users with subscription info
        $query = "
            SELECT 
                u.id, u.name, u.email, u.role, u.email_verified, u.trial_expires_at, u.created_at,
                s.status as subscription_status, p.name as plan_name
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing')
            LEFT JOIN plans p ON s.plan_id = p.id
            {$whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->query($query, $params);
        $users = [];
        
        while ($row = $stmt->fetch()) {
            $users[] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'email_verified' => (bool)$row['email_verified'],
                'trial_expires_at' => $row['trial_expires_at'],
                'subscription_status' => $row['subscription_status'],
                'plan_name' => $row['plan_name'],
                'created_at' => $row['created_at']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get users error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve users']);
    }
}

function handleCreateUser() {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $password = $input['password'] ?? '';
    $role = $security->sanitizeInput($input['role'] ?? 'user');
    $emailVerified = (bool)($input['email_verified'] ?? false);
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }
    
    if (!$security->validateInput($email, 'email')) {
        $errors['email'] = 'Please enter a valid email address';
    }
    
    if (!$security->validateInput($password, 'password', ['min_length' => 8])) {
        $errors['password'] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if (!in_array($role, ['user', 'admin'])) {
        $errors['role'] = 'Role must be either user or admin';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Check if user already exists
    $stmt = $db->query("SELECT id FROM users WHERE email = ?", [$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'User with this email already exists']);
        return;
    }
    
    try {
        $passwordHash = hashPassword($password);
        $trialExpiresAt = date('Y-m-d H:i:s', strtotime('+14 days'));
        
        $stmt = $db->query(
            "INSERT INTO users (name, email, password_hash, role, email_verified, trial_expires_at) 
             VALUES (?, ?, ?, ?, ?, ?)",
            [$name, $email, $passwordHash, $role, $emailVerified, $trialExpiresAt]
        );
        
        $newUserId = $db->lastInsertId();
        
        // Create trial subscription for new users
        if ($role === 'user') {
            $starterPlanStmt = $db->query("SELECT id FROM plans WHERE slug = 'starter' LIMIT 1");
            $starterPlan = $starterPlanStmt->fetch();
            
            if ($starterPlan) {
                $db->query(
                    "INSERT INTO subscriptions (user_id, plan_id, status, trial_start, trial_end) 
                     VALUES (?, ?, 'trialing', NOW(), ?)",
                    [$newUserId, $starterPlan['id'], $trialExpiresAt]
                );
            }
        }
        
        // Log the action
        $security->logSecurityEvent('user_created_by_admin', [
            'new_user_id' => $newUserId,
            'admin_user_id' => $admin['id'],
            'user_email' => $email,
            'user_role' => $role
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'user_id' => $newUserId
        ]);
        
    } catch (Exception $e) {
        error_log("Create user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user']);
    }
}

function handleUpdateUser($userId) {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Check if user exists
    $stmt = $db->query("SELECT id, name, email, role FROM users WHERE id = ?", [$userId]);
    $existingUser = $stmt->fetch();
    
    if (!$existingUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? $existingUser['name']);
    $email = $security->sanitizeInput($input['email'] ?? $existingUser['email'], 'email');
    $role = $security->sanitizeInput($input['role'] ?? $existingUser['role']);
    $emailVerified = isset($input['email_verified']) ? (bool)$input['email_verified'] : null;
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }
    
    if (!$security->validateInput($email, 'email')) {
        $errors['email'] = 'Please enter a valid email address';
    }
    
    if (!in_array($role, ['user', 'admin'])) {
        $errors['role'] = 'Role must be either user or admin';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Check if email already exists for a different user
    $stmt = $db->query("SELECT id FROM users WHERE email = ? AND id != ?", [$email, $userId]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists for another user']);
        return;
    }
    
    try {
        $updateFields = ['name = ?', 'email = ?', 'role = ?', 'updated_at = NOW()'];
        $params = [$name, $email, $role];
        
        if ($emailVerified !== null) {
            $updateFields[] = 'email_verified = ?';
            $params[] = $emailVerified;
        }
        
        $params[] = $userId;
        
        $stmt = $db->query(
            "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?",
            $params
        );
        
        // Log the action
        $security->logSecurityEvent('user_updated_by_admin', [
            'updated_user_id' => $userId,
            'admin_user_id' => $admin['id'],
            'old_email' => $existingUser['email'],
            'new_email' => $email,
            'old_role' => $existingUser['role'],
            'new_role' => $role
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user']);
    }
}

function handleDeleteUser($userId) {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }
    
    // Check if user exists
    $stmt = $db->query("SELECT id, name, email, role FROM users WHERE id = ?", [$userId]);
    $existingUser = $stmt->fetch();
    
    if (!$existingUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    // Prevent admin from deleting themselves
    if ($userId == $admin['id']) {
        http_response_code(409);
        echo json_encode(['error' => 'Cannot delete your own account']);
        return;
    }
    
    try {
        // Delete user and cascade to related records
        $stmt = $db->query("DELETE FROM users WHERE id = ?", [$userId]);
        
        // Log the action
        $security->logSecurityEvent('user_deleted_by_admin', [
            'deleted_user_id' => $userId,
            'admin_user_id' => $admin['id'],
            'deleted_user_email' => $existingUser['email'],
            'deleted_user_role' => $existingUser['role']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user']);
    }
}
?>