---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

Record any web app — local or live — and turn it into a narrated tutorial automatically.

**Your role:** Automate the browser, record the flow, track every action.
**Vorec's role:** Watch the video, write narration, generate voice-over.

**Work cleanly:** Temp files created fresh, deleted after upload. User sees only the editor URL.

## Prerequisites

**Run ALL checks. Fix before continuing.**

```bash
# 1. Playwright CLI
npm list @playwright/cli 2>/dev/null || npm install @playwright/cli
npx playwright-cli --version

# 2. Chromium
npx playwright-cli open --headless about:blank 2>/dev/null && npx playwright-cli close || npx playwright install chromium

# 3. FFmpeg
ffmpeg -version 2>/dev/null || echo "MISSING: brew install ffmpeg"

# 4. Vorec CLI
npx @vorec/cli@latest --version

# 5. API key
cat ~/.vorec/config.json 2>/dev/null || npx @vorec/cli@latest login
```

**Never tell the user to manually copy an API key. Always use `vorec login`.**

## Workflow

### 1. Check credits
```bash
npx @vorec/cli@latest check
```

### 2. Understand the flow
Ask: What's the goal? Who's watching? Anything to explain?

### 3. Analyze validation
If the flow involves forms, load [./rules/validation.md](./rules/validation.md) — read frontend + backend for valid test data.

### 4. Explore the app

Open the app and understand its structure:

```bash
npx playwright-cli open <URL> --headed
npx playwright-cli snapshot
```

The snapshot shows every element with a ref (e1, e5, e15). Read the snapshot to understand:
- What's on the page
- Which elements are interactive
- How the page is structured

Test interactions before recording:
```bash
npx playwright-cli click e5        # Click by ref
npx playwright-cli fill e8 "text"  # Type into input
npx playwright-cli snapshot        # Verify what happened
```

**Element refs are the primary way to interact.** They're more reliable than CSS selectors because they come directly from the live page. Only fall back to CSS/role selectors when refs aren't available.

For the full command reference, load [./rules/playwright-cli.md](./rules/playwright-cli.md).

### 5. Handle auth

**For local apps:** Use `--persistent` to keep auth between commands:
```bash
npx playwright-cli open <LOGIN_URL> --headed --persistent
# Tell user: "Log in manually in the browser"
# After login:
npx playwright-cli state-save .vorec/auth.json
```

**For live apps:** Same flow, but the user logs into the production site.

Load [./rules/auth.md](./rules/auth.md) for details on session management, cookies, and storage state.

### 6. Ask preferences
> 1. **Language?** (default: English)
> 2. **Style?** Tutorial / Professional / Conversational / Storytelling / Concise / Exact

### 7. Record the tutorial

Load [./rules/recording.md](./rules/recording.md) for the full recording workflow.

Summary:
1. `playwright-cli open <URL> --headed` + `resize 1920 1080`
2. `video-start`
3. For each action: `snapshot` → interact via ref → get coordinates via `run-code` → verify with `snapshot`
4. If error appears: keep recording, show the error, fix it (educational)
5. `video-stop .vorec/recordings/recording.webm`
6. Convert webm → mp4 via FFmpeg
7. Build tracked actions JSON with timestamps + coordinates

**Key pattern — snapshot → act → verify:**
```bash
npx playwright-cli snapshot              # See what's on the page
npx playwright-cli click e5              # Act on an element
npx playwright-cli snapshot              # Verify the result
```

After every action, check the snapshot for errors (validation messages, toasts, alerts). If an error appears, that's part of the tutorial — track it as a `narrate` action.

### 8. User validates video
Ask user to review before uploading. A bad recording wastes credits.

### 9. Upload to Vorec
```bash
npx @vorec/cli@latest run vorec.json --skip-record --video .vorec/recordings/recording.mp4 --tracked-actions .vorec/tracked-actions.json
```

### 10. Clean up
```bash
rm -f vorec.json
rm -rf .vorec/recordings .vorec/tracked-actions.json
npx playwright-cli close
```

### 11. Share the editor URL

## Handling Any Website

### Local dev server
```bash
# Auto-detect running server
lsof -i :3000 -i :3001 -i :4200 -i :5173 -i :8080 2>/dev/null | grep LISTEN
npx playwright-cli open http://localhost:<PORT> --headed
```

### Live production site
```bash
npx playwright-cli open https://example.com --headed
```

### Sites with cookie banners
```bash
npx playwright-cli snapshot
# Find the accept button ref
npx playwright-cli click e42  # Accept cookies
```

### Sites with popups/modals on load
```bash
npx playwright-cli snapshot
# Find the close button
npx playwright-cli click e7   # Close popup
```

### Single-page apps (React, Vue, Next.js)
SPAs update the DOM without full page loads. After each action:
```bash
npx playwright-cli run-code "async page => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}"
npx playwright-cli snapshot  # Get updated state
```

### Sites with iframes
```bash
npx playwright-cli run-code "async page => {
  const frame = page.locator('iframe').contentFrame();
  await frame.locator('button').click();
}"
```

### Sites behind auth walls
```bash
npx playwright-cli open <URL> --headed --persistent
# User logs in manually
npx playwright-cli state-save .vorec/auth.json
# Now auth persists for the recording session
```

## Debug When Things Go Wrong

```bash
# See browser console errors
npx playwright-cli console

# See network requests
npx playwright-cli network

# Start tracing (captures DOM + network + screenshots)
npx playwright-cli tracing-start
# ... do actions ...
npx playwright-cli tracing-stop
# Inspect: npx playwright show-trace traces/trace-*.trace
```

## Key Rules

1. `vorec check` before anything
2. `snapshot` is your eyes — use it before AND after every action
3. Element refs (`e5`) over CSS selectors — always prefer refs from snapshot
4. Verify every action with a snapshot
5. Recover from errors in the recording (educational content)
6. User validates video before upload
7. Clean up + close browser after
8. Never ask for passwords
9. Works on ANY website — local or live

## Reference Files

- [./rules/playwright-cli.md](./rules/playwright-cli.md) — Full command reference
- [./rules/recording.md](./rules/recording.md) — Recording with coordinate tracking
- [./rules/validation.md](./rules/validation.md) — Test data + error recovery
- [./rules/auth.md](./rules/auth.md) — Sessions, cookies, storage state
- [./rules/actions.md](./rules/actions.md) — Vorec action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors
