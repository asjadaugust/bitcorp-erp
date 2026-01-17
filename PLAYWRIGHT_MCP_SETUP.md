# Playwright MCP Configuration - Validation Report

## ✅ Configuration Complete

### `opencode.json` Setup

The file has been successfully configured with Playwright MCP:

```json
{
  "$schema": "https://opencode.ai/schemas/opencode.json",
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    }
  }
}
```

---

## 🎯 Configuration Details

### MCP Server: `playwright`

- **Command**: `npx` (Node Package Executor)
- **Package**: `@executeautomation/playwright-mcp-server`
- **Auto-install**: `-y` flag enables automatic installation

### Environment Variables

- **`PLAYWRIGHT_HEADLESS`**: `false` (browser window will be visible)
- **`PLAYWRIGHT_BROWSER`**: `chromium` (default browser)

---

## 🔍 Pre-Validation Checks

### ✅ File Validation

- **JSON Syntax**: Valid ✅
- **Schema Reference**: Included ✅
- **Structure**: Correct ✅

### ✅ Application Status

- **Frontend**: Running on http://localhost:3420 ✅
- **HTTP Status**: 200 OK ✅
- **Backend**: Running on http://localhost:3400 ✅

### ⏳ MCP Server Package

- **Package**: `@executeautomation/playwright-mcp-server`
- **Installation**: Will be automatically installed on first use via npx -y

---

## 🚀 How to Use Playwright MCP

### Restart OpenCode

After updating `opencode.json`, you need to restart OpenCode for the MCP server to be recognized:

1. **Exit OpenCode** (close the current session)
2. **Restart OpenCode** (reopen in your IDE)
3. **MCP Server** will automatically start when OpenCode initializes

### Available MCP Tools

Once connected, OpenCode agents will have access to Playwright tools like:

- `playwright_navigate` - Navigate to a URL
- `playwright_click` - Click elements
- `playwright_fill` - Fill form inputs
- `playwright_screenshot` - Take screenshots
- `playwright_evaluate` - Execute JavaScript
- And more...

### Example Usage (for OpenCode agents)

```typescript
// Navigate to the application
await playwright_navigate({ url: 'http://localhost:3420' });

// Wait for the page to load
await playwright_wait_for_selector({ selector: 'body' });

// Take a screenshot
await playwright_screenshot({
  path: 'homepage.png',
  fullPage: true,
});

// Click on login button
await playwright_click({ selector: "button:has-text('Login')" });

// Fill form
await playwright_fill({
  selector: "input[name='username']",
  value: 'admin',
});
```

---

## 📋 Manual Validation Steps

### Step 1: Verify OpenCode Recognizes MCP

After restarting OpenCode, check that the Playwright MCP server is loaded:

- Look for Playwright tools in the available tools list
- OpenCode should show MCP connection status

### Step 2: Test Browser Launch

Ask OpenCode agent to:

```
Use Playwright MCP to open http://localhost:3420 in a browser
```

Expected result:

- Chromium browser window opens (non-headless)
- Application loads successfully
- Screenshot can be captured

### Step 3: Test Interaction

Ask OpenCode agent to:

```
Navigate to the login page and enter username "admin"
```

Expected result:

- Browser navigates to login
- Username field is filled
- Actions are visible in the browser window

---

## 🔧 Troubleshooting

### Issue: MCP Server Not Found

**Solution**:

```bash
# Manually install the package
npm install -g @executeautomation/playwright-mcp-server
```

### Issue: Browser Doesn't Launch

**Solution**:

```bash
# Install Playwright browsers
npx playwright install chromium
```

### Issue: Port Already in Use

**Solution**:

- Frontend runs on port 3420
- Backend runs on port 3400
- Ensure these ports are available
- Check with: `lsof -i :3420` and `lsof -i :3400`

### Issue: Headless Mode Not Working

**Solution**:
Change `PLAYWRIGHT_HEADLESS` in `opencode.json`:

```json
"env": {
  "PLAYWRIGHT_HEADLESS": "true"
}
```

### Issue: Different Browser Needed

**Solution**:
Change `PLAYWRIGHT_BROWSER` in `opencode.json`:

```json
"env": {
  "PLAYWRIGHT_BROWSER": "firefox"  // or "webkit"
}
```

---

## 🎯 Testing the Checklist Feature with MCP

### Test Scenario 1: Template List

```
Navigate to http://localhost:3420/checklists/templates
Verify the table shows 3 templates
Take a screenshot
```

### Test Scenario 2: Create Inspection

```
Navigate to http://localhost:3420/checklists/inspections/new
Fill the form:
- Select template: "Inspección Diaria - Excavadora"
- Enter Equipo ID: 1
- Enter Inspector ID: 1
Click "Siguiente"
Take screenshot of each step
```

### Test Scenario 3: Login Flow

```
Navigate to http://localhost:3420
Click on login form
Fill username: "admin"
Fill password: "admin123"
Click "Ingresar"
Verify dashboard loads
```

---

## 📊 Configuration Options

### Supported Browsers

- `chromium` (default, recommended)
- `firefox`
- `webkit` (Safari engine)

### Headless Mode

- `false` - Browser window visible (recommended for testing)
- `true` - Browser runs in background (faster, for CI/CD)

### Additional Environment Variables (optional)

```json
"env": {
  "PLAYWRIGHT_HEADLESS": "false",
  "PLAYWRIGHT_BROWSER": "chromium",
  "PLAYWRIGHT_TIMEOUT": "30000",
  "PLAYWRIGHT_SLOW_MO": "500"
}
```

---

## ✅ Success Criteria Checklist

- [x] `opencode.json` created/updated
- [x] Valid JSON syntax
- [x] Playwright MCP server configured
- [x] Non-headless mode enabled
- [x] Chromium browser selected
- [x] Minimal configuration (no unrelated MCPs)
- [x] Frontend application running
- [ ] OpenCode restarted (manual step required)
- [ ] MCP server connected (after restart)
- [ ] Browser launches successfully (after restart)
- [ ] Application loads in browser (after restart)

---

## 🔄 Next Steps

### Immediate (Required)

1. **Restart OpenCode** to load the new MCP configuration
2. **Verify MCP Connection** by checking OpenCode's MCP status
3. **Test Browser Launch** by asking agent to open the application

### Testing (Recommended)

1. Navigate to the checklist feature
2. Test form interactions
3. Take screenshots for verification
4. Test login flow
5. Validate end-to-end inspection creation

### Optional Enhancements

1. Add more MCP servers if needed (e.g., database, API testing)
2. Configure additional Playwright options
3. Set up automated testing scripts
4. Integrate with CI/CD pipeline

---

## 📝 Configuration Summary

**Status**: ✅ **CONFIGURED & READY**

**What Changed**:

- Created/Updated `opencode.json`
- Added Playwright MCP server configuration
- Enabled non-headless Chromium browser
- Set sensible defaults for browser automation

**What's Working**:

- ✅ Valid JSON configuration
- ✅ MCP server package specified
- ✅ Browser settings configured
- ✅ Frontend application accessible

**What's Next**:

- 🔄 Restart OpenCode (manual step)
- ✅ Test MCP integration
- 🎯 Use Playwright for automated testing

---

## 🎉 Configuration Complete!

The `opencode.json` file is now properly configured with Playwright MCP. After restarting OpenCode, agents will be able to:

- Launch a Chromium browser window
- Navigate to the Bitcorp ERP application
- Interact with UI elements (click, type, scroll)
- Take screenshots and validate functionality
- Test the entire checklist feature end-to-end

**No application code was modified** ✅
**Configuration is minimal and readable** ✅
**Ready for browser automation** ✅

---

**Last Updated**: January 4, 2026  
**Configuration File**: `/Users/klm95441/Drive/projects/bitcorp-erp/opencode.json`  
**Status**: READY FOR USE (restart OpenCode to activate)
