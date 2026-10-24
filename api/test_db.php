<?php
/**
 * Database Connection Test
 * Access this file to verify database connectivity
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

header('Content-Type: application/json');

try {
    // Test database connection
    $db = Database::getInstance();
    
    // Test basic query
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    // Test if tables exist
    $tables = [];
    $stmt = $db->query("SHOW TABLES");
    while ($row = $stmt->fetch()) {
        $tables[] = array_values($row)[0];
    }
    
    // Test users table specifically
    $userCount = 0;
    if (in_array('users', $tables)) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $userResult = $stmt->fetch();
        $userCount = $userResult['count'];
    }
    
    // Test plans table
    $planCount = 0;
    if (in_array('plans', $tables)) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM plans");
        $planResult = $stmt->fetch();
        $planCount = $planResult['count'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'database_info' => [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'database' => $_ENV['DB_NAME'] ?? 'accessiq_tech',
            'connection_test' => $result ? 'PASSED' : 'FAILED',
            'tables_found' => count($tables),
            'table_list' => $tables,
            'users_count' => $userCount,
            'plans_count' => $planCount
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'database_config' => [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'database' => $_ENV['DB_NAME'] ?? 'accessiq_tech',
            'user' => $_ENV['DB_USER'] ?? 'root'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>