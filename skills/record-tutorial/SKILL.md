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

## 🎯 FIRST: Load agent-behavior rules

Before anything else, load [./rules/agent-behavior.md](./rules/agent-behavior.md). It's short and teaches you:
- Act first, ask later
- Never batch 3+ questions
- Prefer sensible defaults
- Default to headed mode when the user needs to interact
- Fix silently, retry without reporting small failures
- End with a link/path, not an essay

**These rules override everything else.** If a step below tells you to ask a question, first check agent-behavior.md to see if you can answer it with a default.

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

**4. Vorec API key — REQUIRED before anything else:**
```bash
cat ~/.vorec/config.json 2>/dev/null
```
If no API key is configured, ask the user:

> **I need your Vorec API key to continue.**
> Go to [vorec.ai/settings](https://vorec.ai/settings) → API Keys → Create Key → copy it and paste it here.

Once the user provides the key, save it:
```bash
npx @vorec/cli@latest init
```
Then enter the key when prompted.

**���️ DO NOT proceed with ANY recording steps until you have a valid API key.** No key = no upload = wasted recording. Check credits to verify:
```bash
npx @vorec/cli@latest check
```
If `check` fails → the key is invalid. Ask the user again. Do not continue.

## Workflow

### 1. Verify API key + credits
```bash
npx @vorec/cli@latest check
```
If this fails, stop and ask for a valid API key. Do not proceed.

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
> 2. **Narration style?** (default: Tutorial) — see [./rules/narration-styles.md](./rules/narration-styles.md)
> 3. **Visible cursors?** (default: No)
>    - **No** — record with the browser's own cursor; Vorec adds cursor effects in post-production
>    - **Yes** — Vorec's cursor pack is used (big animated arrow/pointer/text with click shrink feedback)

Load [./rules/narration-styles.md](./rules/narration-styles.md) to help the user pick a style. If they don't care, use `tutorial`.

### 7. Write the recording script

Load [./rules/hero-script.md](./rules/hero-script.md) for the canonical template with:
- 4K quality via CDP frame capture → FFmpeg (lossless PNG frames, 8 Mbit/s H.264)
- `scrollToElement`, `glideMove`, `glideClick`, `slowType`, `hoverTour` helpers
- Action tracking with coordinates, context, and primary markers
- Direct MP4 output (no WebM conversion needed)

The hero script is a **standalone Node.js file** (`hero-script.mjs`) — not a `playwright-cli run-code` function. This gives access to `child_process` for FFmpeg piping.

If **visible cursors = Yes**, also load [./rules/cursor-pack.md](./rules/cursor-pack.md) — the hero script gets an extra cursor-injection block that embeds Vorec's bundled SVG cursors as base64 data URLs.

For **Explore mode** page discovery (before writing the hero script), use `playwright-cli`:
- [./rules/cli-commands.md](./rules/cli-commands.md) — `open`, `click`, `snapshot`, `resize`, etc.
- [./rules/cli-session.md](./rules/cli-session.md) — `close-all`, session management

For action types (click, type, narrate, etc.): [./rules/actions.md](./rules/actions.md)
For error recovery during recording: [./rules/validation.md](./rules/validation.md)

### 8. Record and verify

```bash
mkdir -p .vorec recordings
node hero-script.mjs
```

The script outputs:
- `./recordings/output.mp4` — 4K H.264 video
- `.vorec/tracked-actions.json` — action data for Vorec

Optionally trim dead time (see [./rules/hero-script.md](./rules/hero-script.md)).

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

1. **Act first, ask later** — if a step requires a blocking action, do the action and announce it in ONE sentence. Don't ask permission. See [./rules/agent-behavior.md](./rules/agent-behavior.md)
2. **Never batch 3+ questions** — max 2 questions at a time, prefer defaults
3. **Always use `--headed`** for `playwright-cli open` when the user needs to see/interact with the browser (login, validation, session capture). Default is headless.
4. **Re-check state first** — before asking the user to log in or re-do anything, check if an existing session / file / state already covers it
5. **Fix silently, retry** — for known issues (headless instead of headed, leftover cart items, stale session), fix and retry without bothering the user
6. **Always pick a mode first** (Connected or Explore) — don't skip Step 0
7. Check credits — `vorec check`
8. **Use `playwright-cli` for exploration** (snapshots, clicking, discovering elements) — but **use the standalone hero script (`node hero-script.mjs`) for recording** (needs `child_process` for FFmpeg piping)
9. **4K quality by default** — viewport 1920×1080 + DPR 2 + CDP PNG frames → FFmpeg at 8 Mbit/s
10. **Open the target URL directly** via `playwright-cli open <url>` — never `about:blank` (avoids white start frame)
11. **Use semantic locators** — `getByRole`, `getByLabel`, `getByPlaceholder`, exact matches when needed
12. **Only valid action types** in `track()` calls — `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`
13. **Render flush before stop** — `requestAnimationFrame × 2` + 500ms wait before stopping CDP capture to avoid glitched last frame
14. **Always offer Vorec narration** after recording
15. User validates video before upload
16. Clean up temp files (keep video if user declined upload)
17. **API key first** — do NOT start recording without a valid API key. Ask user to get one from vorec.ai/settings → API Keys. Use `vorec init` to save it, `vorec check` to verify.
18. Never ask for passwords — use `storageState` for app auth
18. Never hardcode URLs — read from project config
19. **End with a link** — the final message contains ONE actionable result (editor URL or file path), not a summary essay

## Reference Files

### Agent behavior (load this FIRST)
- [./rules/agent-behavior.md](./rules/agent-behavior.md) — Act first, ask later, prefer defaults, fix silently

### Workflow rules
- [./rules/connected.md](./rules/connected.md) — Connected mode (codebase-driven)
- [./rules/explore.md](./rules/explore.md) — Explore mode (page-driven)
- [./rules/hero-script.md](./rules/hero-script.md) — Canonical recording template + action types
- [./rules/narration-styles.md](./rules/narration-styles.md) — All 8 narration styles with examples
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
