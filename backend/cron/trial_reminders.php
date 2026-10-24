<?php
/**
 * Trial Reminder Cron Job
 * Run daily to send trial expiration reminders
 */

require_once __DIR__ . '/../../vendor/autoload.php';

require_once '../config/database.php';
require_once '../config/email.php';

try {
    $db = Database::getInstance();
    $emailService = new EmailService();
    
    // Find users whose trials expire in 3 days, 1 day, or today
    $reminderDays = [3, 1, 0];
    
    foreach ($reminderDays as $days) {
        $targetDate = date('Y-m-d', strtotime("+{$days} days"));
        
        $stmt = $db->query(
            "SELECT u.id, u.name, u.email, u.trial_expires_at 
             FROM users u
             JOIN subscriptions s ON u.id = s.user_id
             WHERE DATE(u.trial_expires_at) = ? 
             AND s.status = 'trialing'
             AND u.email_verified = 1",
            [$targetDate]
        );
        
        while ($user = $stmt->fetch()) {
            // Check if we've already sent a reminder for this day
            $logStmt = $db->query(
                "SELECT id FROM email_logs 
                 WHERE user_id = ? AND email_type = 'trial_reminder' 
                 AND DATE(sent_at) = CURDATE()",
                [$user['id']]
            );
            
            if ($logStmt->fetch()) {
                continue; // Already sent today
            }
            
            $daysLeft = $days;
            if ($days === 0) {
                $daysLeft = 'less than 1';
            }
            
            $sent = $emailService->sendTrialReminderEmail($user, $daysLeft);
            
            if ($sent) {
                echo "Sent trial reminder to {$user['email']} ({$daysLeft} days left)\n";
            } else {
                echo "Failed to send trial reminder to {$user['email']}\n";
            }
        }
    }
    
    // Expire trials that have ended
    $expiredStmt = $db->query(
        "UPDATE subscriptions s
         JOIN users u ON s.user_id = u.id
         SET s.status = 'expired'
         WHERE u.trial_expires_at < NOW() 
         AND s.status = 'trialing'"
    );
    
    $expiredCount = $expiredStmt->rowCount();
    if ($expiredCount > 0) {
        echo "Expired {$expiredCount} trial subscriptions\n";
    }
    
    echo "Trial reminder job completed successfully\n";
    
} catch (Exception $e) {
    error_log("Trial reminder cron error: " . $e->getMessage());
    echo "Error: " . $e->getMessage() . "\n";
}