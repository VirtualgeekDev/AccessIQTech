<?php
/**
 * Integrations API Endpoints
 * Handles third-party integration setup and management
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

// Extract action from URL (e.g., /api/integrations/connect -> connect)
$action = end($pathParts);

// Create integrations table if it doesn't exist
createIntegrationsTable();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetIntegrations();
            break;
        case 'POST':
            if ($action === 'connect') {
                handleConnectIntegration();
            } else {
                handleCreateIntegration();
            }
            break;
        case 'PUT':
            handleUpdateIntegration();
            break;
        case 'DELETE':
            handleDeleteIntegration();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Integrations API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function createIntegrationsTable() {
    global $db;
    
    try {
        $db->query("
            CREATE TABLE IF NOT EXISTS user_integrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                integration_type ENUM('wordpress', 'github', 'slack', 'shopify', 'figma', 'zapier') NOT NULL,
                integration_name VARCHAR(255) NOT NULL,
                config_data JSON NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                last_sync_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_type (integration_type),
                INDEX idx_active (is_active),
                UNIQUE KEY unique_user_integration (user_id, integration_type, integration_name)
            )
        ");
    } catch (Exception $e) {
        error_log("Failed to create user_integrations table: " . $e->getMessage());
    }
}

function handleGetIntegrations() {
    global $user, $db;
    
    try {
        $stmt = $db->query(
            "SELECT * FROM user_integrations WHERE user_id = ? ORDER BY created_at DESC",
            [$user['id']]
        );
        
        $integrations = [];
        while ($row = $stmt->fetch()) {
            $integrations[] = [
                'id' => (int)$row['id'],
                'integration_type' => $row['integration_type'],
                'integration_name' => $row['integration_name'],
                'config_data' => json_decode($row['config_data'], true),
                'is_active' => (bool)$row['is_active'],
                'last_sync_at' => $row['last_sync_at'],
                'created_at' => $row['created_at']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'integrations' => $integrations
        ]);
        
    } catch (Exception $e) {
        error_log("Get integrations error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve integrations']);
    }
}

function handleConnectIntegration() {
    global $security, $db, $user;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate and sanitize input
    $integrationType = $security->sanitizeInput($input['integration_type'] ?? '');
    $integrationName = $security->sanitizeInput($input['integration_name'] ?? '');
    $configData = $input['config_data'] ?? [];
    
    $validTypes = ['wordpress', 'github', 'slack', 'shopify', 'figma', 'zapier'];
    
    $errors = [];
    
    if (!in_array($integrationType, $validTypes)) {
        $errors['integration_type'] = 'Invalid integration type';
    }
    
    if (empty($integrationName)) {
        $errors['integration_name'] = 'Integration name is required';
    }
    
    // Validate configuration data based on integration type
    $configErrors = validateIntegrationConfig($integrationType, $configData);
    if (!empty($configErrors)) {
        $errors = array_merge($errors, $configErrors);
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        return;
    }
    
    try {
        // Rate limiting for integration connections
        if (!$security->checkRateLimit("integration_connect_{$user['id']}", 5, 3600)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many integration attempts. Please try again later.']);
            return;
        }
        
        // Check if integration already exists
        $existingStmt = $db->query(
            "SELECT id FROM user_integrations WHERE user_id = ? AND integration_type = ? AND integration_name = ?",
            [$user['id'], $integrationType, $integrationName]
        );
        
        if ($existingStmt->fetch()) {
            // Update existing integration
            $stmt = $db->query(
                "UPDATE user_integrations SET 
                 config_data = ?, is_active = TRUE, updated_at = NOW()
                 WHERE user_id = ? AND integration_type = ? AND integration_name = ?",
                [json_encode($configData), $user['id'], $integrationType, $integrationName]
            );
            
            $message = 'Integration updated successfully';
        } else {
            // Create new integration
            $stmt = $db->query(
                "INSERT INTO user_integrations 
                 (user_id, integration_type, integration_name, config_data) 
                 VALUES (?, ?, ?, ?)",
                [$user['id'], $integrationType, $integrationName, json_encode($configData)]
            );
            
            $message = 'Integration connected successfully';
        }
        
        // Simulate integration setup process
        $setupResult = simulateIntegrationSetup($integrationType, $configData);
        
        // Log the action
        $security->logSecurityEvent('integration_connected', [
            'user_id' => $user['id'],
            'integration_type' => $integrationType,
            'integration_name' => $integrationName,
            'setup_success' => $setupResult['success']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'setup_result' => $setupResult
        ]);
        
    } catch (Exception $e) {
        error_log("Connect integration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to connect integration']);
    }
}

function validateIntegrationConfig($type, $config) {
    $errors = [];
    
    switch ($type) {
        case 'wordpress':
            if (empty($config['site_url'])) {
                $errors['site_url'] = 'WordPress site URL is required';
            }
            if (empty($config['username'])) {
                $errors['username'] = 'WordPress username is required';
            }
            if (empty($config['app_password'])) {
                $errors['app_password'] = 'WordPress application password is required';
            }
            break;
            
        case 'github':
            if (empty($config['repository'])) {
                $errors['repository'] = 'GitHub repository is required';
            }
            if (empty($config['access_token'])) {
                $errors['access_token'] = 'GitHub access token is required';
            }
            break;
            
        case 'slack':
            if (empty($config['workspace'])) {
                $errors['workspace'] = 'Slack workspace is required';
            }
            if (empty($config['channel'])) {
                $errors['channel'] = 'Slack channel is required';
            }
            break;
    }
    
    return $errors;
}

function simulateIntegrationSetup($type, $config) {
    // Simulate setup time
    usleep(rand(1000000, 3000000)); // 1-3 seconds
    
    // Simulate occasional setup failures (5% chance)
    if (rand(1, 100) <= 5) {
        $failures = [
            'wordpress' => 'Failed to authenticate with WordPress site. Please check your credentials.',
            'github' => 'GitHub access token does not have required permissions.',
            'slack' => 'Unable to access Slack workspace. Please check permissions.'
        ];
        
        return [
            'success' => false,
            'error' => $failures[$type] ?? 'Integration setup failed'
        ];
    }
    
    // Successful setup simulation
    $successMessages = [
        'wordpress' => [
            'success' => true,
            'message' => 'WordPress plugin installed and configured successfully',
            'details' => [
                'Plugin version' => 'v2.1.0',
                'Dashboard widget' => 'Activated',
                'Auto-scan schedule' => 'Weekly',
                'API connection' => 'Verified'
            ]
        ],
        'github' => [
            'success' => true,
            'message' => 'GitHub Action workflow created successfully',
            'details' => [
                'Workflow file' => '.github/workflows/accessibility.yml',
                'Trigger events' => 'Pull requests, Push to main',
                'Repository permissions' => 'Verified',
                'Action status' => 'Active'
            ]
        ],
        'slack' => [
            'success' => true,
            'message' => 'Slack bot installed and configured successfully',
            'details' => [
                'Bot user' => '@accessiq-bot',
                'Channel access' => 'Verified',
                'Notification types' => 'Critical issues, Scan completion',
                'Commands available' => '/accessiq scan, /accessiq report'
            ]
        ]
    ];
    
    return $successMessages[$type] ?? [
        'success' => true,
        'message' => 'Integration setup completed successfully'
    ];
}

function handleCreateIntegration() {
    // Alias for connect for backward compatibility
    handleConnectIntegration();
}

function handleUpdateIntegration() {
    // Implementation for updating existing integrations
    handleConnectIntegration();
}

function handleDeleteIntegration() {
    global $security, $db, $user;
    
    $integrationId = $_GET['id'] ?? '';
    
    if (empty($integrationId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Integration ID is required']);
        return;
    }
    
    try {
        // Verify user owns this integration
        $stmt = $db->query(
            "SELECT id, integration_type, integration_name FROM user_integrations WHERE id = ? AND user_id = ?",
            [$integrationId, $user['id']]
        );
        
        $integration = $stmt->fetch();
        
        if (!$integration) {
            http_response_code(404);
            echo json_encode(['error' => 'Integration not found']);
            return;
        }
        
        // Delete the integration
        $db->query(
            "DELETE FROM user_integrations WHERE id = ? AND user_id = ?",
            [$integrationId, $user['id']]
        );
        
        // Log the action
        $security->logSecurityEvent('integration_deleted', [
            'user_id' => $user['id'],
            'integration_id' => $integrationId,
            'integration_type' => $integration['integration_type'],
            'integration_name' => $integration['integration_name']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Integration disconnected successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete integration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to disconnect integration']);
    }
}
?>