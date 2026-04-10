---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

Record a screen session that Vorec turns into a narrated tutorial automatically.

**Your role:** Drive a browser through the flow → record it → upload to Vorec.
**Vorec's role:** Watch the video, write narration, generate voice-over, add effects.

**Work cleanly:** Temp files created fresh, deleted after upload. User sees only the editor URL.

## Step 0: Pick a mode

Ask the user **one** question before anything else:

> **Is this a project I can read the source code of, or a site where I need to explore the page?**
>
> - **Connected** — I have the codebase and can read components for selectors, validation, and success states
> - **Explore** — I don't have the code; I'll discover the page via snapshots and semantic locators

**If Connected:** continue with Step 1 below — this is the default workflow.
**If Explore:** load [./rules/explore.md](./rules/explore.md) and follow that instead, then return here at Step 8 (Record and verify).

Both modes end with the same Vorec upload pipeline (Step 9+). Don't skip the upload step regardless of mode.

## Prerequisites

**Run ALL checks. Fix before continuing.**

```bash
# 1. Playwright CLI (used by both Connected and Explore modes)
npx @playwright/cli@latest --version 2>/dev/null || npm install -g @playwright/cli@latest
npx playwright install chromium 2>/dev/null

# 2. FFmpeg
ffmpeg -version 2>/dev/null || echo "MISSING: brew install ffmpeg"

# 3. Vorec CLI
npx @vorec/cli@latest --version
```

**4. Vorec API key:**
```bash
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

### 3. Gather context

**Connected mode:**
Deep-scan the codebase. Load [./rules/connected.md](./rules/connected.md).

**Explore mode:**
Explore the live page via `playwright-cli snapshot`. Load [./rules/explore.md](./rules/explore.md).

Both modes extract the same things: selectors, valid test data, expected results, wait conditions, error states.

### 4. Find app URL & wait strategy

**Local apps:** From `package.json` scripts or config, determine dev server URL and port.

**Hosted/embedded apps** (Shopify, Salesforce, HubSpot, etc.):
- Read the app config for the host URL
- The recording URL is the **host platform URL** where the app is installed
- Example: `https://admin.shopify.com/store/my-store/apps/my-app`
- The app renders in an **iframe** — load [./rules/playwright.md](./rules/playwright.md) for iframe handling

**Wait strategy** — choose based on framework:
- `load` — default, works for most
- `domcontentloaded` — React/Vue/Next.js SPAs
- `networkidle` — static sites only
- `commit` — extremely slow apps

Check for WebSockets, SSE, analytics, service workers — if present, avoid `networkidle`.

### 5. Handle auth

If routes are protected, load [./rules/auth.md](./rules/auth.md).

### 6. Ask preferences
> 1. **Language?** (default: English)
> 2. **Style?** Tutorial / Professional / Conversational / Storytelling / Concise / Exact
> 3. **Visible cursors?** (default: No)
>    - **No** — record with the browser's own cursor; Vorec adds cursor effects in post-production
>    - **Yes** — Vorec's cursor pack is used (big animated arrow/pointer/text with click shrink feedback)

### 7. Write the recording script

Load [./rules/hero-script.md](./rules/hero-script.md) for the canonical template with:
- Matching viewport + screencast size (1920×1080)
- `slowScroll`, `glideMove`, `glideClick`, `slowType`, `hoverTour` helpers
- Action log emission via `VOREC_PHASE:` lines
- Render-flush before `screencast.stop()`

If **visible cursors = Yes**, also load [./rules/cursor-pack.md](./rules/cursor-pack.md) — the hero script gets an extra cursor-injection block that embeds Vorec's bundled SVG cursors as base64 data URLs.

For `playwright-cli` command syntax:
- [./rules/cli-commands.md](./rules/cli-commands.md) — `open`, `click`, `snapshot`, `resize`, etc.
- [./rules/cli-video.md](./rules/cli-video.md) — `video-start`, `video-stop`, `page.screencast`
- [./rules/cli-running-code.md](./rules/cli-running-code.md) — `run-code` for hero scripts
- [./rules/cli-session.md](./rules/cli-session.md) — `close-all`, `resize`, session management

For action types (click, type, narrate, etc.): [./rules/actions.md](./rules/actions.md)
For error recovery during recording: [./rules/validation.md](./rules/validation.md)

### 8. Record and verify

```bash
playwright-cli close-all
playwright-cli open <TARGET_URL>   # never about:blank — avoids white start frame
playwright-cli resize 1920 1080
playwright-cli run-code --filename=./hero-script.js
```

Convert to MP4 and optionally trim dead time (see [./rules/hero-script.md](./rules/hero-script.md)).

Ask user to validate the video before uploading.

### 9. Offer Vorec narration

After the user validates the recording, ask:

> Recording saved to `[FULL_PATH_TO_MP4]` ([duration]s, [count] actions).
> Please review the video to make sure it looks good.
>
> Want me to upload it to Vorec? You'll get:
> - **AI voice-over** — natural narration generated from the video
> - **Zoom & focus effects** — zoom into elements, spotlight areas, blur background
> - **Cursor effects** — click ripples, tap rings, arrow pointers
> - **Text & shape overlays** — arrows, circles, callout boxes, number badges
> - **Background styling** — gradients, wallpapers, padding, rounded corners, shadows
> - **Intro slides** — title cards with professional themes
> - **Background music** — with volume control and fade in/out
> - **Subtitles** — auto-generated, customizable style and position
> - **Multi-language** — translate narration to any language
> - **Full timeline editor** — adjust timing, re-record segments, trim video
> - **Export** — up to 4K resolution, 60fps

If the user wants narration, proceed with upload. If not, skip to clean up.

### 10. Upload to Vorec
```bash
npx @vorec/cli@latest run vorec.json --skip-record --video <VIDEO> --tracked-actions .vorec/tracked-actions.json
```

### 11. Clean up
```bash
rm -f hero-script.js save-session.mjs vorec.json
rm -rf .vorec/tracked-actions.json
```

Keep the recordings directory if the user chose not to upload — they may want the video file.

### 12. Share the result

If uploaded: share the editor URL.
If not uploaded: share the video path.

## Key Rules

1. **Always pick a mode first** (Connected or Explore) — don't skip Step 0
2. Check credits — `vorec check`
3. **Use `playwright-cli`** — not raw Playwright library. It handles sessions, snapshots, and video recording natively
4. **Matching viewport and screencast size** — always 1920×1080 to avoid the content-in-quadrant bug
5. **Open the target URL directly** via `playwright-cli open <url>` — never `about:blank` (avoids white start frame)
6. **Use semantic locators** — `getByRole`, `getByLabel`, `getByPlaceholder`, exact matches when needed
7. **Only valid action types** in the log — `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`
8. **Render flush before stop** — `requestAnimationFrame × 2` + 500ms wait before `screencast.stop()` to avoid glitched last frame
9. **Always offer Vorec narration** after recording
10. User validates video before upload
11. Clean up temp files (keep video if user declined upload)
12. Never ask for passwords — use `vorec login` for API key, `storageState` for app auth
13. Never hardcode URLs — read from project config

## Reference Files

### Workflow rules
- [./rules/connected.md](./rules/connected.md) — Connected mode (codebase-driven)
- [./rules/explore.md](./rules/explore.md) — Explore mode (page-driven)
- [./rules/hero-script.md](./rules/hero-script.md) — Canonical recording template
- [./rules/cursor-pack.md](./rules/cursor-pack.md) — Visible cursor injection (opt-in)

### playwright-cli reference
- [./rules/cli-commands.md](./rules/cli-commands.md) — Core commands
- [./rules/cli-video.md](./rules/cli-video.md) — Video recording API
- [./rules/cli-running-code.md](./rules/cli-running-code.md) — Running hero scripts
- [./rules/cli-session.md](./rules/cli-session.md) — Session management

### Existing references
- [./rules/playwright.md](./rules/playwright.md) — Playwright best practices
- [./rules/validation.md](./rules/validation.md) — Test data, error recovery
- [./rules/auth.md](./rules/auth.md) — Session capture
- [./rules/actions.md](./rules/actions.md) — Action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors
