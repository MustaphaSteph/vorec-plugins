---
name: authentication
description: How to handle login flows and save browser sessions
---

# Authentication

## Check if auth is needed

Read the router/auth guard in the codebase. Look for:
- Auth guards wrapping routes
- Redirect to `/login` for unauthenticated users
- Protected route middleware

## Capture session

1. Find the login page route and post-login redirect route from code
2. Write and run a script that opens the browser and waits for login:

```javascript
// save-session.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('<LOGIN_URL_FROM_ROUTER>');
console.log('Please log in manually in the browser...');
await page.waitForURL('**/<POST_LOGIN_ROUTE_FROM_ROUTER>**', { timeout: 120000 });
await context.storageState({ path: '.vorec/storageState.json' });
console.log('Session saved to .vorec/storageState.json');
await browser.close();
```

3. Replace placeholders with actual routes from the codebase

## Key rules

- **Never ask for passwords** — user types in the browser
- Use `waitForURL` to detect login completion — no stdin/interactive prompts
- Save session to `.vorec/storageState.json` — reusable across recordings
- If no auth needed, omit `storageState` from the manifest
