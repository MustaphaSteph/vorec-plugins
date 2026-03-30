---
name: playwright-cli-reference
description: Complete playwright-cli command reference for browser automation
---

# Playwright CLI Reference

## Core

```bash
npx playwright-cli open <url> --headed      # Open visible browser
npx playwright-cli open <url> --headless     # Open headless (for testing)
npx playwright-cli goto <url>                # Navigate
npx playwright-cli snapshot                  # See page structure + element refs
npx playwright-cli close                     # Close browser
npx playwright-cli resize 1920 1080          # Set viewport
```

## Snapshots — Your Eyes on the Page

After every command, playwright-cli outputs a snapshot. You can also request one:

```bash
npx playwright-cli snapshot
npx playwright-cli snapshot --filename=after-login.yaml  # Save to file
```

The snapshot shows every element with a ref: `e1 [textbox "Email"]`, `e5 [button "Submit"]`. Use these refs to interact.

**Refs change after page updates.** Always take a fresh snapshot before interacting.

## Interacting with Elements

```bash
# By ref (preferred — from snapshot)
npx playwright-cli click e5
npx playwright-cli fill e8 "user@example.com"
npx playwright-cli select e9 "option-value"
npx playwright-cli check e12
npx playwright-cli uncheck e12
npx playwright-cli hover e4
npx playwright-cli dblclick e7
npx playwright-cli drag e2 e8
npx playwright-cli upload ./file.pdf

# By CSS selector (fallback)
npx playwright-cli click "#submit-btn"

# By role selector (fallback)
npx playwright-cli click "role=button[name=Submit]"

# Type into focused element
npx playwright-cli type "search query"
```

## Keyboard

```bash
npx playwright-cli press Enter
npx playwright-cli press Tab
npx playwright-cli press Escape
npx playwright-cli press ArrowDown
npx playwright-cli press Control+a
npx playwright-cli press Control+c
npx playwright-cli press Control+v
npx playwright-cli keydown Shift
npx playwright-cli keyup Shift
```

## Video Recording

```bash
npx playwright-cli video-start
# ... do all your actions ...
npx playwright-cli video-stop recording.webm
```

## Screenshots

```bash
npx playwright-cli screenshot                     # Full page
npx playwright-cli screenshot e5                   # Specific element
npx playwright-cli screenshot --filename=result.png
```

## Tabs

```bash
npx playwright-cli tab-list
npx playwright-cli tab-new https://example.com
npx playwright-cli tab-select 0        # Switch to first tab
npx playwright-cli tab-close           # Close current tab
npx playwright-cli tab-close 2         # Close specific tab
```

## Navigation

```bash
npx playwright-cli go-back
npx playwright-cli go-forward
npx playwright-cli reload
```

## Sessions — Auth & Persistence

```bash
# Persistent session (cookies survive between commands)
npx playwright-cli open <url> --headed --persistent

# Named sessions (isolate different browser contexts)
npx playwright-cli -s=myapp open <url> --persistent
npx playwright-cli -s=myapp click e5
npx playwright-cli -s=myapp close

# Save/restore session state
npx playwright-cli state-save auth.json
npx playwright-cli state-load auth.json

# List all sessions
npx playwright-cli list

# Close all
npx playwright-cli close-all

# Kill zombie processes
npx playwright-cli kill-all
```

## Cookies & Storage

```bash
# Cookies
npx playwright-cli cookie-list
npx playwright-cli cookie-list --domain=example.com
npx playwright-cli cookie-get session_id
npx playwright-cli cookie-set session abc123 --domain=example.com --httpOnly --secure
npx playwright-cli cookie-delete session_id
npx playwright-cli cookie-clear

# localStorage
npx playwright-cli localstorage-list
npx playwright-cli localstorage-get theme
npx playwright-cli localstorage-set theme dark
npx playwright-cli localstorage-delete theme
npx playwright-cli localstorage-clear

# sessionStorage
npx playwright-cli sessionstorage-list
npx playwright-cli sessionstorage-get step
npx playwright-cli sessionstorage-set step 3
```

## Network Mocking

```bash
npx playwright-cli route "**/*.jpg" --status=404                    # Block images
npx playwright-cli route "**/api/users" --body='[{"id":1}]' --content-type=application/json
npx playwright-cli route "**/*" --remove-header=cookie,authorization
npx playwright-cli route-list
npx playwright-cli unroute "**/*.jpg"
npx playwright-cli unroute                     # Remove all routes
```

## Debugging

```bash
npx playwright-cli console              # Browser console output
npx playwright-cli console error        # Only errors
npx playwright-cli network              # Network requests

# Tracing (captures DOM + network + screenshots)
npx playwright-cli tracing-start
# ... do actions ...
npx playwright-cli tracing-stop
# View: npx playwright show-trace traces/trace-*.trace
```

## Custom Code — run-code

For anything the CLI doesn't cover natively:

```bash
npx playwright-cli run-code "async page => {
  // Full Playwright API available
  return await page.title();
}"
```

### Get element coordinates (for Vorec tracking)

```bash
npx playwright-cli run-code "async page => {
  const el = page.locator('<SELECTOR_OR_REF>');
  const box = await el.boundingBox();
  const vp = page.viewportSize();
  return box ? {
    x: Math.round(((box.x + box.width / 2) / vp.width) * 1000),
    y: Math.round(((box.y + box.height / 2) / vp.height) * 1000)
  } : { x: 500, y: 500 };
}"
```

### Wait for loading states

```bash
npx playwright-cli run-code "async page => {
  await page.locator('.loading, .skeleton, [aria-busy=true]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
}"
```

### Wait for API response

```bash
npx playwright-cli run-code "async page => {
  await page.waitForResponse(r => r.url().includes('/api/') && r.status() === 200);
}"
```

### Handle iframes

```bash
npx playwright-cli run-code "async page => {
  const frame = page.locator('iframe').contentFrame();
  await frame.locator('button').click();
}"
```

### Handle file downloads

```bash
npx playwright-cli run-code "async page => {
  const dl = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download = await dl;
  await download.saveAs('./downloaded.pdf');
  return download.suggestedFilename();
}"
```

### Geolocation

```bash
npx playwright-cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
}"
```

### Dark mode

```bash
npx playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'dark' });
}"
```

## Tips

- **Snapshot is your eyes** — always take one before AND after each action
- **Refs change** after page updates — always use fresh refs from the latest snapshot
- **`--persistent`** keeps auth between commands — essential for logged-in flows
- **`-s=name`** isolates sessions — use for multi-browser workflows
- **`run-code`** is the escape hatch — anything the CLI can't do, `run-code` can
- **`console`** and **`network`** help debug when things go wrong
- **`tracing-start/stop`** captures everything for post-mortem debugging
