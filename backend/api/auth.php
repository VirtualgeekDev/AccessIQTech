<?php
/**
 * Authentication API Endpoints
 * Handles user registration, login, logout, email verification, and password reset
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
require_once '../config/email.php';
require_once '../config/security.php';
require_once '../middleware/auth.php';

// Enable error reporting for debugging
if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session for authentication
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

// Parse the request path to determine the action
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract action from URL (e.g., /api/auth/login -> login)
$action = end($pathParts);

try {
    switch ($action) {
        case 'signup':
            handleSignup();
            break;
        case 'login':
            handleLogin();
            break;
        case 'logout':
            handleLogout();
            break;
        case 'verify-email':
            handleEmailVerification();
            break;
        case 'validate-reset-token':
            handleValidateResetToken();
            break;
        case 'reset-password':
            handleResetPassword();
            break;
        case 'request-reset':
            handleRequestPasswordReset();
            break;
        case 'me':
            handleGetCurrentUser();
            break;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    error_log("Auth API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleSignup() {
    global $security, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $password = $input['password'] ?? '';
    
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
    
    // Rate limiting
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!$security->checkRateLimit("signup_{$clientIp}", 3, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many signup attempts. Please try again later.']);
        return;
    }
    
    // Create user
    $passwordHash = hashPassword($password);
    $verificationToken = generateSecureToken();
    $trialExpiresAt = date('Y-m-d H:i:s', strtotime('+14 days'));
    
    $stmt = $db->query(
        "INSERT INTO users (name, email, password_hash, verification_token, trial_expires_at) VALUES (?, ?, ?, ?, ?)",
        [$name, $email, $passwordHash, $verificationToken, $trialExpiresAt]
    );
    
    $userId = $db->lastInsertId();
    
    // Create trial subscription
    $starterPlanStmt = $db->query("SELECT id FROM plans WHERE slug = 'starter' LIMIT 1");
    $starterPlan = $starterPlanStmt->fetch();
    
    if ($starterPlan) {
        $db->query(
            "INSERT INTO subscriptions (user_id, plan_id, status, trial_start, trial_end) VALUES (?, ?, 'trialing', NOW(), ?)",
            [$userId, $starterPlan['id'], $trialExpiresAt]
        );
    }
    
    // Send verification email
    $emailSent = false;
    try {
        $emailService = new EmailService();
        $user = [
            'id' => $userId,
            'name' => $name,
            'email' => $email
        ];
        $emailSent = $emailService->sendVerificationEmail($user);
    } catch (Exception $e) {
        error_log("Email sending failed: " . $e->getMessage());
        // Don't fail signup if email fails
    }
    
    // Log security event
    $security->logSecurityEvent('user_signup', [
        'user_id' => $userId,
        'email' => $email,
        'verification_email_sent' => $emailSent
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully. Please check your email to verify your account.',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'user',
            'email_verified' => false,
            'trial_expires_at' => $trialExpiresAt
        ]
    ]);
}

function handleLogin() {
    global $security, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    // Rate limiting
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!$security->checkRateLimit("login_{$clientIp}", 5, 900)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many login attempts. Please try again later.']);
        return;
    }
    
    // Find user
    $stmt = $db->query(
        "SELECT id, name, email, password_hash, role, email_verified, trial_expires_at FROM users WHERE email = ?",
        [$email]
    );
    
    $user = $stmt->fetch();
    
    if (!$user || !verifyPassword($password, $user['password_hash'])) {
        // Log failed login attempt
        $security->logSecurityEvent('login_failed', [
            'email' => $email,
            'ip' => $clientIp
        ], 'warning');
        
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        return;
    }
    
    // Check if email is verified
    if (!$user['email_verified']) {
        http_response_code(403);
        echo json_encode(['error' => 'Please verify your email address before logging in']);
        return;
    }
    
    // Get subscription status
    $subStmt = $db->query(
        "SELECT s.status, p.name as plan_name FROM subscriptions s 
         JOIN plans p ON s.plan_id = p.id 
         WHERE s.user_id = ? ORDER BY s.started_at DESC LIMIT 1",
        [$user['id']]
    );
    
    $subscription = $subStmt->fetch();
    $subscriptionStatus = $subscription ? $subscription['status'] : 'expired';
    
    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    
    // Log successful login
    $security->logSecurityEvent('login_success', [
        'user_id' => $user['id'],
        'email' => $email
    ]);
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'email_verified' => (bool)$user['email_verified'],
            'trial_expires_at' => $user['trial_expires_at'],
            'subscription_status' => $subscriptionStatus
        ]
    ]);
}

function handleLogout() {
    global $security;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    
    // Destroy session
    session_destroy();
    
    // Log logout
    if ($userId) {
        $security->logSecurityEvent('logout', ['user_id' => $userId]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function handleEmailVerification() {
    global $security, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['error' => 'Verification token is required']);
        return;
    }
    
    // Find user with this token
    $stmt = $db->query(
        "SELECT id, name, email, email_verified FROM users WHERE verification_token = ?",
        [$token]
    );
    
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired verification token']);
        return;
    }
    
    if ($user['email_verified']) {
        echo json_encode(['success' => true, 'message' => 'Email already verified']);
        return;
    }
    
    // Verify email
    $db->query(
        "UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?",
        [$user['id']]
    );
    
    // Log verification
    $security->logSecurityEvent('email_verified', [
        'user_id' => $user['id'],
        'email' => $user['email']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Email verified successfully! You can now log in.'
    ]);
}

function handleRequestPasswordReset() {
    global $security, $db, $emailService;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    
    if (!$security->validateInput($email, 'email')) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address']);
        return;
    }
    
    // Rate limiting
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!$security->checkRateLimit("reset_{$clientIp}", 3, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many reset requests. Please try again later.']);
        return;
    }
    
    // Find user
    $stmt = $db->query("SELECT id, name, email FROM users WHERE email = ?", [$email]);
    $user = $stmt->fetch();
    
    // Always return success to prevent email enumeration
    if (!$user) {
        echo json_encode(['success' => true, 'message' => 'If an account exists, a reset link has been sent']);
        return;
    }
    
    // Generate reset token
    $resetToken = generateSecureToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $db->query(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
        [$resetToken, $expiresAt, $user['id']]
    );
    
    // Send reset email
    $emailSent = $emailService->sendPasswordResetEmail($user);
    
    // Log reset request
    $security->logSecurityEvent('password_reset_requested', [
        'user_id' => $user['id'],
        'email' => $email,
        'email_sent' => $emailSent
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'If an account exists, a reset link has been sent'
    ]);
}

function handleValidateResetToken() {
    global $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['error' => 'Reset token is required']);
        return;
    }
    
    // Find user with valid token
    $stmt = $db->query(
        "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
        [$token]
    );
    
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        return;
    }
    
    echo json_encode(['success' => true, 'message' => 'Token is valid']);
}

function handleResetPassword() {
    global $security, $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($token) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Token and password are required']);
        return;
    }
    
    if (!$security->validateInput($password, 'password', ['min_length' => 8])) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters with uppercase, lowercase, and number']);
        return;
    }
    
    // Find user with valid token
    $stmt = $db->query(
        "SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
        [$token]
    );
    
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        return;
    }
    
    // Update password
    $passwordHash = hashPassword($password);
    $db->query(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [$passwordHash, $user['id']]
    );
    
    // Log password reset
    $security->logSecurityEvent('password_reset_completed', [
        'user_id' => $user['id'],
        'email' => $user['email']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully'
    ]);
}

function handleGetCurrentUser() {
    global $db;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        return;
    }
    
    // Get user details
    $stmt = $db->query(
        "SELECT id, name, email, role, email_verified, trial_expires_at FROM users WHERE id = ?",
        [$userId]
    );
    
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    // Get subscription status
    $subStmt = $db->query(
        "SELECT s.status FROM subscriptions s WHERE s.user_id = ? ORDER BY s.started_at DESC LIMIT 1",
        [$user['id']]
    );
    
    $subscription = $subStmt->fetch();
    $subscriptionStatus = $subscription ? $subscription['status'] : 'expired';
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'email_verified' => (bool)$user['email_verified'],
            'trial_expires_at' => $user['trial_expires_at'],
            'subscription_status' => $subscriptionStatus
        ]
    ]);
}