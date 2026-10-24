# Axe-Core Puppeteer Integration

This Node.js project uses the official `@axe-core/puppeteer` package to perform accessibility scans.

## Setup

1. Install Node.js (version 16 or higher)
2. Install dependencies:
   ```bash
   cd backend/axe-watcher
   npm install
   ```

## Dependencies

- `@axe-core/puppeteer`: Official Axe-Core integration for Puppeteer
- `puppeteer`: Headless Chrome browser automation

## Usage

```bash
node scan.js <url> <api-key> [server-url] [build-id] [branch-name]
```

### Parameters

- `url`: The website URL to scan (required)
- `api-key`: API key for future integrations (currently unused but maintained for compatibility)
- `server-url`: Server URL for future integrations (optional)
- `build-id`: Build identifier for grouping scans (optional)
- `branch-name`: Git branch name (optional)

### Example

```bash
node scan.js "https://example.com" "placeholder-api-key"
```

### With optional parameters

```bash
node scan.js "https://example.com" "placeholder-api-key" "https://example-server.com" "build-123" "main"
```

## Output

The script outputs JSON to stdout with the scan results:

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "violations": 5,
  "passes": 45,
  "incomplete": 2,
  "inapplicable": 10,
  "axeVersion": "4.8.0",
  "buildID": "build-123",
  "branchName": "main",
  "message": "Accessibility scan completed successfully",
  "detailedResults": {
    "violations": [...],
    "passes": 45,
    "incomplete": [...]
  }
}
```

## Error Handling

If an error occurs, the script outputs an error JSON and exits with code 1:

```json
{
  "success": false,
  "error": "Error message",
  "url": "https://example.com",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Features

- **Direct Axe-Core Integration**: Uses the official `@axe-core/puppeteer` package for reliable accessibility testing
- **Comprehensive Results**: Provides both summary statistics and detailed violation information
- **Detailed Results**: Provides both summary statistics and detailed violation information
- **Optimized for Shared Hosting**: Configured with browser flags suitable for shared hosting environments
- **Error Handling**: Comprehensive error handling with structured JSON output