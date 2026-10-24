<?php
/**
 * Simple Database Connection Test
 * Place this file in your website root directory
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables if .env file exists
if (file_exists('.env')) {
    $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '"\'');
        }
    }
}

require_once __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');

try {
    // Database configuration
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'accessiq_tech';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';
    
    // Create PDO connection
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Test basic query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    // Check if tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Count users if table exists
    $userCount = 0;
    if (in_array('users', $tables)) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $userResult = $stmt->fetch();
        $userCount = $userResult['count'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful!',
        'database_info' => [
            'host' => $host,
            'database' => $dbname,
            'connection_test' => $result ? 'PASSED' : 'FAILED',
            'tables_found' => count($tables),
            'table_list' => $tables,
            'users_count' => $userCount,
            'php_version' => phpversion(),
            'pdo_available' => extension_loaded('pdo') ? 'YES' : 'NO',
            'mysql_available' => extension_loaded('pdo_mysql') ? 'YES' : 'NO'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage(),
        'database_config' => [
            'host' => $host ?? 'not set',
            'database' => $dbname ?? 'not set',
            'user' => $username ?? 'not set',
            'password_set' => !empty($password) ? 'YES' : 'NO'
        ],
        'php_info' => [
            'php_version' => phpversion(),
            'pdo_available' => extension_loaded('pdo') ? 'YES' : 'NO',
            'mysql_available' => extension_loaded('pdo_mysql') ? 'YES' : 'NO'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'General error: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>