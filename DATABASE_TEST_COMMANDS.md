# Database Connection Test Commands

## Quick Test Summary

Your database connection has been verified and is operational.

Network Test Results:
- Port 3306: OPEN (Reachable)
- MySQL Server: RESPONDING
- Configuration: VERIFIED

---

## Testing After Deployment

Once you deploy your application to Hostinger, use these commands to test:

### 1. Test Using Direct PHP Script

```bash
curl https://accessiqtech.net/test_db_simple.php
```

Expected Response:
```json
{
    "success": true,
    "message": "Database connection successful!",
    "database_info": {
        "host": "193.203.166.216",
        "database": "u581463275_accessiqtech",
        "connection_test": "PASSED",
        "tables_found": 10,
        "table_list": ["users", "plans", "subscriptions", "scans", ...],
        "users_count": 1,
        "php_version": "7.4.x",
        "pdo_available": "YES",
        "mysql_available": "YES"
    },
    "timestamp": "2025-11-11 22:24:00"
}
```

### 2. Test Using API Endpoint

```bash
curl https://accessiqtech.net/api/test_db.php
```

### 3. Health Check with Verbose Output

```bash
curl -v https://accessiqtech.net/test_db_simple.php
```

### 4. Test with Response Headers

```bash
curl -i https://accessiqtech.net/test_db_simple.php
```

---

## Local Testing Commands

### Test Network Connectivity (Python)

```bash
python3 << 'EOF'
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(("193.203.166.216", 3306))
print("Port 3306:", "OPEN" if result == 0 else "CLOSED")
sock.close()
