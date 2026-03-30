---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

Record a screen session and submit it to Vorec, which generates narrated tutorial videos automatically.

**Your role:** Record the video, track actions, verify everything works.
**Vorec's role:** Turn it into a narrated tutorial with AI voice-over.

**Work cleanly:** All temp files created fresh, deleted after upload. User sees only the editor URL.

## Before You Start

**Run ALL checks. Do not skip any. Fix before continuing.**

```bash
# 1. Playwright CLI — the main automation tool
npm list @playwright/cli 2>/dev/null || npm install @playwright/cli
npx playwright-cli --version

# 2. Chromium browser
npx playwright-cli open --headless about:blank && npx playwright-cli close || npx playwright install chromium

# 3. FFmpeg (video conversion)
ffmpeg -version 2>/dev/null || echo "MISSING: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"

# 4. Vorec CLI
npx @vorec/cli@latest --version
```

**5. Vorec API key:**

```bash
cat ~/.vorec/config.json 2>/dev/null
```

If not configured, run `vorec login` — opens browser, user logs in, CLI gets key automatically:

```bash
npx @vorec/cli@latest login
```

**Never tell the user to manually copy an API key. Always use `vorec login`.**

## Workflow

### 1. Check credits

```bash
npx @vorec/cli@latest check
```

If it fails, tell the user and stop.

### 2. Understand the flow

Ask:
1. What's the goal?
2. Who's watching?
3. Anything to explain?

### 3. Analyze validation & test data

Load [./rules/validation.md](./rules/validation.md) — read frontend + backend code for valid test data.

### 4. Explore the page with playwright-cli

Use `playwright-cli` to explore the app and find elements before recording:

```bash
# Open the app in a visible browser
npx playwright-cli open <APP_URL> --headed

# Take a snapshot — shows all elements with refs (e1, e5, e15...)
npx playwright-cli snapshot

# Test interactions before recording
npx playwright-cli click e5
npx playwright-cli fill e8 "test@example.com"
npx playwright-cli snapshot  # verify what happened
```

The snapshot gives you a YAML tree of the page with element refs. Use these refs to interact — **much more reliable than CSS selectors** for any website.

For advanced playwright-cli techniques, load [./rules/playwright-cli.md](./rules/playwright-cli.md).

### 5. Handle auth

If the app requires login:

```bash
npx playwright-cli open <LOGIN_URL> --headed --persistent
# Tell user to log in manually in the browser
# Then save the session:
npx playwright-cli state-save .vorec/auth.json
npx playwright-cli close
```

The `--persistent` flag keeps the session. Load it later with `state-load`.

For more details, load [./rules/auth.md](./rules/auth.md).

### 6. Ask preferences

> 1. **What language?** (default: English)
> 2. **What style?** Tutorial / Professional / Conversational / Storytelling / Concise / Exact

### 7. Record the tutorial

Write a recording script that uses `playwright-cli` for video + interactions, and tracks coordinates for Vorec.

Load [./rules/recording.md](./rules/recording.md) for the full recording script template.

The script:
1. Opens browser with `playwright-cli open --headed`
2. Starts video with `playwright-cli video-start`
3. Takes snapshot, interacts via refs, verifies after each action
4. Tracks coordinates using `run-code` for each element
5. Recovers from errors in the recording (show mistake + fix)
6. Stops video with `playwright-cli video-stop`
7. Converts webm → mp4 via FFmpeg
8. Saves tracked actions JSON

### 8. User validates video

Tell the user the video path and ask them to review before uploading.

### 9. Upload to Vorec

```bash
npx @vorec/cli@latest run vorec.json --skip-record --video <VIDEO> --tracked-actions .vorec/tracked-actions.json
```

With a minimal `vorec.json`:

```json
{
  "title": "<TITLE>",
  "url": "<APP_URL>",
  "waitStrategy": "<STRATEGY>",
  "language": "en",
  "narrationStyle": "tutorial",
  "videoContext": "<DESCRIPTION>"
}
```

### 10. Clean up

```bash
rm -f record-tutorial.mjs save-session.mjs vorec.json
rm -rf .vorec/recordings .vorec/tracked-actions.json
npx playwright-cli close
```

### 11. Share the result

Share the editor URL.

## Key Rules

1. Check credits first — `vorec check`
2. Use `playwright-cli snapshot` to find elements — don't guess selectors
3. Use element refs (`e5`, `e15`) for interactions — more reliable than CSS
4. Verify every action with a snapshot after
5. Recover from errors in the recording
6. User validates video before upload
7. Clean up temp files + close browser after
8. Never ask for passwords — `vorec login` for API key, `--persistent` for app auth

## Reference Files

- [./rules/playwright-cli.md](./rules/playwright-cli.md) — All playwright-cli commands and techniques
- [./rules/recording.md](./rules/recording.md) — Recording script template with coordinate tracking
- [./rules/validation.md](./rules/validation.md) — Test data analysis and error recovery
- [./rules/auth.md](./rules/auth.md) — Authentication and session management
- [./rules/actions.md](./rules/actions.md) — Vorec manifest action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors and fixes
