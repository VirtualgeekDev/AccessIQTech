<?php
/**
 * Contact Form API Endpoint
 * POST /api/contact
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../config/email.php';
require_once '../config/security.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$security = SecurityManager::getInstance();
$db = Database::getInstance();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate and sanitize input
    $name = $security->sanitizeInput($input['name'] ?? '');
    $email = $security->sanitizeInput($input['email'] ?? '', 'email');
    $company = $security->sanitizeInput($input['company'] ?? '');
    $subject = $security->sanitizeInput($input['subject'] ?? '');
    $message = $security->sanitizeInput($input['message'] ?? '');
    
    $errors = [];
    
    if (empty($name) || strlen($name) < 2) {
        $errors['name'] = 'Name must be at least 2 characters';
    }
    
    if (!$security->validateInput($email, 'email')) {
        $errors['email'] = 'Please enter a valid email address';
    }
    
    if (empty($subject)) {
        $errors['subject'] = 'Subject is required';
    }
    
    if (empty($message) || strlen($message) < 10) {
        $errors['message'] = 'Message must be at least 10 characters';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['errors' => $errors]);
        exit();
    }
    
    // Rate limiting
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!$security->checkRateLimit("contact_{$clientIp}", 3, 3600)) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many contact form submissions. Please try again later.']);
        exit();
    }
    
    // Store contact submission in database (optional)
    $db->query(
        "INSERT INTO contact_submissions (name, email, company, subject, message, ip_address, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [$name, $email, $company, $subject, $message, $clientIp]
    );
    
    // Send email to support team
    $emailService = new EmailService();
    
    // Format email content
    $emailBody = "
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> {$name}</p>
    <p><strong>Email:</strong> {$email}</p>
    <p><strong>Company:</strong> " . ($company ?: 'Not provided') . "</p>
    <p><strong>Subject:</strong> {$subject}</p>
    <p><strong>Message:</strong></p>
    <div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>
        " . nl2br(htmlspecialchars($message)) . "
    </div>
    <hr>
    <p><small>Submitted from: {$clientIp} at " . date('Y-m-d H:i:s') . "</small></p>
    ";
    
    // Get support email from settings
    $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'support_email'");
    $supportEmailSetting = $stmt->fetch();
    $supportEmail = $supportEmailSetting['setting_value'] ?? 'support@accessiqtech.net';
    
    $emailSent = $emailService->sendEmail(
        $supportEmail,
        "Contact Form: {$subject}",
        $emailBody,
        'contact_form'
    );
    
    // Send confirmation email to user
    $confirmationBody = "
    <h2>Thank you for contacting AccessIQ Tech!</h2>
    <p>Hi {$name},</p>
    <p>We've received your message and will get back to you within 24 hours.</p>
    <p><strong>Your message:</strong></p>
    <div style='background: #f5f5f5; padding: 15px; border-radius: 5px;'>
        " . nl2br(htmlspecialchars($message)) . "
    </div>
    <p>Best regards,<br>The AccessIQ Tech Team</p>
    ";
    
    $confirmationSent = $emailService->sendEmail(
        $email,
        "Thank you for contacting AccessIQ Tech",
        $confirmationBody,
        'contact_confirmation'
    );
    
    // Log the contact submission
    $security->logSecurityEvent('contact_form_submitted', [
        'name' => $name,
        'email' => $email,
        'subject' => $subject,
        'email_sent' => $emailSent,
        'confirmation_sent' => $confirmationSent
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you within 24 hours.'
    ]);
    
} catch (Exception $e) {
    error_log("Contact API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}