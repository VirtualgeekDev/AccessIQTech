<?php
/**
 * Profile API Endpoints
 * Handles user profile updates and password changes
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
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

// Extract action from URL (e.g., /api/profile/password -> password)
$action = end($pathParts);

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetProfile();
            break;
        case 'PUT':
            if ($action === 'password') {
                handleUpdatePassword();
            } else {
                handleUpdateProfile();
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Profile API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGetProfile() {
    global $db;
    
    // Require user authentication
    $user = requireAuth();
    
    try {
        // Get extended user profile information
        $stmt = $db->query(
            "SELECT u.id, u.name, u.email, u.role, u.email_verified, u.trial_expires_at, u.created_at,
                    u.company, u.job_title, u.phone, u.timezone,
                    u.email_reports, u.trial_reminders, u.security_alerts, u.product_updates, u.marketing_emails,
                    s.status as subscription_status, p.name as plan_name
             FROM users u
             LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing')
             LEFT JOIN plans p ON s.plan_id = p.id
             WHERE u.id = ?",
            [$user['id']]
        );
        
        $profile = $stmt->fetch();
        
        if (!$profile) {
            http_response_code(404);
            echo json_encode(['error' => 'Profile not found']);
            return;
        }
        
        // Get usage statistics
        $usageStmt = $db->query(
            "SELECT COUNT(*) as total_scans,
                    COUNT(CASE WHEN created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 END) as monthly_scans
             FROM scans WHERE user_id = ?",
            [$user['id']]
        );
        
        $usage = $usageStmt->fetch();
        
        echo json_encode([
            'success' => true,
            'profile' => [
                'id' => (int)$profile['id'],
                'name' => $profile['name'],
                'email' => $profile['email'],
                'role' => $profile['role'],
                'email_verified' => (bool)$profile['email_verified'],
                'trial_expires_at' => $profile['trial_expires_at'],
                'subscription_status' => $profile['subscription_status'],
                'plan_name' => $profile['plan_name'],
                'created_at' => $profile['created_at'],
                'company' => $profile['company'],
                'job_title' => $profile['job_title'],
                'phone' => $profile['phone'],
                'timezone' => $profile['timezone'],
                'email_preferences' => [
                    'email_reports' => (bool)($profile['email_reports'] ?? true),
                    'trial_reminders' => (bool)($profile['trial_reminders'] ?? true),
                    'security_alerts' => (bool)($profile['security_alerts'] ?? true),
                    'product_updates' => (bool)($profile['product_updates'] ?? false),
                    'marketing_emails' => (bool)($profile['marketing_emails'] ?? false)
                ],
                'usage' => [
                    'total_scans' => (int)$usage['total_scans'],
                    'monthly_scans' => (int)$usage['monthly_scans']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get profile error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve profile']);
    }
}

function handleUpdateProfile() {
    global $security, $db;
    
    // Require user authentication
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $company = $security->sanitizeInput($input['company'] ?? '');
    $jobTitle = $security->sanitizeInput($input['jobTitle'] ?? '');
    $phone = $security->sanitizeInput($input['phone'] ?? '');
    $timezone = $security->sanitizeInput($input['timezone'] ?? '');
    
    // Handle email preferences
    $emailReports = isset($input['emailReports']) ? (bool)$input['emailReports'] : null;
    $trialReminders = isset($input['trialReminders']) ? (bool)$input['trialReminders'] : null;
    $securityAlerts = isset($input['securityAlerts']) ? (bool)$input['securityAlerts'] : null;
    $productUpdates = isset($input['productUpdates']) ? (bool)$input['productUpdates'] : null;
    $marketingEmails = isset($input['marketingEmails']) ? (bool)$input['marketingEmails'] : null;
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }
    
    if (!$security->validateInput($email, 'email')) {
        $errors['email'] = 'Please enter a valid email address';
    }
    
    if (!empty($phone) && !preg_match('/^[\+]?[0-9\s\-\(\)]{10,}$/', $phone)) {
        $errors['phone'] = 'Please enter a valid phone number';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    // Check if email already exists for a different user
    $stmt = $db->query("SELECT id FROM users WHERE email = ? AND id != ?", [$email, $user['id']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists for another user']);
        return;
    }
    
    try {
        // Rate limiting for profile updates
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!$security->checkRateLimit("profile_update_{$user['id']}", 10, 3600)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many profile updates. Please try again later.']);
            return;
        }
        
        // Check if we need to add profile fields to users table
        $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'company'");
        $hasProfileFields = $stmt->fetch();
        
        if (!$hasProfileFields) {
            // Add profile fields to users table if they don't exist
            try {
                $db->query("ALTER TABLE users ADD COLUMN company VARCHAR(255) NULL AFTER email");
                $db->query("ALTER TABLE users ADD COLUMN job_title VARCHAR(255) NULL AFTER company");
                $db->query("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER job_title");
                $db->query("ALTER TABLE users ADD COLUMN timezone VARCHAR(100) NULL AFTER phone");
                
                // Add email preference fields
                $db->query("ALTER TABLE users ADD COLUMN email_reports BOOLEAN DEFAULT TRUE AFTER timezone");
                $db->query("ALTER TABLE users ADD COLUMN trial_reminders BOOLEAN DEFAULT TRUE AFTER email_reports");
                $db->query("ALTER TABLE users ADD COLUMN security_alerts BOOLEAN DEFAULT TRUE AFTER trial_reminders");
                $db->query("ALTER TABLE users ADD COLUMN product_updates BOOLEAN DEFAULT FALSE AFTER security_alerts");
                $db->query("ALTER TABLE users ADD COLUMN marketing_emails BOOLEAN DEFAULT FALSE AFTER product_updates");
                
                error_log("Successfully added profile and email preference fields to users table");
            } catch (Exception $e) {
                error_log("Error adding profile fields: " . $e->getMessage());
                // Continue execution even if some fields already exist
            }
        } else {
            // Check and add email preference fields if they don't exist
            try {
                $emailFieldsToAdd = [
                    'email_reports' => 'BOOLEAN DEFAULT TRUE',
                    'trial_reminders' => 'BOOLEAN DEFAULT TRUE', 
                    'security_alerts' => 'BOOLEAN DEFAULT TRUE',
                    'product_updates' => 'BOOLEAN DEFAULT FALSE',
                    'marketing_emails' => 'BOOLEAN DEFAULT FALSE'
                ];
                
                foreach ($emailFieldsToAdd as $fieldName => $fieldDefinition) {
                    $checkStmt = $db->query("SHOW COLUMNS FROM users LIKE '{$fieldName}'");
                    if (!$checkStmt->fetch()) {
                        $db->query("ALTER TABLE users ADD COLUMN {$fieldName} {$fieldDefinition}");
                        error_log("Added email preference field: {$fieldName}");
                    }
                }
            } catch (Exception $e) {
                error_log("Error adding email preference fields: " . $e->getMessage());
            }
        }
        
        // Build dynamic update query
        $updateFields = ['name = ?', 'email = ?', 'company = ?', 'job_title = ?', 'phone = ?', 'timezone = ?', 'updated_at = NOW()'];
        $params = [$name, $email, $company, $jobTitle, $phone, $timezone];
        
        // Add email preferences if provided
        if ($emailReports !== null) {
            $updateFields[] = 'email_reports = ?';
            $params[] = $emailReports;
        }
        if ($trialReminders !== null) {
            $updateFields[] = 'trial_reminders = ?';
            $params[] = $trialReminders;
        }
        if ($securityAlerts !== null) {
            $updateFields[] = 'security_alerts = ?';
            $params[] = $securityAlerts;
        }
        if ($productUpdates !== null) {
            $updateFields[] = 'product_updates = ?';
            $params[] = $productUpdates;
        }
        if ($marketingEmails !== null) {
            $updateFields[] = 'marketing_emails = ?';
            $params[] = $marketingEmails;
        }
        
        $params[] = $user['id'];
        
        $stmt = $db->query(
            "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?",
            $params
        );
        
        // Log the action
        $security->logSecurityEvent('profile_updated', [
            'user_id' => $user['id'],
            'updated_fields' => array_merge(['name', 'email', 'company', 'job_title', 'phone', 'timezone'], 
                $emailReports !== null ? ['email_reports'] : [],
                $trialReminders !== null ? ['trial_reminders'] : [],
                $securityAlerts !== null ? ['security_alerts'] : [],
                $productUpdates !== null ? ['product_updates'] : [],
                $marketingEmails !== null ? ['marketing_emails'] : []
            )
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update profile error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
}

function handleUpdatePassword() {
    global $security, $db;
    
    // Require user authentication
    $user = requireAuth();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    $currentPassword = $input['currentPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    
    $errors = [];
    
    if (empty($currentPassword)) {
        $errors['currentPassword'] = 'Current password is required';
    }
    
    if (!$security->validateInput($newPassword, 'password', ['min_length' => 8])) {
        $errors['newPassword'] = 'New password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if ($newPassword !== $confirmPassword) {
        $errors['confirmPassword'] = 'Passwords do not match';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    try {
        // Rate limiting for password changes
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!$security->checkRateLimit("password_change_{$user['id']}", 3, 3600)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many password change attempts. Please try again later.']);
            return;
        }
        
        // Get current password hash
        $stmt = $db->query("SELECT password_hash FROM users WHERE id = ?", [$user['id']]);
        $userData = $stmt->fetch();
        
        if (!$userData) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Verify current password
        if (!verifyPassword($currentPassword, $userData['password_hash'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Current password is incorrect']);
            return;
        }
        
        // Update password
        $newPasswordHash = hashPassword($newPassword);
        $stmt = $db->query(
            "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
            [$newPasswordHash, $user['id']]
        );
        
        // Log the action
        $security->logSecurityEvent('password_changed', [
            'user_id' => $user['id']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update password error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update password']);
    }
}
?>