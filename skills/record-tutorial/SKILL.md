---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

You are an AI coding agent with deep knowledge of the user's codebase. Use that knowledge to record a screen session that Vorec turns into a narrated tutorial automatically.

**Your advantage:** You can read every component, route, validator, and config file. You know the app better than any screen scraper. Use that to write precise, reliable recording scripts with valid test data.

**Your role:** Analyze the codebase → write a Playwright recording script → record → upload to Vorec.
**Vorec's role:** Watch the video, write narration, generate voice-over.

**Work cleanly:** Temp files created fresh, deleted after upload. User sees only the editor URL.

## Prerequisites

**Run ALL checks. Fix before continuing.**

```bash
# 1. Playwright + Chromium
node -e "require('playwright')" 2>/dev/null && echo "Playwright OK" || npm install playwright
node -e "const pw = require('playwright'); pw.chromium.launch().then(b => { console.log('Chromium OK'); b.close() })" 2>/dev/null || npx playwright install chromium

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

### 3. Deep-scan the codebase

**This is your main advantage.** Before writing any script, thoroughly analyze the project:

**Project structure:**
- Read `package.json` — framework, dependencies, scripts, dev server port
- Read router/App file — all routes, guards, redirects
- Read `.env` or config files — API URLs, feature flags

**For the specific flow being recorded:**
- Read the page component — understand what renders, what's interactive
- Read form components — field names, types, placeholders, labels
- Read validation logic — frontend validators, regex patterns, required fields, min/max lengths
- Read API routes/handlers — what the backend accepts/rejects
- Read DB schema/models — unique constraints, enums, required columns
- Read auth guards — which routes need login, where login redirects to

**From this analysis, extract:**
- Exact selectors: `data-testid`, element IDs, names, placeholders, button text, `href` values
- Valid test data that passes ALL validation (frontend + backend + DB)
- The expected result after each action (URL change, toast, modal, redirect)
- Wait conditions (loading states, API calls, animations)
- Error states and how to recover from them

### 4. Find app URL & wait strategy

From `package.json` scripts or config, determine:
- Dev server URL and port
- Framework type → choose `waitStrategy`:
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

### 7. Write the recording script

Write a standalone Playwright `.mjs` script. Load [./rules/playwright.md](./rules/playwright.md) for locator and automation best practices.

**Use what you learned from the codebase:**
- Selectors come from reading actual component source — not guessing
- Test data comes from reading validators — not placeholder values
- Wait conditions come from reading loading states — not arbitrary timeouts
- Expected results come from reading handlers — not hoping

The script must:
- Launch `chromium` visible (`headless: false`) with video recording at 1920x1080
- Use `slowMo: 50` for smooth, visible actions
- Load `storageState` if auth is needed
- For each action: locate element → get boundingBox (coordinates) → execute → verify result
- After form submissions: check for error messages and either recover (keep recording) or stop
- Convert webm → mp4 via FFmpeg after recording
- Save tracked actions JSON with timestamps, coordinates, descriptions, and context

For action types, load [./rules/actions.md](./rules/actions.md).
For error recovery, load [./rules/validation.md](./rules/validation.md).

**Script template pattern:**
```javascript
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const viewport = { width: 1920, height: 1080 };
mkdirSync('.vorec/recordings', { recursive: true });

const browser = await chromium.launch({ headless: false, slowMo: 50 });
const context = await browser.newContext({
  viewport,
  recordVideo: { dir: '.vorec/recordings', size: viewport },
  // storageState: '.vorec/storageState.json', // if auth needed
});
const page = await context.newPage();

const startTime = Date.now();
const tracked = [];

function track(type, selector, box, description, context, extra = {}) {
  tracked.push({
    type, timestamp: (Date.now() - startTime) / 1000,
    coordinates: box ? {
      x: Math.round(((box.x + box.width / 2) / viewport.width) * 1000),
      y: Math.round(((box.y + box.height / 2) / viewport.height) * 1000),
    } : { x: 500, y: 500 },
    target: selector, interaction_type: type === 'type' ? 'type' : type,
    description, context, ...extra,
  });
}

// Navigate
await page.goto('<URL>', { waitUntil: '<WAIT_STRATEGY>' });
await page.waitForTimeout(2000);

// === ACTIONS (from codebase analysis) ===
// For each action:
//   1. Find element using selector from source code
//   2. Get boundingBox for coordinate tracking
//   3. Execute the action
//   4. Verify success (check for errors, URL changes, new elements)
//   5. Wait for UI to settle

// ... your actions here ...

// === FINISH ===
await page.waitForTimeout(2000);
const video = page.video();
await page.close();
await context.close();
await browser.close();

const webmPath = await video.path();
const mp4Path = webmPath.replace(/\.webm$/, '.mp4');
execSync(`ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${mp4Path}"`, { stdio: 'pipe' });

writeFileSync('.vorec/tracked-actions.json', JSON.stringify(tracked, null, 2));
console.log(`Video: ${mp4Path}`);
console.log(`Actions: ${tracked.length} tracked`);
```

### 8. Record and verify
Run the script. If it fails, fix and re-run. Ask user to validate the video.

### 9. Upload to Vorec
```bash
npx @vorec/cli@latest run vorec.json --skip-record --video <VIDEO> --tracked-actions .vorec/tracked-actions.json
```

### 10. Clean up
```bash
rm -f record-tutorial.mjs save-session.mjs vorec.json
rm -rf .vorec/recordings .vorec/tracked-actions.json
```

### 11. Share the editor URL

## Key Rules

1. **Read the codebase first** — selectors, test data, and expectations all come from source code
2. Check credits — `vorec check`
3. Use semantic locators from code — `getByRole`, `getByLabel`, actual `data-testid` values
4. Generate valid test data from validators — not placeholder values
5. Verify every action — check for errors using knowledge of error states from the code
6. Recover from errors in the recording when they teach the viewer something
7. User validates video before upload
8. Clean up all temp files
9. Never ask for passwords — use `vorec login` for API key, `storageState` for app auth
10. Never hardcode URLs — read from project config

## Reference Files

- [./rules/playwright.md](./rules/playwright.md) — Locators, waiting, error capture, tracing
- [./rules/validation.md](./rules/validation.md) — Test data analysis, error recovery
- [./rules/auth.md](./rules/auth.md) — Session capture
- [./rules/actions.md](./rules/actions.md) — Vorec action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors
