<?php
/**
 * Email Configuration and SMTP Handler
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

require_once __DIR__ . '/../../vendor/autoload.php';

class EmailService {
    private $db;
    private $smtpSettings;
    private $mailer;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->smtpSettings = $this->getEmailSettings();
        $this->initializeMailer();
    }
    
    private function initializeMailer() {
        $this->mailer = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $this->smtpSettings['smtp_host'];
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->smtpSettings['smtp_username'];
            $this->mailer->Password = $this->smtpSettings['smtp_password'];
            
            // Set encryption
            if ($this->smtpSettings['smtp_encryption'] === 'tls') {
                $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif ($this->smtpSettings['smtp_encryption'] === 'ssl') {
                $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            }
            
            $this->mailer->Port = (int)$this->smtpSettings['smtp_port'];
            
            // Content settings
            $this->mailer->isHTML(true);
            $this->mailer->CharSet = 'UTF-8';
            
            // Default sender
            $this->mailer->setFrom(
                $this->smtpSettings['smtp_username'], 
                $this->smtpSettings['site_name']
            );
            
            // Enable debug output in development
            if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
                $this->mailer->SMTPDebug = SMTP::DEBUG_SERVER;
                $this->mailer->Debugoutput = function($str, $level) {
                    error_log("PHPMailer Debug: $str");
                };
            }
            
        } catch (PHPMailerException $e) {
            error_log("PHPMailer initialization failed: " . $e->getMessage());
            throw new Exception("Email service initialization failed");
        }
    }
    
    private function getEmailSettings() {
        try {
            $stmt = $this->db->query("SELECT setting_key, setting_value, is_encrypted FROM settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'site_name')");
            $settings = [];
            
            while ($row = $stmt->fetch()) {
                $value = $row['is_encrypted'] ? $this->decrypt($row['setting_value']) : $row['setting_value'];
                $settings[$row['setting_key']] = $value;
            }
        } catch (Exception $e) {
            error_log("Failed to load email settings from database: " . $e->getMessage());
            $settings = [];
        }
        
        // Fallback to environment variables if not set in database
        $defaults = [
            'smtp_host' => $_ENV['SMTP_HOST'] ?? 'smtp.hostinger.com',
            'smtp_port' => $_ENV['SMTP_PORT'] ?? '587',
            'smtp_username' => $_ENV['SMTP_USERNAME'] ?? 'contact@accessiqtech.net',
            'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? 'Mkan@54221960',
            'smtp_encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'tls',
            'site_name' => $_ENV['APP_NAME'] ?? 'AccessIQ Tech'
        ];
        
        foreach ($defaults as $key => $value) {
            if (!isset($settings[$key]) || empty($settings[$key])) {
                $settings[$key] = $value;
            }
        }
        
        return $settings;
    }
    
    public function sendVerificationEmail($user) {
        $token = $this->generateSecureToken();
        
        // Store verification token
        $this->db->query(
            "UPDATE users SET verification_token = ? WHERE id = ?",
            [$token, $user['id']]
        );
        
        $verificationUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/verify-email?token=" . $token;
        
        $subject = "Verify Your AccessIQ Tech Account";
        $body = $this->getEmailTemplate('verification', [
            'name' => $user['name'],
            'verification_url' => $verificationUrl
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'verification', $user['id']);
    }
    
    public function sendPasswordResetEmail($user) {
        $token = $this->generateSecureToken();
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store reset token with expiration
        $this->db->query(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            [$token, $expires, $user['id']]
        );
        
        $resetUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/reset-password?token=" . $token;
        
        $subject = "Reset Your AccessIQ Tech Password";
        $body = $this->getEmailTemplate('password_reset', [
            'name' => $user['name'],
            'reset_url' => $resetUrl
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'password_reset', $user['id']);
    }
    
    public function sendTrialReminderEmail($user, $daysLeft) {
        $subject = "Your AccessIQ Tech Trial Expires in {$daysLeft} Days";
        $body = $this->getEmailTemplate('trial_reminder', [
            'name' => $user['name'],
            'days_left' => $daysLeft,
            'upgrade_url' => ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/pricing"
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'trial_reminder', $user['id']);
    }
    
    public function sendEmail($to, $subject, $body, $type, $userId = null) {
        try {
            // Clear any previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            $this->mailer->clearCustomHeaders();
            
            // Set recipient
            $this->mailer->addAddress($to);
            
            // Set reply-to
            $this->mailer->addReplyTo($this->smtpSettings['smtp_username'], $this->smtpSettings['site_name']);
            
            // Set subject and body
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            
            // Set alternative plain text body
            $this->mailer->AltBody = strip_tags($body);
            
            // Add custom headers based on email type
            $this->addCustomHeaders($type);
            
            // Send email
            $sent = $this->mailer->send();
            
            // Log email
            $this->logEmail($userId, $to, $type, $subject, $sent ? 'sent' : 'failed');
            
            return $sent;
            
        } catch (PHPMailerException $e) {
            error_log("PHPMailer error: " . $e->getMessage());
            $this->logEmail($userId, $to, $type, $subject, 'failed');
            return false;
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            $this->logEmail($userId, $to, $type, $subject, 'failed');
            return false;
        }
    }
    
    private function addCustomHeaders($type) {
        // Add email type for tracking
        $this->mailer->addCustomHeader('X-Email-Type', $type);
        $this->mailer->addCustomHeader('X-Mailer', 'AccessIQ Tech v1.0');
        
        // Add priority headers for important emails
        if (in_array($type, ['verification', 'password_reset', 'trial_reminder'])) {
            $this->mailer->addCustomHeader('X-Priority', '1');
            $this->mailer->addCustomHeader('Importance', 'High');
        }
        
        // Add unsubscribe header for marketing emails
        if ($type === 'marketing' || $type === 'trial_reminder') {
            $unsubscribeUrl = ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/unsubscribe';
            $this->mailer->addCustomHeader('List-Unsubscribe', "<{$unsubscribeUrl}>");
        }
    }
    
    /**
     * Send bulk emails (for newsletters, announcements)
     */
    public function sendBulkEmail($recipients, $subject, $body, $type = 'bulk') {
        $results = [
            'sent' => 0,
            'failed' => 0,
            'errors' => []
        ];
        
        foreach ($recipients as $recipient) {
            $email = is_array($recipient) ? $recipient['email'] : $recipient;
            $name = is_array($recipient) ? ($recipient['name'] ?? '') : '';
            $userId = is_array($recipient) ? ($recipient['user_id'] ?? null) : null;
            
            try {
                // Personalize email if name is provided
                $personalizedBody = $body;
                if (!empty($name)) {
                    $personalizedBody = str_replace('{{name}}', $name, $body);
                }
                
                $sent = $this->sendEmail($email, $subject, $personalizedBody, $type, $userId);
                
                if ($sent) {
                    $results['sent']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to send to: {$email}";
                }
                
                // Add small delay to prevent overwhelming SMTP server
                usleep(100000); // 0.1 second delay
                
            } catch (Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Error sending to {$email}: " . $e->getMessage();
            }
        }
        
        return $results;
    }
    
    public function sendPaymentConfirmationEmail($user, $invoice) {
        $subject = "Payment Confirmation - AccessIQ Tech";
        $body = $this->getEmailTemplate('payment_confirmation', [
            'name' => $user['name'],
            'amount' => '$' . number_format($invoice->amount_paid / 100, 2),
            'invoice_url' => $invoice->hosted_invoice_url ?? '#'
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'subscription_update', $user['id']);
    }
    
    public function sendPaymentFailedEmail($user, $invoice) {
        $subject = "Payment Failed - AccessIQ Tech";
        $body = $this->getEmailTemplate('payment_failed', [
            'name' => $user['name'],
            'amount' => is_array($invoice) ? ($invoice['amount'] ?? 'N/A') : '$' . number_format($invoice->amount_due / 100, 2),
            'retry_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/billing'
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'subscription_update', $user['id']);
    }
    
    public function sendTrialEndingEmail($user) {
        $subject = "Your Trial Ends Soon - AccessIQ Tech";
        $body = $this->getEmailTemplate('trial_ending', [
            'name' => $user['name'],
            'upgrade_url' => ($_ENV['APP_URL'] ?? 'https://accessiqtech.net') . '/pricing'
        ]);
        
        return $this->sendEmail($user['email'], $subject, $body, 'trial_reminder', $user['id']);
    }
    
    /**
     * Test email configuration
     */
    public function testEmailConfiguration($testEmail = null) {
        try {
            $testEmail = $testEmail ?: $this->smtpSettings['smtp_username'];
            
            $testSubject = 'AccessIQ Tech - Email Configuration Test';
            $testBody = '
                <h2>Email Configuration Test</h2>
                <p>This is a test email to verify your SMTP configuration is working correctly.</p>
                <p><strong>Sent at:</strong> ' . date('Y-m-d H:i:s') . '</p>
                <p><strong>SMTP Host:</strong> ' . $this->smtpSettings['smtp_host'] . '</p>
                <p><strong>SMTP Port:</strong> ' . $this->smtpSettings['smtp_port'] . '</p>
                <p><strong>Encryption:</strong> ' . $this->smtpSettings['smtp_encryption'] . '</p>
                <hr>
                <p><small>AccessIQ Tech Email Service</small></p>
            ';
            
            $sent = $this->sendEmail($testEmail, $testSubject, $testBody, 'test');
            
            return [
                'success' => $sent,
                'message' => $sent 
                    ? 'Test email sent successfully to ' . $testEmail
                    : 'Failed to send test email',
                'smtp_host' => $this->smtpSettings['smtp_host'],
                'smtp_port' => $this->smtpSettings['smtp_port'],
                'smtp_encryption' => $this->smtpSettings['smtp_encryption']
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Email test failed: ' . $e->getMessage()
            ];
        }
    }
    
    private function logEmail($userId, $to, $type, $subject, $status) {
        try {
            $this->db->query(
                "INSERT INTO email_logs (user_id, email_to, email_type, subject, status) VALUES (?, ?, ?, ?, ?)",
                [$userId, $to, $type, $subject, $status]
            );
        } catch (Exception $e) {
            error_log("Failed to log email: " . $e->getMessage());
        }
    }
    
    private function getEmailTemplate($type, $variables) {
        $templatePath = __DIR__ . "/../templates/emails/{$type}.html";
        
        if (!file_exists($templatePath)) {
            // Return a simple template if file doesn't exist
            return $this->getSimpleTemplate($type, $variables);
        }
        
        $template = file_get_contents($templatePath);
        
        foreach ($variables as $key => $value) {
            $template = str_replace("{{" . $key . "}}", $value, $template);
        }
        
        return $template;
    }
    
    private function getSimpleTemplate($type, $variables) {
        switch ($type) {
            case 'verification':
                return "<h2>Welcome to AccessIQ Tech!</h2><p>Hi {$variables['name']},</p><p>Please verify your email by clicking: <a href='{$variables['verification_url']}'>Verify Email</a></p>";
            case 'password_reset':
                return "<h2>Reset Your Password</h2><p>Hi {$variables['name']},</p><p>Reset your password by clicking: <a href='{$variables['reset_url']}'>Reset Password</a></p>";
            case 'trial_reminder':
                return "<h2>Trial Expires Soon</h2><p>Hi {$variables['name']},</p><p>Your trial expires in {$variables['days_left']} days. <a href='{$variables['upgrade_url']}'>Upgrade now</a></p>";
            default:
                return "<p>Email from AccessIQ Tech</p>";
        }
    }
    
    private function generateSecureToken() {
        return bin2hex(random_bytes(32));
    }
    
    private function decrypt($encryptedValue) {
        if (empty($encryptedValue)) return '';
        
        try {
            $key = $_ENV['ENCRYPTION_KEY'] ?? 'default-key-change-in-production';
            
            // Ensure key is proper length for AES-256
            $key = hash('sha256', $key, true);
            
            $data = base64_decode($encryptedValue);
            
            // Check if data is long enough to contain IV + encrypted content
            if (strlen($data) < 16) {
                // Data is too short to be properly encrypted, return as-is
                return $encryptedValue;
            }
            
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
            
            // Verify IV is exactly 16 bytes
            if (strlen($iv) !== 16) {
                return $encryptedValue;
            }
            
            $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
            
            if ($decrypted === false) {
                return $encryptedValue;
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log("Email decrypt error: " . $e->getMessage());
            return $encryptedValue;
        }
    }
    
    public function encrypt($value) {
        if (empty($value)) return '';
        
        $key = $_ENV['ENCRYPTION_KEY'] ?? 'default-key-change-in-production';
        
        // Ensure key is proper length for AES-256
        $key = hash('sha256', $key, true);
        
        // Generate proper IV
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($value, 'AES-256-CBC', $key, 0, $iv);
        
        if ($encrypted === false) {
            throw new Exception('Encryption failed');
        }
        
        return base64_encode($iv . $encrypted);
    }
}