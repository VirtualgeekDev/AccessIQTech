<?php
/**
 * Authentication Middleware
 */

require_once '../config/database.php';

function authenticateUser() {
    try {
        $db = Database::getInstance();
        
        // Use session-based authentication
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        
        $stmt = $db->query(
            "SELECT id, name, email, role, email_verified, trial_expires_at FROM users WHERE id = ?",
            [$_SESSION['user_id']]
        );
        
        $user = $stmt->fetch();
        
        if (!$user) {
            // User not found, clear session
            session_destroy();
            return null;
        }
        
        return $user;
        
    } catch (Exception $e) {
        error_log("Authentication error: " . $e->getMessage());
        return null;
    }
}

function requireAuth() {
    $user = authenticateUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit();
    }
    return $user;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function generateSecureToken() {
    return bin2hex(random_bytes(32));
}

function isTokenExpired($expiresAt) {
    return strtotime($expiresAt) < time();
}