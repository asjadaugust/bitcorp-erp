#!/usr/bin/env node

/**
 * Quick Reference Guide for API Testing Scripts
 * Print this in the terminal for easy reference
 */

const chalk = require('chalk');

// Simplified coloring for markdown output
const bold = (text) => `**${text}**`;
const code = (text) => `` + text + ``;
const heading = (level, text) => `${'#'.repeat(level)} ${text}`;

console.log(`
${heading(1, 'API Testing Scripts - Quick Reference')}

${heading(2, '🚀 Quickest Start')}

${code('npm run api:test:quick')} - Run tests right now (no auth needed)

${heading(2, '📦 All Available Commands')}

${code('npm run api:test:quick')} - Test without authentication  
${code('npm run api:test:auth')} - Test with admin credentials  
${code('npm run api:test:shell')} - Run basic shell script  
${code('npm run api:test:all')} - Run all test methods  
${code('npm run api:test:help')} - Show help  
${code('npm run api:test')} - Run Node.js script directly

${heading(2, '🎯 Direct Script Usage')}

${bold('Node.js (Recommended):')}  
${code('node scripts/test-api.js')}  
${code('node scripts/test-api.js --email admin@bitcorp.com --password admin123')}  
${code('node scripts/test-api.js --url http://api.example.com --concurrent 5')}

${bold('Shell Scripts:')}  
${code('./scripts/test-api-endpoints.sh')}  
${code('./scripts/test-api-advanced.sh')}  
${code('./scripts/run-api-tests.sh auth')}

${heading(2, '📊 What Gets Tested')}

- Health & Dashboard endpoints  
- Equipment, Operators, Reports  
- Contracts, Projects, Providers  
- Maintenance, Valuations, Logistics  
- HR, Scheduling, Administration  
- And ~35 total endpoints across all modules

${heading(2, '📄 Report Output')}

Generated files:
- ${code('api-test-report-YYYY-MM-DD.md')} - Formatted markdown with responses
- ${code('api-test-results-YYYY-MM-DD.json')} - Machine-readable JSON report

${heading(2, '⚙️ Common Options')}

${code('--url <url>')} - Base URL (default: http://localhost:3400)  
${code('--email <email>')} - Login email (default: admin@bitcorp.com)  
${code('--password <pwd>')} - Login password  
${code('--output <file>')} - Output markdown file  
${code('--json <file>')} - JSON report file  
${code('--timeout <ms>')} - Request timeout (default: 5000)  
${code('--concurrent <n>')} - Concurrent requests (default: 3)

${heading(2, '🔧 Setup (One-time only)')}

1. Backend must be running:
   ${code('docker-compose -f docker-compose.dev.yml up backend')}

2. Run tests:
   ${code('npm run api:test:quick')}

3. View report:
   ${code('cat api-test-report-*.md')}

${heading(2, '⏱️ Typical Workflow')}

${heading(3, 'Development')}
\`\`\`bash
# In terminal 1
docker-compose -f docker-compose.dev.yml up backend

# In terminal 2
npm run api:test:quick
cat api-test-report-*.md
\`\`\`

${heading(3, 'Testing with Auth')}
\`\`\`bash
npm run api:test:auth
jq '.metadata.summary' api-test-results-*.json
\`\`\`

${heading(3, 'Performance Monitoring')}
\`\`\`bash
node scripts/test-api.js --concurrent 5 --timeout 3000
\`\`\`

${heading(2, '🐛 Quick Troubleshooting')}

${bold('Connection Refused?')}  
- Check if backend is running: ${code('curl http://localhost:3400/health')}  
- Start it: ${code('docker-compose -f docker-compose.dev.yml up backend')}

${bold('Auth Failed?')}  
- Verify credentials in ${code('.env')} file  
- Try login manually: ${code('curl -X POST http://localhost:3400/api/auth/login')}

${bold('Timeouts?')}  
- Increase timeout: ${code('node scripts/test-api.js --timeout 10000')}  
- Reduce concurrency: ${code('node scripts/test-api.js --concurrent 2')}

${heading(2, '📚 More Information')}

- Detailed docs: See ${code('scripts/API-TESTING-README.md')}  
- Summary: See ${code('API-TESTING-SUMMARY.md')}  
- All endpoints: Check scripts header comments

${heading(2, '💡 Pro Tips')}

${bold('View JSON reports nicely:')}  
${code('cat api-test-results-*.json | jq .')}

${bold('Find slowest endpoints:')}  
${code("cat api-test-results-*.json | jq '.results | sort_by(-.responseTime) | .[0:5]'")}

${bold('Check for errors only:')}  
${code("cat api-test-results-*.json | jq '.results[] | select(.statusCode != 200)'")}

${bold('Convert to HTML:')}  
${code('pandoc api-test-report-*.md -o report.html')}

${bold('Schedule hourly tests:')}  
${code('(crontab -l 2>/dev/null; echo "0 * * * * cd ~/bitcorp-erp && npm run api:test:quick") | crontab -')}

${heading(2, '📋 Files Location')}

${code('scripts/test-api.js')} - Main Node.js script  
${code('scripts/test-api-endpoints.sh')} - Basic shell script  
${code('scripts/test-api-advanced.sh')} - Advanced shell script  
${code('scripts/run-api-tests.sh')} - Convenient wrapper  
${code('scripts/API-TESTING-README.md')} - Full documentation

${heading(2, '✨ Key Features')}

✓ Tests ~35 GET endpoints  
✓ Auto-generates markdown + JSON reports  
✓ Built-in performance metrics  
✓ Automatic authentication  
✓ Configurable concurrency  
✓ Color-coded terminal output  
✓ No external dependencies (shell scripts)  
✓ Easy to integrate with CI/CD

---

${bold('Last Updated:')} 2025-12-27  
${bold('Created by:')} API Testing Script Suite
`);
