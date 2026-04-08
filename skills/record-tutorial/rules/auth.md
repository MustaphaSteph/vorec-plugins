---
name: authentication
description: How to handle login flows and save browser sessions for local and hosted apps
---

# Authentication

## Check if auth is needed

Read the router/auth guard in the codebase. Look for:
- Auth guards wrapping routes
- Redirect to `/login` for unauthenticated users
- Protected route middleware

## Capture session (local apps)

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

## Capture session (hosted/embedded apps)

For apps that run inside a host platform (Shopify Admin, Salesforce, HubSpot, etc.) or use OAuth:

1. Identify the host platform URL from the codebase (e.g. `shopify.config.ts`, `.env`, `package.json`)
2. Write a session script that navigates to the **host platform** — not the app directly:

```javascript
// save-session.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Navigate to the host platform login
await page.goto('https://admin.shopify.com');
console.log('Please log in to the platform and navigate to the app...');

// Wait until the user reaches the app inside the host
// Use a broad pattern — the user may go through OAuth, 2FA, store selection
await page.waitForURL('**/apps/**', { timeout: 180000 });
await page.waitForTimeout(3000); // let the app iframe fully load

await context.storageState({ path: '.vorec/storageState.json' });
console.log('Session saved to .vorec/storageState.json');
await browser.close();
```

3. Adjust the `waitForURL` pattern based on the platform:
   - Shopify: `**/admin/apps/**` or `**/store/*/apps/**`
   - Salesforce: `**lightning/n/**`
   - HubSpot: `**/integrations-beta/**`
   - Generic OAuth: wait for the redirect back to the app

4. Give the user **3 minutes** (180s timeout) — hosted logins often involve OAuth, 2FA, or store selection

## Key rules

- **Never ask for passwords** — user types in the browser
- Use `waitForURL` to detect login completion — no stdin/interactive prompts
- Save session to `.vorec/storageState.json` — reusable across recordings
- If no auth needed, omit `storageState` from the manifest
- For hosted apps, the session includes the **host platform's cookies** — this is expected
