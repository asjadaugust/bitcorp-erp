# API Testing Scripts - Bitcorp ERP

This directory contains three powerful scripts for testing all GET endpoints in the Bitcorp ERP system and generating comprehensive reports.

## 📋 Scripts Overview

### 1. **test-api-endpoints.sh** - Basic Shell Script
Simple, lightweight shell script for quick endpoint testing.

**Features:**
- Tests all major GET endpoints
- Generates markdown report
- Color-coded output
- Response time tracking
- No dependencies (uses curl only)

**Usage:**
```bash
./scripts/test-api-endpoints.sh
```

**Output:**
- `api-test-report.md` - Formatted markdown report

**Options (via environment variables):**
```bash
BASE_URL=http://localhost:3400 ./scripts/test-api-endpoints.sh
REPORT_FILE=my-report.md ./scripts/test-api-endpoints.sh
```

---

### 2. **test-api-advanced.sh** - Advanced Shell Script
Enhanced shell script with authentication support.

**Features:**
- All features from basic script
- Automatic authentication
- Markdown + JSON reports
- Concurrent request handling
- Better error handling

**Usage:**
```bash
./scripts/test-api-advanced.sh
```

**Output:**
- `api-test-report-YYYYMMDD-HHMMSS.md` - Markdown report
- `api-test-results-YYYYMMDD-HHMMSS.json` - JSON report

**Options (via environment variables):**
```bash
BASE_URL=http://localhost:3400 \
AUTH_TOKEN=your_token_here \
./scripts/test-api-advanced.sh
```

---

### 3. **test-api.js** - Node.js Script (Recommended)
Production-ready Node.js script with full features.

**Features:**
- Automatic authentication with email/password
- Concurrent request testing (configurable)
- Markdown + JSON reports
- Performance metrics
- Top slowest endpoints
- Better error handling
- Flexible configuration

**Prerequisites:**
```bash
# Requires Node.js (already in project)
node --version  # Should be v18+
```

**Usage:**
```bash
# Basic usage (connects to localhost:3400)
node scripts/test-api.js

# With custom URL
node scripts/test-api.js --url http://localhost:3400

# With authentication
node scripts/test-api.js --email admin@bitcorp.com --password admin123

# All options
node scripts/test-api.js \
  --url http://localhost:3400 \
  --email admin@bitcorp.com \
  --password admin123 \
  --output my-report.md \
  --json my-results.json \
  --timeout 5000 \
  --concurrent 5
```

**Options:**
- `--url <url>` - Base URL (default: http://localhost:3400)
- `--token <token>` - Use existing JWT token
- `--email <email>` - Email for login
- `--password <password>` - Password for login
- `--output <file>` - Markdown report file
- `--json <file>` - JSON report file
- `--timeout <ms>` - Request timeout (default: 5000)
- `--concurrent <n>` - Concurrent requests (default: 3)

**Output:**
- `api-test-report-YYYY-MM-DD.md` - Markdown report with detailed responses
- `api-test-results-YYYY-MM-DD.json` - JSON report with metrics

---

## 🚀 Quick Start

### 1. Start your backend server
```bash
# In another terminal
docker-compose -f docker-compose.dev.yml up
# or
npm run dev
```

### 2. Run API tests
```bash
# Option A: Quick test with Node.js (recommended)
node scripts/test-api.js --email admin@bitcorp.com --password admin123

# Option B: Basic shell script
./scripts/test-api-endpoints.sh

# Option C: Advanced shell script
./scripts/test-api-advanced.sh
```

### 3. View results
```bash
# View markdown report
cat api-test-report-*.md

# View JSON report (for parsing)
cat api-test-results-*.json | jq .
```

---

## 📊 Report Format

### Markdown Report Example

```markdown
# API Endpoint Testing Report

**Generated:** 2025-12-27 14:30:00
**Base URL:** http://localhost:3400
**Total Endpoints Tested:** 35

## Summary

| Status | Count |
|--------|-------|
| ✓ 200 OK | 28 |
| ⚠ 401/403 Auth | 5 |
| ✗ Other Errors | 2 |

---

## Endpoint Results

### 1. Health Check
**Status:** ✓ `200 OK`
**Response Time:** 2ms

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-27T14:30:00.000Z"
}
```

### 2. Equipment List
**Endpoint:** `GET /api/equipment`
**Status:** ✓ `200 OK`
**Response Time:** 145ms

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 42
}
```
```

### JSON Report Example

```json
{
  "metadata": {
    "timestamp": "2025-12-27T14:30:00.000Z",
    "baseUrl": "http://localhost:3400",
    "totalEndpoints": 35,
    "summary": {
      "successful": 28,
      "authRequired": 5,
      "errors": 2
    }
  },
  "results": [
    {
      "name": "Health Check",
      "path": "/health",
      "method": "GET",
      "statusCode": 200,
      "responseTime": 2,
      "error": null,
      "responsePreview": "{\"status\":\"OK\",\"timestamp\":\"2025-12-27T14:30:00.000Z\"}"
    },
    ...
  ]
}
```

---

## 📋 Tested Endpoints

The scripts test the following categories:

### Core APIs
- ✓ Health Check
- ✓ Dashboard (modules, user-info, stats)
- ✓ Authentication

### Module APIs
- ✓ **Equipment** - List, available, types
- ✓ **Operators** - List, available today
- ✓ **Reports** - List, daily reports
- ✓ **Contracts** - List, stats
- ✓ **Projects** - List
- ✓ **Providers** - List, stats
- ✓ **Maintenance** - List
- ✓ **Notifications** - List
- ✓ **Valuations** - List
- ✓ **Logistics** - Movements, products
- ✓ **HR** - Employees, availability, documents
- ✓ **Scheduling** - Maintenance, tasks, timesheets
- ✓ **Administration** - Cost centers
- ✓ **SST** - Incidents
- ✓ **Checklists** - Templates, list
- ✓ **Fuel** - List
- ✓ **Accounts Payable** - List

---

## 🔐 Authentication

### For Protected Endpoints

The scripts support two authentication methods:

**Method 1: Automatic Login** (Node.js script)
```bash
node scripts/test-api.js \
  --email admin@bitcorp.com \
  --password admin123
```

**Method 2: Use Existing Token**
```bash
# Get token from login response
TOKEN=$(curl -s -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcorp.com","password":"admin123"}' \
  | jq -r '.token')

# Use token
node scripts/test-api.js --token $TOKEN
```

### Default Test Credentials
- Email: `admin@bitcorp.com`
- Password: `admin123` (or set in your `.env`)

---

## 🛠️ Customization

### Add More Endpoints

Edit the respective script and add to the endpoints array:

**For test-api.js:**
```javascript
const endpoints = [
  // ... existing endpoints
  { path: '/api/new-module', name: 'New Module' },
];
```

**For shell scripts:**
Add to the `GET_ENDPOINTS` array:
```bash
declare -a GET_ENDPOINTS=(
  # ... existing endpoints
  "/api/new-module"
)
```

### Modify Report Output

Edit the markdown generation section in the scripts to customize:
- Report structure
- Styling
- Additional metrics
- Custom sections

---

## ⚡ Performance Tips

### For Large API Lists

**Increase Concurrency** (Node.js):
```bash
node scripts/test-api.js --concurrent 10
```

**Increase Timeout** for slow endpoints:
```bash
node scripts/test-api.js --timeout 10000
```

### Filter Endpoints

Modify scripts to test specific modules:
```bash
# Only test equipment endpoints
node scripts/test-api.js | grep -i equipment
```

---

## 🐛 Troubleshooting

### Connection Refused
```bash
# Make sure backend is running
curl http://localhost:3400/health

# If not running, start it
docker-compose -f docker-compose.dev.yml up backend
```

### Authentication Failed
```bash
# Check credentials
curl -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitcorp.com","password":"admin123"}'
```

### Timeout Errors
Increase the timeout:
```bash
node scripts/test-api.js --timeout 15000
```

### JSON Parse Errors
Some responses might not be valid JSON. Run with `jq` for safe parsing:
```bash
cat api-test-results-*.json | jq '.' 2>/dev/null
```

---

## 📝 Automation

### Run Tests on Schedule (macOS/Linux)

**Hourly tests:**
```bash
# Add to crontab
0 * * * * cd /path/to/bitcorp-erp && node scripts/test-api.js --output "reports/$(date +%Y%m%d-%H%M%S).md"
```

**Daily tests with Slack notification:**
```bash
#!/bin/bash
cd /path/to/bitcorp-erp

# Run tests
node scripts/test-api.js --output "reports/daily-$(date +%Y%m%d).md"

# Send to Slack
curl -X POST $SLACK_WEBHOOK \
  -d "{\"text\": \"Daily API tests completed. Report: https://...\"}"
```

---

## 📚 Integration with CI/CD

### GitHub Actions

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      
      - name: Start Backend
        run: docker-compose -f docker-compose.dev.yml up -d backend
      
      - name: Wait for API
        run: sleep 10 && curl http://localhost:3400/health
      
      - name: Run API Tests
        run: node scripts/test-api.js --output test-results.md
      
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: api-test-report
          path: test-results.md
```

---

## 💡 Tips & Tricks

### Quick Endpoint Check
```bash
# Test single endpoint
curl -s http://localhost:3400/api/equipment | jq .

# Test with authentication
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3400/api/operators | jq .
```

### Export Report to HTML
```bash
# Install pandoc
brew install pandoc

# Convert markdown to HTML
pandoc api-test-report-*.md -o report.html
```

### Monitor Over Time
```bash
# Run tests and save with timestamp
for i in {1..10}; do
  node scripts/test-api.js --output "results/run-$i.md"
  sleep 60
done

# Analyze results
cat results/run-*.json | jq '.metadata.summary' | sort | uniq -c
```

---

## 🚀 Next Steps

1. **Integrate into Your Workflow**
   - Add to CI/CD pipeline
   - Run on schedule
   - Monitor performance trends

2. **Extend Testing**
   - Add POST/PUT/DELETE tests
   - Test with different auth levels
   - Performance benchmarking

3. **Automation**
   - Create dashboards
   - Set up alerts
   - Track metrics over time

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify backend is running
3. Check credentials
4. Review error messages in reports

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
