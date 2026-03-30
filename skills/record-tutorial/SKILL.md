---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

Record a screen session and submit it to Vorec, which generates narrated tutorial videos automatically.

**Your role:** Record the video with valid test data, verify actions succeed, track what happens.
**Vorec's role:** Turn it into a narrated tutorial.

**Work cleanly:** All temp files created fresh, deleted after upload. User sees only the final editor URL.

## Before You Start

**Run ALL of these checks before doing anything else. Do not skip any.**

```bash
# 1. Playwright + Chromium browser
node -e "require('playwright')" 2>/dev/null && echo "Playwright OK" || npm install playwright
# Chromium MUST be installed separately — this downloads the browser (~400MB, takes a minute)
npx playwright install chromium

# 2. FFmpeg
ffmpeg -version 2>/dev/null || echo "MISSING: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"

# 3. Vorec CLI
npx @vorec/cli@latest --version
```

If any check fails, fix it before continuing. Do NOT proceed to recording without all three installed.

**4. Vorec API key** — check if configured:

```bash
cat ~/.vorec/config.json 2>/dev/null
```

If not configured or no API key found, run `vorec login` — this opens a browser where the user logs in (or signs up) and the CLI gets the key automatically:

```bash
npx @vorec/cli@latest login
```

The CLI prints a URL and pairing phrase. Tell the user to open the URL and click Verify. The CLI saves the key automatically. **Never tell the user to manually copy an API key from the website — always use `vorec login`.**

## Workflow

### 1. Check credits

Run silently: `npx @vorec/cli@latest check` — if it fails, tell the user why and stop.

### 2. Understand the flow

Ask the user:
1. What's the goal?
2. Who's watching?
3. Anything to explain?

### 3. Find app URL & wait strategy

Read project config for URL/port. Choose `waitStrategy` based on the app:
- `load` — default, works for most apps
- `domcontentloaded` — SPAs (React, Vue, Next.js)
- `networkidle` — static sites only (hangs on WebSockets/polling)
- `commit` — extremely slow apps

### 4. Analyze validation & test data

Load [./rules/validation.md](./rules/validation.md) — read frontend + backend code to generate valid test data that passes all validation.

### 5. Research selectors

**Never guess.** Verify in source code. Use semantic locators when possible — load [./rules/playwright.md](./rules/playwright.md) for locator best practices.

Priority: `getByRole` → `getByLabel` → `getByTestId` → `[data-testid]` → `:has-text()` → `[href]` → CSS selector

### 6. Handle auth

If the app requires login, load [./rules/auth.md](./rules/auth.md) for the session capture workflow.

### 7. Ask preferences

> 1. **What language?** (default: English)
> 2. **What style?** Tutorial / Professional / Conversational / Storytelling / Concise / Exact

### 8. Write the recording script

Write a standalone Playwright script — load [./rules/playwright.md](./rules/playwright.md) for best practices on locators, waiting, error handling, tracing.

The script must:
- Launch visible browser with video recording + `slowMo: 50`
- Dismiss cookie banners/overlays first
- Execute each action and verify it succeeded
- Recover from errors in the recording (show mistake + fix) — load [./rules/validation.md](./rules/validation.md)
- Track coordinates + timestamps for each action
- Convert webm → mp4 via FFmpeg
- Save video + tracked actions JSON

For action types and manifest format, load [./rules/actions.md](./rules/actions.md).

### 9. Record and verify

Run the script. If it fails, fix and re-run. Then ask the user to validate the video before uploading.

### 10. Upload to Vorec

```bash
npx @vorec/cli@latest run vorec.json --skip-record --video <VIDEO> --tracked-actions .vorec/tracked-actions.json
```

### 11. Clean up

```bash
rm -f record-tutorial.mjs save-session.mjs vorec.json
rm -rf .vorec/recordings .vorec/tracked-actions.json
```

### 12. Share the result

Share the editor URL.

## Key Rules

1. Check credits first — `vorec check`
2. Analyze validation before choosing test data
3. Use semantic locators — `getByRole`, `getByLabel`
4. Verify every action — recover from errors in the recording
5. User validates video before upload
6. Clean up temp files after
7. Never ask for passwords
8. Never hardcode URLs

## Troubleshooting

Load [./rules/troubleshooting.md](./rules/troubleshooting.md) for common errors and fixes.
