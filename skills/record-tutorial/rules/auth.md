---
name: authentication
description: How to handle login flows and save browser sessions using playwright-cli
---

# Authentication

## Check if auth is needed

Read the router/auth guard in the codebase. Look for protected routes, redirects to login.

## Using playwright-cli (preferred)

```bash
# Open browser with persistent session
npx playwright-cli open <LOGIN_URL> --headed --persistent

# Tell the user: "Please log in manually in the browser"
# Wait for them to confirm they've logged in

# Save the session
npx playwright-cli state-save .vorec/auth.json
npx playwright-cli close
```

Later, load the session before recording:

```bash
npx playwright-cli open <APP_URL> --headed
npx playwright-cli state-load .vorec/auth.json
npx playwright-cli goto <APP_URL>
```

## Using a script (alternative)

If playwright-cli isn't available, write a script:

```javascript
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('<LOGIN_URL>');
console.log('Please log in manually...');
await page.waitForURL('**/<POST_LOGIN_ROUTE>**', { timeout: 120000 });
await context.storageState({ path: '.vorec/auth.json' });
await browser.close();
```

## Key rules

- **Never ask for passwords** — user types in the browser
- Save session to `.vorec/auth.json` — reusable across recordings
- Use `--persistent` with playwright-cli for sessions that survive between commands
- If no auth needed, skip this step entirely
