---
name: playwright-best-practices
description: Playwright techniques for reliable browser automation and recording
---

# Playwright Best Practices

> **For Vorec tutorial recordings**, prefer writing a hero script and running it via `playwright-cli run-code` over calling the Playwright library directly.
> See [./hero-script.md](./hero-script.md) for the canonical recording template with slowScroll, glideClick, slowType helpers.
> See [./cli-commands.md](./cli-commands.md), [./cli-video.md](./cli-video.md), [./cli-running-code.md](./cli-running-code.md), and [./cli-session.md](./cli-session.md) for `playwright-cli` reference.
>
> The patterns below apply to **both** hero scripts and standalone Playwright scripts.

## Semantic Locators — NOT CSS selectors

```javascript
// BEST: role-based (survives refactors)
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter password')
page.getByText('Sign up')
page.getByTestId('submit-btn')

// OK: CSS selectors (when semantic not possible)
page.locator('button[type="submit"]')

// AVOID: fragile
page.locator('.btn-primary')           // class can change
page.locator('#submit')                // id can change
page.locator('div > form > button')    // structure can change
```

## Chain and filter for precision

```javascript
page.getByRole('row').filter({ hasText: 'My Project' }).getByRole('button', { name: 'Edit' })
page.getByRole('listitem').nth(2)
```

## Wait for API responses, not just DOM

```javascript
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/projects') && resp.status() === 200),
  page.getByRole('button', { name: 'Save' }).click(),
]);
```

## Wait for loading states to clear

```javascript
await page.locator('.skeleton, .loading, [aria-busy="true"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
```

## Scroll elements into view

```javascript
const element = page.getByRole('button', { name: 'Submit' });
await element.scrollIntoViewIfNeeded();
await element.click();
```

## Handle cookie banners and overlays

```javascript
const cookieBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"]');
if (await cookieBanner.count() > 0) {
  const acceptBtn = cookieBanner.getByRole('button', { name: /accept|agree|ok|got it/i });
  if (await acceptBtn.count() > 0) await acceptBtn.first().click();
}
```

## Handle new tabs/popups

```javascript
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.getByText('Open in new tab').click(),
]);
await newPage.waitForLoadState();
```

## Handle iframes

```javascript
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: 'Submit' }).click();
```

## Handle embedded/hosted apps (Shopify, Salesforce, etc.)

Apps that run inside a host platform render in an iframe. ALL interactions must go through `frameLocator`.

```javascript
// Shopify apps — the app renders inside an iframe in the admin
const appFrame = page.frameLocator('iframe#app-iframe, iframe[src*="extensions"]');

// All selectors target the frame, not the page
await appFrame.getByRole('button', { name: 'Create product' }).click();
await appFrame.getByLabel('Title').fill('Summer Collection');

// Getting boundingBox from iframe elements — need the frame's element handle
const frameElement = await page.locator('iframe#app-iframe').elementHandle();
const frameBox = await frameElement.boundingBox();
const innerEl = await appFrame.getByRole('button', { name: 'Save' }).elementHandle();
const innerBox = await innerEl.boundingBox();
// Offset inner coordinates by frame position for accurate tracking
const absBox = {
  x: frameBox.x + innerBox.x,
  y: frameBox.y + innerBox.y,
  width: innerBox.width,
  height: innerBox.height,
};
```

**Key points for embedded apps:**
- The host page (e.g. Shopify admin sidebar) is on `page` — the app content is in the `frame`
- Read the app's source code locally for selectors — they work the same inside the iframe
- `waitForURL` still works on `page` for host navigation
- Use `frame.locator()` for app-specific waiting: `await appFrame.locator('.loading').waitFor({ state: 'hidden' })`
- If the iframe `src` changes dynamically, re-acquire the frameLocator after navigation

## Handle file uploads

```javascript
await page.getByLabel('Upload file').setInputFiles('path/to/file.pdf');
```

## Use slowMo for visible actions

```javascript
const browser = await chromium.launch({ headless: false, slowMo: 50 });
```

## Capture JS errors during recording

```javascript
const jsErrors = [];
page.on('pageerror', error => jsErrors.push(error.message));
page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
if (jsErrors.length > 0) console.warn('JS errors during recording:', jsErrors);
```

## Enable tracing for debugging failed recordings

```javascript
await context.tracing.start({ screenshots: true, snapshots: true });
// ... run actions ...
// If something fails:
await context.tracing.stop({ path: '.vorec/trace.zip' });
// Debug with: npx playwright show-trace .vorec/trace.zip
```

## Retry flaky interactions

```javascript
for (let i = 0; i < 3; i++) {
  try { await element.click({ timeout: 5000 }); break; }
  catch { await page.waitForTimeout(1000 * (i + 1)); }
}
```

## Auto-detect dev servers

```javascript
import { exec } from 'node:child_process';
const ports = [3000, 3001, 4200, 5173, 8080];
// lsof -i :PORT to find which one is running
```
