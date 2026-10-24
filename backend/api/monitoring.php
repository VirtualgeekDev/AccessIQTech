<?php
/**
 * Monitoring API Endpoints
 * Handles continuous monitoring setup and management
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

// Extract action from URL (e.g., /api/monitoring/setup -> setup)
$action = end($pathParts);

// Create monitoring table if it doesn't exist
createMonitoringTable();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetMonitoring();
            break;
        case 'POST':
            if ($action === 'setup') {
                handleSetupMonitoring();
            } else {
                handleCreateMonitoring();
            }
            break;
        case 'PUT':
            handleUpdateMonitoring();
            break;
        case 'DELETE':
            handleDeleteMonitoring();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Monitoring API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function createMonitoringTable() {
    global $db;
    
    try {
        $db->query("
            CREATE TABLE IF NOT EXISTS monitoring_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                url VARCHAR(2048) NOT NULL,
                frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
                alert_threshold ENUM('any', 'critical', 'score_drop') DEFAULT 'any',
                notification_email BOOLEAN DEFAULT TRUE,
                notification_slack BOOLEAN DEFAULT FALSE,
                notification_webhook BOOLEAN DEFAULT FALSE,
                webhook_url VARCHAR(2048) NULL,
                slack_channel VARCHAR(255) NULL,
                is_active BOOLEAN DEFAULT TRUE,
                last_scan_at TIMESTAMP NULL,
                next_scan_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_next_scan (next_scan_at),
                INDEX idx_active (is_active)
            )
        ");
    } catch (Exception $e) {
        error_log("Failed to create monitoring_configs table: " . $e->getMessage());
    }
}

function handleGetMonitoring() {
    global $user, $db;
    
    try {
        $stmt = $db->query(
            "SELECT * FROM monitoring_configs WHERE user_id = ? ORDER BY created_at DESC",
            [$user['id']]
        );
        
        $configs = [];
        while ($row = $stmt->fetch()) {
            $configs[] = [
                'id' => (int)$row['id'],
                'url' => $row['url'],
                'frequency' => $row['frequency'],
                'alert_threshold' => $row['alert_threshold'],
                'notification_email' => (bool)$row['notification_email'],
                'notification_slack' => (bool)$row['notification_slack'],
                'notification_webhook' => (bool)$row['notification_webhook'],
                'webhook_url' => $row['webhook_url'],
                'slack_channel' => $row['slack_channel'],
                'is_active' => (bool)$row['is_active'],
                'last_scan_at' => $row['last_scan_at'],
                'next_scan_at' => $row['next_scan_at'],
                'created_at' => $row['created_at']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'monitoring_configs' => $configs
        ]);
        
    } catch (Exception $e) {
        error_log("Get monitoring error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve monitoring configurations']);
    }
}

function handleSetupMonitoring() {
    global $security, $db, $user;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate and sanitize input
    $url = $security->sanitizeInput($input['url'] ?? '', 'url');
    $frequency = $security->sanitizeInput($input['frequency'] ?? 'weekly');
    $alertThreshold = $security->sanitizeInput($input['alert_threshold'] ?? 'any');
    $notificationEmail = (bool)($input['notification_email'] ?? true);
    $notificationSlack = (bool)($input['notification_slack'] ?? false);
    $notificationWebhook = (bool)($input['notification_webhook'] ?? false);
    $webhookUrl = $security->sanitizeInput($input['webhook_url'] ?? '', 'url');
    $slackChannel = $security->sanitizeInput($input['slack_channel'] ?? '');
    
    $errors = [];
    
    if (!$security->validateInput($url, 'url')) {
        $errors['url'] = 'Please enter a valid URL';
    }
    
    if (!in_array($frequency, ['daily', 'weekly', 'monthly'])) {
        $errors['frequency'] = 'Invalid frequency selected';
    }
    
    if (!in_array($alertThreshold, ['any', 'critical', 'score_drop'])) {
        $errors['alert_threshold'] = 'Invalid alert threshold selected';
    }
    
    if ($notificationWebhook && !$security->validateInput($webhookUrl, 'url')) {
        $errors['webhook_url'] = 'Please enter a valid webhook URL';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    try {
        // Calculate next scan time
        $nextScanTime = calculateNextScanTime($frequency);
        
        // Check if monitoring already exists for this URL
        $existingStmt = $db->query(
            "SELECT id FROM monitoring_configs WHERE user_id = ? AND url = ?",
            [$user['id'], $url]
        );
        
        if ($existingStmt->fetch()) {
            // Update existing configuration
            $stmt = $db->query(
                "UPDATE monitoring_configs SET 
                 frequency = ?, alert_threshold = ?, notification_email = ?, 
                 notification_slack = ?, notification_webhook = ?, webhook_url = ?, 
                 slack_channel = ?, next_scan_at = ?, is_active = TRUE, updated_at = NOW()
                 WHERE user_id = ? AND url = ?",
                [$frequency, $alertThreshold, $notificationEmail, $notificationSlack, 
                 $notificationWebhook, $webhookUrl, $slackChannel, $nextScanTime, $user['id'], $url]
            );
            
            $message = 'Monitoring configuration updated successfully';
        } else {
            // Create new configuration
            $stmt = $db->query(
                "INSERT INTO monitoring_configs 
                 (user_id, url, frequency, alert_threshold, notification_email, 
                  notification_slack, notification_webhook, webhook_url, slack_channel, next_scan_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$user['id'], $url, $frequency, $alertThreshold, $notificationEmail, 
                 $notificationSlack, $notificationWebhook, $webhookUrl, $slackChannel, $nextScanTime]
            );
            
            $message = 'Monitoring configuration created successfully';
        }
        
        // Log the action
        $security->logSecurityEvent('monitoring_configured', [
            'user_id' => $user['id'],
            'url' => $url,
            'frequency' => $frequency,
            'alert_threshold' => $alertThreshold
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'next_scan_at' => $nextScanTime
        ]);
        
    } catch (Exception $e) {
        error_log("Setup monitoring error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to setup monitoring']);
    }
}

function calculateNextScanTime($frequency) {
    switch ($frequency) {
        case 'daily':
            return date('Y-m-d H:i:s', strtotime('+1 day'));
        case 'weekly':
            return date('Y-m-d H:i:s', strtotime('+1 week'));
        case 'monthly':
            return date('Y-m-d H:i:s', strtotime('+1 month'));
        default:
            return date('Y-m-d H:i:s', strtotime('+1 week'));
    }
}

function handleCreateMonitoring() {
    // Alias for setup for backward compatibility
    handleSetupMonitoring();
}

function handleUpdateMonitoring() {
    // Implementation for updating existing monitoring configs
    handleSetupMonitoring();
}

function handleDeleteMonitoring() {
    global $security, $db, $user;
    
    $configId = $_GET['id'] ?? '';
    
    if (empty($configId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Configuration ID is required']);
        return;
    }
    
    try {
        // Verify user owns this configuration
        $stmt = $db->query(
            "SELECT id FROM monitoring_configs WHERE id = ? AND user_id = ?",
            [$configId, $user['id']]
        );
        
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Monitoring configuration not found']);
            return;
        }
        
        // Delete the configuration
        $db->query(
            "DELETE FROM monitoring_configs WHERE id = ? AND user_id = ?",
            [$configId, $user['id']]
        );
        
        // Log the action
        $security->logSecurityEvent('monitoring_deleted', [
            'user_id' => $user['id'],
            'config_id' => $configId
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Monitoring configuration deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete monitoring error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete monitoring configuration']);
    }
}
?>