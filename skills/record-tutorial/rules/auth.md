---
name: authentication
description: How to handle login flows and save browser sessions for local, hosted, and live sites
---

# Authentication

Load this file when the target site requires login.

## Check if auth is needed

- **Connected mode**: read the router/auth guard in the codebase. Look for auth guards wrapping routes, redirect to `/login`, protected route middleware.
- **Explore mode**: navigate to the target URL — if redirected to a login page or you see "Sign in" as the first visible element, auth is needed.

## 🎯 Canonical login capture subroutine

**Use this whenever you need a fresh session.** Do NOT ask permission first — open the browser immediately and tell the user what to do in ONE sentence.

### Step 1 — Check for an existing valid session first

```bash
# Does the session file exist AND cover the target origin?
TARGET="https://vorec.ai"
if [ -f .vorec/storageState.json ]; then
  HOST=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$TARGET').netloc)")
  VALID=$(cat .vorec/storageState.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
origins = [o.get('origin', '') for o in d.get('origins', [])]
print('yes' if any('$HOST' in o for o in origins) else 'no')
")
  echo "Session valid for $HOST: $VALID"
fi
```

If `valid=yes` → skip to Step 4 (use the existing session).
If `valid=no` OR file missing → continue to Step 2.

### Step 2 — Open the browser in HEADED mode (act first, no asking)

```bash
playwright-cli close-all
playwright-cli open --headed https://SITE/login
playwright-cli resize 1920 1080
```

**⚠️ CRITICAL: `playwright-cli open` defaults to HEADLESS.** You MUST use `--headed` for user login — otherwise the user can't see the window and won't know what to do.

### Step 3 — Tell the user ONE thing to do

Status update to the user (one sentence, no questions):

> "Chromium is open at `<SITE>/login`. Log in however you prefer (email, Google, GitHub). When you land on the dashboard, type 'done'."

**Don't ask anything else right now.** The user is focused on logging in. Any other question will be ignored and confuse them.

### Step 4 — On "done", save the session and close

```bash
playwright-cli state-save .vorec/storageState.json
playwright-cli close-all
```

The saved file has cookies + localStorage + sessionStorage for the origin, reusable across recordings until the session expires (usually weeks).

### Step 5 — NOW ask follow-up questions

After the session is saved, continue with the rest of the workflow. If there are still decisions to make, ask them now:

> "Session saved. Ready to record — want visible cursors in the video?"

## ❌ Bad behavior (don't do this)

```
Agent: I see we need to log in. Let me walk you through the options:
       1. I can launch a Playwright browser in headed mode
       2. You'll need to log in manually
       3. I'll save the session
       4. Then we can record
       Do you want me to proceed? Also, what scope?
       What's the test file path? What style of narration?
```

## ✅ Good behavior

```
Agent: Opening browser for login.
       (runs: playwright-cli open --headed https://vorec.ai/login)
       Log in and type 'done' when you're on the dashboard.

(user logs in)

User: done

Agent: Session saved. Recording now.
       (runs the hero script — already has sensible defaults)
```

## Capture session with a hero script (alternative)

If you want to do it inside a Playwright script instead of CLI commands (for example, to wait on a specific redirect URL):

```javascript
// save-session.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });  // ← must be headed!
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('<LOGIN_URL_FROM_ROUTER>');
console.log('Please log in manually in the browser...');
await page.waitForURL('**/<POST_LOGIN_ROUTE>**', { timeout: 120000 });
await context.storageState({ path: '.vorec/storageState.json' });
console.log('Session saved to .vorec/storageState.json');
await browser.close();
```

Use this pattern when:
- The login has multiple steps (OAuth redirects, 2FA, email link)
- You want to auto-detect completion via a specific redirect URL
- You're in Connected mode and know the exact post-login route

## Capture session for hosted/embedded apps

For apps inside a host platform (Shopify Admin, Salesforce, HubSpot, etc.):

1. Open the **host platform URL** — NOT the embedded app URL
2. User logs into the host, navigates to the app
3. Wait for the app's iframe URL (use a broad `waitForURL` pattern)
4. Save storageState

```javascript
const browser = await chromium.launch({ headless: false });  // MUST be headed
const context = await browser.newContext();
const page = await context.newPage();

// Navigate to the host platform
await page.goto('https://admin.shopify.com');
console.log('Log in and navigate to the app...');

// Wait until the user reaches the embedded app
await page.waitForURL('**/apps/**', { timeout: 180000 });  // 3-min timeout for OAuth/2FA
await page.waitForTimeout(3000);

await context.storageState({ path: '.vorec/storageState.json' });
await browser.close();
```

### URL patterns for common platforms
- Shopify: `**/admin/apps/**` or `**/store/*/apps/**`
- Salesforce: `**lightning/n/**`
- HubSpot: `**/integrations-beta/**`
- Generic OAuth: `**/auth/callback**` or `**/dashboard**`

## Detecting a stale session

A storageState file can exist but be useless — for example, if it was captured for `localhost:3000` and you need to record on `vorec.ai`. Always check before reusing:

```bash
cat .vorec/storageState.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
origins = [o.get('origin', '') for o in d.get('origins', [])]
cookies = d.get('cookies', [])
print(f'origins: {origins}')
print(f'cookies: {len(cookies)}')
"
```

If:
- `cookies: 0` → session is empty, re-capture
- `origins` doesn't contain the target domain → session is for a different site, re-capture
- `origins` contains the target domain AND `cookies > 0` → session is good to use

## Key rules

- **Never ask for passwords** — the user types in the browser
- **Always use `--headed`** for login capture — headless is invisible to the user
- **Always check for an existing valid session first** — don't re-capture unnecessarily
- **Use `waitForURL`** to detect login completion — no stdin/interactive prompts
- **Save session to `.vorec/storageState.json`** — reusable across recordings
- If no auth needed, omit `storageState` from the manifest
- For hosted apps, the session includes the host platform's cookies — this is expected
- **Act first, explain in one sentence.** See [./agent-behavior.md](./agent-behavior.md) for the full rules.
