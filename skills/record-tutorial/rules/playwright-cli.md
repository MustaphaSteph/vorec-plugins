---
name: playwright-cli-reference
description: playwright-cli commands for browser automation, snapshots, video, sessions
---

# Playwright CLI Reference

## Core Commands

```bash
npx playwright-cli open <url> --headed     # Open browser (visible)
npx playwright-cli goto <url>               # Navigate
npx playwright-cli snapshot                  # Get page structure with element refs
npx playwright-cli close                     # Close browser
```

## Interacting with Elements

After `snapshot`, use element refs (e1, e5, e15) to interact:

```bash
npx playwright-cli click e5
npx playwright-cli dblclick e7
npx playwright-cli fill e8 "user@example.com"
npx playwright-cli type "search query"       # Types into focused element
npx playwright-cli select e9 "option-value"
npx playwright-cli check e12                 # Checkbox
npx playwright-cli uncheck e12
npx playwright-cli hover e4
npx playwright-cli drag e2 e8
npx playwright-cli upload ./file.pdf         # File upload
```

You can also use CSS or role selectors:

```bash
npx playwright-cli click "#main > button.submit"
npx playwright-cli click "role=button[name=Submit]"
```

## Keyboard

```bash
npx playwright-cli press Enter
npx playwright-cli press Tab
npx playwright-cli press Escape
npx playwright-cli press ArrowDown
npx playwright-cli press Control+a
npx playwright-cli keydown Shift
npx playwright-cli keyup Shift
```

## Video Recording

```bash
npx playwright-cli video-start
# ... do actions ...
npx playwright-cli video-stop recording.webm
```

## Screenshots

```bash
npx playwright-cli screenshot                    # Full page
npx playwright-cli screenshot e5                  # Specific element
npx playwright-cli screenshot --filename=page.png
```

## Tabs

```bash
npx playwright-cli tab-list
npx playwright-cli tab-new https://example.com
npx playwright-cli tab-select 0
npx playwright-cli tab-close
```

## Sessions & Auth

```bash
# Persistent session (cookies survive between commands)
npx playwright-cli open <url> --headed --persistent

# Save auth state
npx playwright-cli state-save auth.json

# Load auth state later
npx playwright-cli state-load auth.json

# Named sessions for different projects
npx playwright-cli -s=myapp open <url> --persistent
npx playwright-cli -s=myapp click e5
npx playwright-cli -s=myapp close
```

## Storage Management

```bash
# Cookies
npx playwright-cli cookie-list
npx playwright-cli cookie-get session_id
npx playwright-cli cookie-set session abc123 --domain=example.com --httpOnly --secure
npx playwright-cli cookie-delete session_id
npx playwright-cli cookie-clear

# localStorage
npx playwright-cli localstorage-list
npx playwright-cli localstorage-get theme
npx playwright-cli localstorage-set theme dark
```

## Network Mocking

```bash
npx playwright-cli route "**/*.jpg" --status=404          # Block images
npx playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
npx playwright-cli route-list
npx playwright-cli unroute "**/*.jpg"
```

## Debugging

```bash
npx playwright-cli console              # Show browser console
npx playwright-cli console warning      # Filter by level
npx playwright-cli network              # Show network requests
npx playwright-cli tracing-start        # Start recording trace
npx playwright-cli tracing-stop         # Stop and save trace
```

## Custom Code (escape hatch)

For anything the CLI doesn't cover:

```bash
npx playwright-cli run-code "async page => {
  // Full Playwright API available
  const box = await page.locator('button').boundingBox();
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}"
```

## Get Element Coordinates (for Vorec tracking)

```bash
npx playwright-cli run-code "async page => {
  const el = page.locator('<SELECTOR>');
  const box = await el.boundingBox();
  const viewport = page.viewportSize();
  return {
    x: Math.round(((box.x + box.width / 2) / viewport.width) * 1000),
    y: Math.round(((box.y + box.height / 2) / viewport.height) * 1000),
  };
}"
```

## Wait Strategies

```bash
# Wait for loading to finish
npx playwright-cli run-code "async page => {
  await page.locator('.loading, .skeleton, [aria-busy=true]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
}"

# Wait for specific element
npx playwright-cli run-code "async page => {
  await page.locator('.success-message').waitFor({ state: 'visible' });
}"

# Wait for API response
npx playwright-cli run-code "async page => {
  await page.waitForResponse(r => r.url().includes('/api/') && r.status() === 200);
}"
```

## Viewport

```bash
npx playwright-cli resize 1920 1080
```

## Tips

- Always `snapshot` after each action to verify what happened
- Use `--headed` to see the browser during recording
- Use `--persistent` for auth that needs to survive between commands
- Use `run-code` for anything the CLI doesn't cover (coordinates, complex waits)
- Use named sessions (`-s=name`) when working with multiple browser instances
