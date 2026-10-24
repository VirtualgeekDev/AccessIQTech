# AccessIQ Tech - AI-Powered Web Accessibility SaaS

A comprehensive SaaS platform that scans websites for ADA/WCAG compliance and delivers AI-powered accessibility fixes.

## 🚀 Features

- **AI-Powered Scanning**: Automated website accessibility analysis
- **WCAG 2.1 Compliance**: Full AA/AAA compliance checking
- **One-Click Fixes**: AI-generated accessibility improvements
- **Multi-Payment Support**: Stripe and PayPal integration
- **Admin Dashboard**: Complete payment and user management
- **Trial Management**: 14-day free trials with automated reminders
- **Email Automation**: SMTP-powered verification and notifications

## 📋 Requirements

- **PHP**: 8.0 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache or Nginx
- **Composer**: For PHP dependencies
- **Node.js**: For frontend build tools

## 🛠 Installation

### 1. Database Setup

1. **Access phpMyAdmin** on your Hostinger account
2. **Create Database**: Create a new database named `accessiq_tech`
3. **Import Schema**: Run the SQL scripts in order:
   ```bash
   # In phpMyAdmin, import these files:
   backend/database/schema.sql
   backend/database/seeds.sql
   ```

### 2. Environment Configuration

1. **Copy Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Update Database Settings**:
   ```env
   DB_HOST="localhost"
   DB_NAME="accessiq_tech"
   DB_USER="your_hostinger_db_user"
   DB_PASS="your_hostinger_db_password"
   ```

3. **Configure SMTP** (Hostinger Email):
   ```env
   SMTP_HOST="smtp.hostinger.com"
   SMTP_USERNAME="noreply@yourdomain.com"
   SMTP_PASSWORD="your_email_password"
   ```

4. **Generate Encryption Key**:
   ```bash
   # Generate a secure 32-character key
   openssl rand -base64 32
   ```

### 3. File Upload & Permissions

```bash
# Set proper permissions
chmod 755 public/
chmod 644 public/.htaccess
chmod -R 755 backend/
chmod -R 644 backend/config/
```

### 4. Hostinger Deployment

#### Option A: File Manager Upload
1. **Zip Project**: Create a zip of all files
2. **Upload**: Use Hostinger File Manager to upload
3. **Extract**: Extract files to your domain's public_html folder
4. **Set Permissions**: Adjust file permissions as needed

#### Option B: Git Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/accessiq-tech.git
cd accessiq-tech

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Build frontend assets
npm install
npm run build
```

### 5. Cron Jobs Setup

Add these cron jobs in Hostinger cPanel:

```bash
# Trial reminder emails (daily at 9 AM)
0 9 * * * /usr/bin/php /path/to/your/site/backend/cron/trial_reminders.php

# Analytics update (daily at midnight)
0 0 * * * /usr/bin/php /path/to/your/site/backend/cron/update_analytics.php
```

## 🔧 Configuration

### Admin Panel Access

1. **Login**: Use the demo admin account:
   - Email: `admin@accessiqtech.net`
   - Password: `admin123`

2. **Configure Payment Gateways**:
   - Navigate to Admin Panel → Payment Settings
   - Add your Stripe and PayPal API keys
   - Test connections before going live

### Payment Gateway Setup

#### Stripe Configuration
1. **Get API Keys**: From Stripe Dashboard
2. **Add to Admin Panel**:
   - Publishable Key: `pk_live_...` or `pk_test_...`
   - Secret Key: `sk_live_...` or `sk_test_...`
3. **Test Connection**: Use the "Test Stripe Connection" button

#### PayPal Configuration
1. **Create App**: In PayPal Developer Dashboard
2. **Add to Admin Panel**:
   - Client ID: From your PayPal app
   - Client Secret: From your PayPal app
3. **Test Connection**: Use the "Test PayPal Connection" button

## 📊 Database Schema

### Core Tables

- **users**: User accounts and authentication
- **plans**: Subscription plans and pricing
- **subscriptions**: User subscriptions and billing
- **scans**: Website accessibility scan results
- **settings**: Admin configuration and API keys
- **email_logs**: Email delivery tracking
- **analytics**: Business metrics and KPIs

### Key Relationships

```sql
users (1) → (many) subscriptions
plans (1) → (many) subscriptions
users (1) → (many) scans
```

## 🔐 Security Features

### Authentication & Authorization
- **Password Hashing**: PHP password_hash() with bcrypt
- **Token-Based Reset**: Secure password reset tokens
- **Email Verification**: Required for account activation
- **Role-Based Access**: User and admin roles

### Data Protection
- **Encrypted Storage**: Sensitive settings encrypted in database
- **SQL Injection Prevention**: Prepared statements throughout
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token validation for forms

### API Security
- **Rate Limiting**: Prevents API abuse
- **Authentication Required**: Bearer token validation
- **Input Validation**: Strict parameter checking

## 📧 Email System

### SMTP Configuration
The system uses PHPMailer with Hostinger SMTP:

```php
// Automatic configuration from .env
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_ENCRYPTION="tls"
```

### Email Types
- **Verification**: Account email confirmation
- **Password Reset**: Secure password reset links
- **Trial Reminders**: Automated trial expiration notices
- **Subscription Updates**: Payment and plan changes

## 🔍 SEO & Performance

### SEO Features
- **Meta Tags**: Dynamic title and description tags
- **Sitemap**: Auto-generated XML sitemap
- **Robots.txt**: Search engine crawling rules
- **Schema Markup**: Structured data for rich snippets

### Performance Optimization
- **Image Optimization**: Lazy loading and compression
- **CSS/JS Minification**: Reduced file sizes
- **Database Indexing**: Optimized query performance
- **Caching**: File-based caching system

## 📈 Analytics & Monitoring

### Built-in Analytics
- **MRR Tracking**: Monthly recurring revenue
- **User Metrics**: Active users and trial conversions
- **Scan Analytics**: Usage patterns and performance
- **Churn Analysis**: Subscription cancellation tracking

### External Integrations
- **Google Analytics**: Pageview and user behavior tracking
- **Sentry**: Error monitoring and alerting
- **Custom Dashboards**: Admin panel analytics

## 🚨 Error Handling

### Logging System
```php
// Error logging configuration
LOG_LEVEL="error"
LOG_FILE="/var/log/accessiq_tech.log"
```

### Monitoring
- **Sentry Integration**: Real-time error tracking
- **Email Alerts**: Critical error notifications
- **Database Logging**: Error persistence and analysis

## 🔄 Backup & Maintenance

### Database Backup
```bash
# Create backup
mysqldump -u username -p accessiq_tech > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u username -p accessiq_tech < backup_20250115.sql
```

### File Backup
```bash
# Backup entire application
tar -czf accessiq_backup_$(date +%Y%m%d).tar.gz /path/to/accessiq-tech/
```

### Maintenance Tasks
- **Log Rotation**: Prevent log files from growing too large
- **Database Optimization**: Regular OPTIMIZE TABLE commands
- **Cache Clearing**: Periodic cache cleanup
- **Security Updates**: Regular PHP and dependency updates

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database credentials in .env
# Verify MySQL service is running
# Check Hostinger database permissions
```

#### Email Delivery Issues
```bash
# Verify SMTP credentials
# Check Hostinger email limits
# Review email logs table for errors
```

#### Payment Gateway Errors
```bash
# Verify API keys in admin panel
# Check webhook endpoints
# Review payment gateway logs
```

### Debug Mode
```env
# Enable debugging (development only)
APP_DEBUG="true"
LOG_LEVEL="debug"
```

## 📞 Support

### Documentation
- **API Documentation**: `/docs/api.md`
- **User Guide**: `/docs/user-guide.md`
- **Admin Manual**: `/docs/admin-manual.md`

### Contact
- **Email**: support@accessiqtech.net
- **Documentation**: [docs.accessiqtech.net](https://docs.accessiqtech.net)
- **Status Page**: [status.accessiqtech.net](https://status.accessiqtech.net)

## 📄 License

This project is proprietary software. All rights reserved.

---

**AccessIQ Tech** - Making the web accessible for everyone through AI-powered compliance tools.