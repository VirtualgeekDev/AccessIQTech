-- AccessIQ Tech Complete Database Setup
-- Run this script in phpMyAdmin or MySQL command line

-- Create database
CREATE DATABASE IF NOT EXISTS accessiq_tech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE accessiq_tech;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    trial_expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2) NOT NULL,
    features JSON NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('trialing', 'active', 'canceled', 'expired', 'past_due') DEFAULT 'trialing',
    billing_cycle ENUM('monthly', 'annual') DEFAULT 'monthly',
    stripe_subscription_id VARCHAR(255) NULL,
    stripe_customer_id VARCHAR(255) NULL,
    paypal_subscription_id VARCHAR(255) NULL,
    paypal_customer_id VARCHAR(255) NULL,
    current_period_start DATETIME NULL,
    current_period_end DATETIME NULL,
    trial_start DATETIME NULL,
    trial_end DATETIME NULL,
    canceled_at DATETIME NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_stripe_subscription (stripe_subscription_id),
    INDEX idx_paypal_subscription (paypal_subscription_id)
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(2048) NOT NULL,
    status ENUM('pending', 'scanning', 'completed', 'failed') DEFAULT 'pending',
    report_json JSON NULL,
    score INT NULL,
    issues_found INT DEFAULT 0,
    scan_duration INT NULL, -- in seconds
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_score (score)
);

-- Settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    setting_type ENUM('string', 'boolean', 'integer', 'json') DEFAULT 'string',
    is_encrypted BOOLEAN DEFAULT FALSE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email_to VARCHAR(255) NOT NULL,
    email_type ENUM('verification', 'password_reset', 'trial_reminder', 'subscription_update', 'contact_form', 'contact_confirmation') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('sent', 'failed', 'bounced') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_email_type (email_type),
    INDEX idx_sent_at (sent_at)
);

-- Analytics table for tracking key metrics
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    additional_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric_name (metric_name),
    INDEX idx_metric_date (metric_date),
    UNIQUE KEY unique_metric_date (metric_name, metric_date)
);

-- Rate limits table for security
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier_time (identifier, created_at)
);

-- Security logs table
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
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Insert default plans
INSERT IGNORE INTO plans (name, slug, price_monthly, price_annual, features, is_popular, is_active) VALUES
('Starter', 'starter', 29.00, 290.00, 
 '["Up to 5 website scans per month", "Basic accessibility reports", "Email support", "WCAG 2.1 AA compliance checks"]', 
 FALSE, TRUE),

('Professional', 'pro', 79.00, 790.00, 
 '["Up to 25 website scans per month", "Advanced AI-powered reports", "One-click fix suggestions", "Priority email support", "API access", "Custom branding"]', 
 TRUE, TRUE),

('Enterprise', 'enterprise', 199.00, 1990.00, 
 '["Unlimited website scans", "White-label solutions", "Dedicated account manager", "Phone support", "Advanced integrations", "Custom reporting"]', 
 FALSE, TRUE);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, is_encrypted, description) VALUES
('stripe_enabled', 'false', 'boolean', FALSE, 'Enable Stripe payment processing'),
('paypal_enabled', 'false', 'boolean', FALSE, 'Enable PayPal payment processing'),
('stripe_publishable_key', '', 'string', FALSE, 'Stripe publishable key'),
('stripe_secret_key', '', 'string', TRUE, 'Stripe secret key (encrypted)'),
('paypal_client_id', '', 'string', FALSE, 'PayPal client ID'),
('paypal_secret', '', 'string', TRUE, 'PayPal client secret (encrypted)'),
('trial_length_days', '8', 'integer', FALSE, 'Free trial length in days'),
('site_name', 'AccessIQ Tech', 'string', FALSE, 'Site name'),
('support_email', 'support@accessiqtech.net', 'string', FALSE, 'Support email address'),
('smtp_host', 'smtp.hostinger.com', 'string', FALSE, 'SMTP server host'),
('smtp_port', '587', 'integer', FALSE, 'SMTP server port'),
('smtp_username', 'contact@accessiqtech.net', 'string', FALSE, 'SMTP username'),
('smtp_password', 'Mkan@54221960', 'string', TRUE, 'SMTP password (encrypted)'),
('smtp_encryption', 'tls', 'string', FALSE, 'SMTP encryption type'),
('google_analytics_id', '', 'string', FALSE, 'Google Analytics tracking ID'),
('sentry_dsn', '', 'string', TRUE, 'Sentry DSN for error tracking');

-- Create demo admin user (password: admin123)
-- Password hash for 'admin123': $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT IGNORE INTO users (name, email, password_hash, role, email_verified, trial_expires_at) VALUES
('Admin User', 'admin@accessiqtech.net', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE, DATE_ADD(NOW(), INTERVAL 30 DAY));

-- Initialize analytics with sample data
INSERT IGNORE INTO analytics (metric_name, metric_value, metric_date) VALUES
('mrr', 12450.00, CURDATE()),
('active_users', 245, CURDATE()),
('trial_conversions', 68.5, CURDATE()),
('churn_rate', 3.2, CURDATE());

-- Show success message
SELECT 'Database and tables created successfully!' as message;