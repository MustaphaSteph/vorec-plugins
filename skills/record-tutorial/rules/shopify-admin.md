---
name: shopify-admin-mode
description: Recording Shopify Admin embedded apps — open from admin.shopify.com, never automate Google login, use a dedicated browser profile
---

# Shopify Admin App Mode

Load this file when you detect a Shopify Admin embedded app. The rules below override the generic Explore/Connected flow because Shopify and Google auth behaves very differently from a normal web page.

## How to detect Shopify Admin mode

Any one of these triggers Shopify Admin mode:

- URL starts with `https://admin.shopify.com/...`
- The project contains a `shopify.app.toml` file
- The user's recent command was `shopify app dev`
- The user says "Shopify admin app", "embedded Shopify app", or names a store like `my-store.myshopify.com`

## Rule 1 — Always start from Shopify Admin, not the raw app URL

Shopify embedded apps only work when loaded through the Admin shell, because they depend on:
- Shopify Admin iframe context
- `host` and `shop` query parameters
- App Bridge session tokens (short-lived JWTs)
- Backend session-token validation

**Correct recording URL:**
```
https://admin.shopify.com/store/<store-handle>/apps/<app-handle>
```

**Never record from:**
- `http://localhost:3000`
- the ngrok / Cloudflare tunnel URL
- the app's raw `application_url`

Starting from the raw URL means no iframe, no `host` param, no App Bridge, and likely a blank page or CSP violation.

If you don't know the store handle, ask the user **once**:
> "What's your Shopify dev store? (for example: `my-shop.myshopify.com`)"

## Rule 2 — Never automate Google login

Google blocks OAuth in browsers it considers "embedded", "unsafe", or "automated" (`disallowed_useragent` error). Do not fight it.

- **Do not** fill Google email/password with Playwright
- **Do not** spoof the user agent
- **Do not** inject Google cookies
- **Do not** use an embedded WebView for Google OAuth

**If a Google login appears:**
1. Stop automation
2. Tell the user, in one sentence: *"Google login appeared — please log in manually in this browser window. Type 'done' when you're back on Shopify Admin."*
3. Wait for the user to authenticate
4. Resume only after the Shopify Admin page is visible again

This is the official Google-supported path — see Google's [WebView OAuth remediation](https://support.google.com/faqs/answer/12284343).

## Rule 3 — Use a dedicated Vorec Chrome profile

Do not try to reuse the user's default Chrome cookies. Chrome OS-encrypts them, and copying them is fragile + breaks Shopify's auth assumptions. Use a persistent profile the user logs into **once**.

The CLI supports this directly via `--profile`:

```bash
# First run — user logs into Shopify (and Google if needed) in the opened window
npx @vorec/cli run vorec.json --profile ~/Library/Application\ Support/Vorec/Profiles/shopify-dev

# Subsequent runs — profile is reused, no login needed
npx @vorec/cli run vorec.json --profile ~/Library/Application\ Support/Vorec/Profiles/shopify-dev
```

When `--profile` is passed, the CLI switches to `launchPersistentContext` with `channel: 'chrome'` (real Chrome, friendlier to Google OAuth than bundled Chromium).

This preserves:
- Shopify session cookies
- `localStorage`, `IndexedDB`, `sessionStorage`
- Site permissions
- OAuth tokens
- App Bridge state

**First recording of the session:** user logs in once, manually.
**Every recording after:** agent launches the same profile, already authenticated.

If the profile dir doesn't exist yet, create it and let the user log in. Don't skip the login step silently.

## Rule 4 — Interact with the embedded app via the iframe

The Shopify Admin page is the outer shell. Your app renders inside an iframe. The CLI handles this natively as of **@vorec/cli@2.7.0** — every manifest action accepts an optional `"frame"` field:

```json
{
  "type": "click",
  "selector": "text=Create product",
  "frame": "iframe[src*='myshopify']",
  "description": "Open product creation form"
}
```

The `frame` hint is matched against:
1. Any iframe whose URL contains the string
2. Any iframe whose `name` attribute equals the string
3. Any element matching it as a CSS selector on the parent page (e.g. `iframe[name='app-iframe']`)

If you **omit** `frame`, the CLI auto-falls-back: main frame first (2.5s timeout), then every sub-frame. That covers most simple pages, but embedded apps are reliably faster with an explicit hint.

Under the hood the CLI uses Playwright's frame API directly (the template below is for reference if you need Playwright outside the CLI):

```js
// Most Shopify embedded apps expose a frame whose URL contains the app's tunnel host
const appFrame = page.frameLocator('iframe[name="app-iframe"], iframe[src*="cloudflare"], iframe[src*="ngrok"], iframe[src*="<your-tunnel-host>"]').first();

// All clicks/types inside the app go through appFrame, not page
await appFrame.getByRole('button', { name: 'Create product' }).click();
await appFrame.getByLabel('Title').fill('Summer Collection');
```

In a Vorec manifest, this translates to scoped selectors — you'll often need to express the iframe path in the selector string. If the manifest selector doesn't reach into the iframe, fall back to clicking by visible text + adding a `wait` action to let the frame render.

Coordinate math for click markers: when the manifest runs, the CLI gets the element's bounding box via Playwright — it's relative to the page. For elements inside the frame you need the frame's offset added. The CLI handles the outer-frame case automatically; deeply nested iframes may produce slightly off click coordinates.

## Rule 5 — Verify the embedded app loaded before recording

After navigating to `admin.shopify.com/store/<store>/apps/<app-handle>`, confirm the embedded app is actually rendering:

```bash
# in exploration
playwright-cli --raw snapshot | grep -i "<app-specific-heading-or-button>"
```

If you see only the Shopify chrome (top nav, sidebar) but not your app's content, one of these is wrong:
- The tunnel URL is stale — restart `shopify app dev`
- `shopify.app.toml → application_url` doesn't match the running tunnel
- CSP `frame-ancestors` doesn't allow `https://admin.shopify.com`
- App Bridge isn't initialized — check the app's client code

**Do not start recording until the app's content is visible inside the iframe.** A recording of the Shopify shell with a blank iframe is useless.

## The full Shopify Admin recording flow

1. **Detect** — any trigger from "How to detect" above
2. **Start dev server** — user runs `shopify app dev` in their terminal (or verify it's already running)
3. **Launch Chrome with the Vorec profile** — `chromium.launchPersistentContext(profileDir, { channel: 'chrome', headless: false })`
4. **Navigate** — `page.goto('https://admin.shopify.com/store/<store>/apps/<app>')`
5. **Wait for login if needed** — if a Shopify or Google login appears, hand off to user, wait for "done"
6. **Verify the embedded app rendered** — grep snapshot for an app-specific element
7. **Tell the Vorec Recorder app to record the Chrome window** — same as any other recording
8. **Drive actions via the app iframe** — `frameLocator` for all interactions
9. **Stop + upload** — the app handles capture and upload like any other recording

## What the skill rules boil down to

| Situation | Do | Don't |
|---|---|---|
| Shopify Admin app | Start from `admin.shopify.com/store/.../apps/...` | Start from `localhost:3000` or the tunnel URL |
| Google login appears | Stop + ask user to log in | Fill email/password with Playwright |
| User auth | Dedicated Vorec profile + manual first login | Copy the user's default Chrome cookies |
| App interaction | Target the iframe via `frameLocator` | Assume DOM is on `page` |
| OAuth / cookies | Trust the real browser | Spoof UA, inject cookies, decrypt local store |

## First run vs later runs — what to tell the user

**First run:**
> "Shopify Admin detected. Opening a dedicated Vorec browser window — please log in to Shopify (and Google if asked). Type 'done' when you see the app inside Shopify Admin."

**Later runs:**
> "Shopify session found — recording now."
