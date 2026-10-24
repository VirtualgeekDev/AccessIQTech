<?php
/**
 * Security Configuration and Utilities
 */

class SecurityManager {
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Generate CSRF token
     */
    public function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_token_time'] = time();
        
        return $token;
    }
    
    /**
     * Verify CSRF token
     */
    public function verifyCSRFToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            return false;
        }
        
        // Check token expiration (1 hour)
        if (time() - $_SESSION['csrf_token_time'] > 3600) {
            unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Sanitize input data
     */
    public function sanitizeInput($input, $type = 'string') {
        switch ($type) {
            case 'email':
                return filter_var(trim($input), FILTER_SANITIZE_EMAIL);
            case 'url':
                return filter_var(trim($input), FILTER_SANITIZE_URL);
            case 'int':
                return filter_var($input, FILTER_SANITIZE_NUMBER_INT);
            case 'float':
                return filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            case 'html':
                return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
            default:
                return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
        }
    }
    
    /**
     * Validate input data
     */
    public function validateInput($input, $type, $options = []) {
        switch ($type) {
            case 'email':
                return filter_var($input, FILTER_VALIDATE_EMAIL) !== false;
            case 'url':
                return filter_var($input, FILTER_VALIDATE_URL) !== false;
            case 'int':
                $min = $options['min'] ?? null;
                $max = $options['max'] ?? null;
                $flags = 0;
                $filterOptions = [];
                
                if ($min !== null) {
                    $filterOptions['min_range'] = $min;
                }
                if ($max !== null) {
                    $filterOptions['max_range'] = $max;
                }
                
                return filter_var($input, FILTER_VALIDATE_INT, [
                    'options' => $filterOptions
                ]) !== false;
            case 'password':
                $minLength = $options['min_length'] ?? 8;
                $requireUpper = $options['require_upper'] ?? true;
                $requireLower = $options['require_lower'] ?? true;
                $requireNumber = $options['require_number'] ?? true;
                $requireSpecial = $options['require_special'] ?? false;
                
                if (strlen($input) < $minLength) return false;
                if ($requireUpper && !preg_match('/[A-Z]/', $input)) return false;
                if ($requireLower && !preg_match('/[a-z]/', $input)) return false;
                if ($requireNumber && !preg_match('/\d/', $input)) return false;
                if ($requireSpecial && !preg_match('/[^A-Za-z0-9]/', $input)) return false;
                
                return true;
            default:
                return !empty(trim($input));
        }
    }
    
    /**
     * Rate limiting
     */
    public function checkRateLimit($identifier, $maxAttempts = 5, $timeWindow = 300) {
        $db = Database::getInstance();
        
        // Clean old attempts
        $db->query(
            "DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL ? SECOND)",
            [$timeWindow]
        );
        
        // Count recent attempts
        $stmt = $db->query(
            "SELECT COUNT(*) as attempts FROM rate_limits WHERE identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)",
            [$identifier, $timeWindow]
        );
        
        $result = $stmt->fetch();
        $attempts = (int)$result['attempts'];
        
        if ($attempts >= $maxAttempts) {
            return false;
        }
        
        // Record this attempt
        $db->query(
            "INSERT INTO rate_limits (identifier, created_at) VALUES (?, NOW())",
            [$identifier]
        );
        
        return true;
    }
    
    /**
     * Generate secure random string
     */
    public function generateSecureString($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Hash sensitive data
     */
    public function hashData($data, $salt = null) {
        if ($salt === null) {
            $salt = $this->generateSecureString(16);
        }
        
        return [
            'hash' => hash('sha256', $data . $salt),
            'salt' => $salt
        ];
    }
    
    /**
     * Verify hashed data
     */
    public function verifyHash($data, $hash, $salt) {
        return hash_equals($hash, hash('sha256', $data . $salt));
    }
    
    /**
     * Encrypt sensitive data
     */
    public function encrypt($data) {
        if (empty($data)) return '';
        
        $key = $_ENV['ENCRYPTION_KEY'] ?? 'default-key-change-in-production';
        
        // Ensure key is proper length for AES-256
        $key = hash('sha256', $key, true);
        
        // Generate proper IV
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        
        if ($encrypted === false) {
            throw new Exception('Encryption failed');
        }
        
        return base64_encode($iv . $encrypted);
    }
    
    /**
     * Decrypt sensitive data
     */
    public function decrypt($encryptedData) {
        if (empty($encryptedData)) return '';
        
        try {
            $key = $_ENV['ENCRYPTION_KEY'] ?? 'default-key-change-in-production';
            
            // Ensure key is proper length for AES-256
            $key = hash('sha256', $key, true);
            
            $data = base64_decode($encryptedData);
            
            // Check if data is long enough to contain IV + encrypted content
            if (strlen($data) < 16) {
                // Data is too short to be properly encrypted, return as-is
                error_log("Decrypt warning: Data too short, returning original value");
                return $encryptedData;
            }
            
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
            
            // Verify IV is exactly 16 bytes
            if (strlen($iv) !== 16) {
                error_log("Decrypt warning: Invalid IV length (" . strlen($iv) . " bytes), returning original value");
                return $encryptedData;
            }
            
            $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
            
            if ($decrypted === false) {
                error_log("Decrypt warning: Decryption failed, returning original value");
                return $encryptedData;
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log("Decrypt error: " . $e->getMessage() . ", returning original value");
            return $encryptedData;
        }
    }
    
    /**
     * Check if data appears to be encrypted
     */
    public function isEncrypted($data) {
        if (empty($data)) return false;
        
        // Check if it's base64 encoded and has minimum length
        $decoded = base64_decode($data, true);
        return $decoded !== false && strlen($decoded) >= 16;
    }
    
    /**
     * Safely encrypt data, handling already encrypted values
     */
    public function safeEncrypt($data) {
        if (empty($data)) return '';
        
        // Don't re-encrypt already encrypted data
        if ($this->isEncrypted($data)) {
            return $data;
        }
        
        return $this->encrypt($data);
    }
    
    /**
     * Safely decrypt data, handling unencrypted values
     */
    public function safeDecrypt($data) {
        if (empty($data)) return '';
        
        // If data doesn't appear encrypted, return as-is
        if (!$this->isEncrypted($data)) {
            return $data;
        }
        
        return $this->decrypt($data);
    }
    
    /**
     * Log security events
     */
    public function logSecurityEvent($event, $details = [], $severity = 'info') {
        $db = Database::getInstance();
        
        $logData = [
            'event' => $event,
            'details' => json_encode($details),
            'severity' => $severity,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $db->query(
            "INSERT INTO security_logs (event, details, severity, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            array_values($logData)
        );
        
        // Also log to file for critical events
        if ($severity === 'critical' || $severity === 'error') {
            error_log("SECURITY [{$severity}] {$event}: " . json_encode($details));
        }
    }
}

// Create rate_limits table if it doesn't exist
try {
    $db = Database::getInstance();
    $db->query("
        CREATE TABLE IF NOT EXISTS rate_limits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            identifier VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_identifier_time (identifier, created_at)
        )
    ");
    
    $db->query("
        CREATE TABLE IF NOT EXISTS security_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event VARCHAR(100) NOT NULL,
            details JSON,
            severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event (event),
            INDEX idx_severity (severity),
            INDEX idx_created_at (created_at)
        )
    ");
} catch (Exception $e) {
    error_log("Failed to create security tables: " . $e->getMessage());
}