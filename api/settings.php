<?php
/**
 * Settings API Endpoints
 * Handles application-wide settings management
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

// Extract category from URL (e.g., /api/settings/payment -> payment)
$category = end($pathParts);

// Handle public settings endpoint (no auth required)
if ($category === 'public-settings') {
    handleGetPublicSettings();
    exit();
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetSettings($category);
            break;
        case 'PUT':
            handleUpdateSettings($category);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Settings API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleGetSettings($category = null) {
    global $db, $security;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    try {
        $whereClause = '';
        $params = [];
        
        // Filter by category if specified
        if ($category && $category !== 'settings') {
            switch ($category) {
                case 'payment':
                    $whereClause = "WHERE setting_key LIKE 'stripe_%' OR setting_key LIKE 'paypal_%'";
                    break;
                case 'email':
                    $whereClause = "WHERE setting_key LIKE 'smtp_%' OR setting_key = 'support_email'";
                    break;
                case 'general':
                    $whereClause = "WHERE setting_key IN ('site_name', 'trial_length_days', 'google_analytics_id')";
                    break;
                case 'security':
                    $whereClause = "WHERE setting_key LIKE '%_key' OR setting_key LIKE '%_secret' OR setting_key = 'sentry_dsn'";
                    break;
            }
        }
        
        $stmt = $db->query(
            "SELECT setting_key, setting_value, setting_type, is_encrypted, description 
             FROM settings {$whereClause} 
             ORDER BY setting_key",
            $params
        );
        
        $settings = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            
            // Decrypt encrypted values
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            
            // Convert value based on type
            switch ($row['setting_type']) {
                case 'boolean':
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    break;
                case 'integer':
                    $value = (int)$value;
                    break;
                case 'json':
                    $value = json_decode($value, true);
                    break;
            }
            
            $settings[$row['setting_key']] = [
                'value' => $value,
                'type' => $row['setting_type'],
                'encrypted' => (bool)$row['is_encrypted'],
                'description' => $row['description']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);
        
    } catch (Exception $e) {
        error_log("Get settings error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve settings']);
    }
}

function handleUpdateSettings($category = null) {
    global $security, $db;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    try {
        // Rate limiting for settings updates
        if (!$security->checkRateLimit("settings_update_{$admin['id']}", 20, 3600)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many settings updates. Please try again later.']);
            return;
        }
        
        $updatedSettings = [];
        $errors = [];
        
        foreach ($input as $key => $value) {
            // Validate setting key exists
            $stmt = $db->query(
                "SELECT setting_key, setting_type, is_encrypted FROM settings WHERE setting_key = ?",
                [$key]
            );
            
            $setting = $stmt->fetch();
            
            if (!$setting) {
                $errors[$key] = 'Setting does not exist';
                continue;
            }
            
            // Validate value based on type
            $validatedValue = validateSettingValue($value, $setting['setting_type'], $key);
            if ($validatedValue === false) {
                $errors[$key] = 'Invalid value for setting type';
                continue;
            }
            
            // Prepare value for storage
            $storageValue = $validatedValue;
            
            // Convert to string for storage
            switch ($setting['setting_type']) {
                case 'boolean':
                    $storageValue = $validatedValue ? 'true' : 'false';
                    break;
                case 'integer':
                    $storageValue = (string)$validatedValue;
                    break;
                case 'json':
                    $storageValue = json_encode($validatedValue);
                    break;
            }
            
            // Encrypt if needed
            if ($setting['is_encrypted'] && !empty($storageValue)) {
                $storageValue = $security->encrypt($storageValue);
            }
            
            // Update setting
            $updateStmt = $db->query(
                "UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
                [$storageValue, $key]
            );
            
            $updatedSettings[] = $key;
        }
        
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['errors' => $errors]);
            return;
        }
        
        // Log the action
        $security->logSecurityEvent('settings_updated', [
            'admin_user_id' => $admin['id'],
            'updated_settings' => $updatedSettings,
            'category' => $category
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Settings updated successfully',
            'updated_count' => count($updatedSettings)
        ]);
        
    } catch (Exception $e) {
        error_log("Update settings error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update settings']);
    }
}

function handleGetPublicSettings() {
    global $db, $security;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    try {
        // Get public settings that don't require authentication
        $stmt = $db->query(
            "SELECT setting_key, setting_value, setting_type, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('stripe_enabled', 'paypal_enabled', 'trial_length_days', 'payment_required')
             ORDER BY setting_key"
        );
        
        $settings = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            
            // Decrypt encrypted values
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            
            // Convert value based on type
            switch ($row['setting_type']) {
                case 'boolean':
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    break;
                case 'integer':
                    $value = (int)$value;
                    break;
            }
            
            $settings[$row['setting_key']] = $value;
        }
        
        echo json_encode([
            'success' => true,
            'settings' => [
                'stripe_enabled' => $settings['stripe_enabled'] ?? false,
                'paypal_enabled' => $settings['paypal_enabled'] ?? false,
                'trial_length_days' => $settings['trial_length_days'] ?? 8,
                'payment_required' => $settings['payment_required'] ?? true
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Get public settings error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to retrieve settings']);
    }
}

function validateSettingValue($value, $type, $key) {
    switch ($type) {
        case 'boolean':
            $boolValue = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            return $boolValue !== null ? $boolValue : false;
            
        case 'integer':
            $intValue = filter_var($value, FILTER_VALIDATE_INT);
            if ($intValue === false) return false;
            
            // Additional validation for specific settings
            if ($key === 'trial_length_days' && ($intValue < 1 || $intValue > 365)) {
                return false;
            }
            if ($key === 'smtp_port' && ($intValue < 1 || $intValue > 65535)) {
                return false;
            }
            
            return $intValue;
            
        case 'json':
            if (is_array($value) || is_object($value)) {
                return $value;
            }
            return false;
            
        case 'string':
        default:
            if (!is_string($value)) return false;
            
            // Additional validation for specific settings
            switch ($key) {
                case 'support_email':
                case 'smtp_username':
                    return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
                    
                case 'smtp_host':
                    return !empty(trim($value));
                    
                case 'smtp_encryption':
                    return in_array($value, ['tls', 'ssl', 'none']);
                    
                case 'google_analytics_id':
                    return empty($value) || preg_match('/^(G-|UA-|GT-)/', $value);
                    
                default:
                    return true;
            }
    }
}

// Test connection endpoints for payment gateways
if (isset($_GET['test']) && $_GET['test'] === 'stripe') {
    handleTestStripeConnection();
    exit();
}

if (isset($_GET['test']) && $_GET['test'] === 'paypal') {
    handleTestPayPalConnection();
    exit();
}

function handleTestStripeConnection() {
    global $db, $security;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    try {
        // Get Stripe settings
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('stripe_secret_key', 'stripe_publishable_key')"
        );
        
        $stripeSettings = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            $stripeSettings[$row['setting_key']] = $value;
        }
        
        $secretKey = $stripeSettings['stripe_secret_key'] ?? '';
        
        if (empty($secretKey)) {
            echo json_encode([
                'success' => false,
                'error' => 'Stripe secret key not configured'
            ]);
            return;
        }
        
        // Test Stripe API connection (simplified test)
        $testResult = testStripeAPI($secretKey);
        
        echo json_encode([
            'success' => $testResult['success'],
            'message' => $testResult['message']
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to test Stripe connection: ' . $e->getMessage()
        ]);
    }
}

function handleTestPayPalConnection() {
    global $db, $security;
    
    // Require admin authentication
    $admin = requireAdmin();
    
    try {
        // Get PayPal settings
        $stmt = $db->query(
            "SELECT setting_key, setting_value, is_encrypted 
             FROM settings 
             WHERE setting_key IN ('paypal_client_id', 'paypal_secret')"
        );
        
        $paypalSettings = [];
        while ($row = $stmt->fetch()) {
            $value = $row['setting_value'];
            if ($row['is_encrypted'] && !empty($value)) {
                $value = $security->decrypt($value);
            }
            $paypalSettings[$row['setting_key']] = $value;
        }
        
        $clientId = $paypalSettings['paypal_client_id'] ?? '';
        $secret = $paypalSettings['paypal_secret'] ?? '';
        
        if (empty($clientId) || empty($secret)) {
            echo json_encode([
                'success' => false,
                'error' => 'PayPal credentials not configured'
            ]);
            return;
        }
        
        // Test PayPal API connection (simplified test)
        $testResult = testPayPalAPI($clientId, $secret);
        
        echo json_encode([
            'success' => $testResult['success'],
            'message' => $testResult['message']
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to test PayPal connection: ' . $e->getMessage()
        ]);
    }
}

function testStripeAPI($secretKey) {
    try {
        // Initialize Stripe with the provided key
        \Stripe\Stripe::setApiKey($secretKey);
        
        // Make a simple API call to test the connection
        $account = \Stripe\Account::retrieve();
        
        if ($account && $account->id) {
            return [
                'success' => true,
                'message' => 'Stripe connection test successful',
                'account_id' => $account->id,
                'business_profile' => $account->business_profile->name ?? 'N/A'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Unable to retrieve Stripe account information'
            ];
        }
        
    } catch (\Stripe\Exception\AuthenticationException $e) {
        return [
            'success' => false,
            'message' => 'Invalid Stripe API key'
        ];
    } catch (\Stripe\Exception\ApiConnectionException $e) {
        return [
            'success' => false,
            'message' => 'Unable to connect to Stripe API'
        ];
    } catch (\Exception $e) {
        return [
            'success' => false,
            'message' => 'Stripe connection test failed: ' . $e->getMessage()
        ];
    }
}

function testPayPalAPI($clientId, $secret) {
    $environment = $_ENV['PAYPAL_ENVIRONMENT'] ?? 'sandbox';
    $baseUrl = $environment === 'sandbox' 
        ? 'https://api.sandbox.paypal.com' 
        : 'https://api.paypal.com';
    
    try {
        // Test PayPal API connection by getting access token
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $baseUrl . '/v1/oauth2/token',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $clientId . ':' . $secret,
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Accept-Language: en_US',
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            return [
                'success' => false,
                'message' => 'Connection to PayPal failed: ' . $curlError
            ];
        }
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data && isset($data['access_token'])) {
                return [
                    'success' => true,
                    'message' => 'PayPal connection test successful',
                    'environment' => $environment,
                    'token_type' => $data['token_type'] ?? 'Bearer',
                    'expires_in' => $data['expires_in'] ?? 3600
                ];
            }
        }
        
        return [
            'success' => false,
            'message' => 'PayPal authentication failed: Invalid response'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'PayPal connection test failed: ' . $e->getMessage()
        ];
    }
}
?>