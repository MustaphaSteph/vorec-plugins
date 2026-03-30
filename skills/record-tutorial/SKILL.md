---
name: record-tutorial
description: >
  Record narrated tutorial videos from any codebase using the Vorec CLI and Playwright.
  Use this skill whenever the user wants to create a tutorial video, demo video, screen recording
  with narration, product walkthrough, or onboarding video. Triggers on: "record tutorial",
  "create tutorial", "demo video", "screen recording", "narrate this flow", "vorec record",
  "make a walkthrough", "record a demo", "tutorial video", "product demo", "show how to",
  "record this feature", "create a screencast". Also use when the user asks to document a UI
  flow visually or wants to turn a feature into a video explanation — even if they don't
  explicitly say "tutorial" or "video".
---

# Record Tutorial with Vorec

You are an AI coding agent with deep knowledge of the codebase. Your job is to record a screen session and submit it to Vorec, which turns it into a narrated tutorial automatically.

## How It Works

1. You record the screen using Playwright while executing actions
2. You upload the recording + tracked actions to Vorec
3. Vorec generates narration, visual cues, and voice-over automatically
4. The user gets an editor URL to preview and fine-tune

**Your role:** Record the video and track what happens.
**Vorec's role:** Turn it into a narrated tutorial.

## Before You Start

```bash
# 1. Playwright (required for screen recording)
npm install playwright && npx playwright install chromium

# 2. FFmpeg (required for video conversion)
ffmpeg -version || echo "Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"

# 3. Vorec CLI
npx @vorec/cli@latest --version

# 4. API key — check if configured
cat ~/.vorec/config.json 2>/dev/null || echo "Not configured"
# If not configured: create key at Settings → API Keys in vorec.ai, then:
npx @vorec/cli@latest init
# IMPORTANT: Always use `vorec init` to set the API key.
# NEVER write ~/.vorec/config.json directly — the CLI sets the correct API URL automatically.
```

Also check what port the dev server runs on. Look for it in `package.json` scripts, `vite.config`, `.env`, or framework config. Verify it's running before proceeding.

## Step-by-Step

### 1. Understand What to Record

Ask the user or infer from context what flow to demonstrate. Then ask:

**"Is there anything specific I should pay attention to during the recording?"**

Examples of what the user might say:
- "Focus on the loading states between steps"
- "Make sure the animation after submit is visible"
- "The dropdown takes a moment to load, wait for it"
- "Show the error state when the field is empty"

Use their answer to add appropriate `wait` actions, adjust delays, and set the `customPrompt` field so Vorec's narration covers what matters to the user.

### 2. Determine the App URL & Wait Strategy

Find the dev server URL from project config — never assume ports. Check:
- `package.json` scripts (e.g., `"dev": "vite --port 5173"`)
- `vite.config.ts`, `next.config.js`, `.env` files
- Framework defaults (Vite: 5173, Next.js: 3000, CRA: 3000)

Also choose the right `waitStrategy` for the manifest by reading the app's code:

| Strategy | Use when |
|----------|----------|
| `load` | Default. Works for most apps. Waits for page + resources. |
| `domcontentloaded` | SPAs that hydrate client-side (React, Vue, Next.js). Faster. |
| `networkidle` | Simple static sites with no background requests. |
| `commit` | Extremely slow apps where you just need the page to start loading. |

Check for: WebSockets, SSE, analytics scripts, polling, service workers — if the app has any of these, **do not use `networkidle`** (it will hang).

### 3. Research the Codebase for Selectors

**Never guess selectors.** Always verify they exist in source code.

Search strategy:
- **Routes**: Grep router/App file for route definitions
- **Buttons/Links**: Read page components for button text, classes, `data-testid`, `href`
- **Inputs**: Look for `id`, `name`, or `placeholder` attributes
- **Modals/Dropdowns**: Check for conditional renders, `role` attributes

Selector priority (most reliable first):
1. `data-testid="create-btn"`
2. `button:has-text('Save')`
3. `a[href='/settings']`
4. `#email-input` or `input[name="email"]`
5. `.btn-primary` (less stable but OK if specific)

### 4. Handle Authentication

Check if the target URL requires authentication — look for auth guards, login redirects, or protected routes in the codebase.

**If the app requires login:**

1. Read the router/auth guard to find:
   - The login page route
   - The post-login redirect route

2. Tell the user: "This app requires login. I'll open a browser to the login page — please log in manually. The session will be saved automatically once you're redirected."

3. Write and run a small script to capture the session:

```javascript
// save-session.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('<LOGIN_URL_FROM_ROUTER>');
console.log('Please log in manually in the browser...');
await page.waitForURL('**/<POST_LOGIN_ROUTE_FROM_ROUTER>**', { timeout: 120000 });
await context.storageState({ path: '.vorec/storageState.json' });
console.log('Session saved to .vorec/storageState.json');
await browser.close();
```

Replace placeholders with actual routes from the codebase.

**Key rule:** Never ask the user for their password. Always let them type it in the browser themselves.

**If no auth needed:** Omit `storageState` entirely.

### 5. Ask the User About Preferences

**You must ask these questions before writing the manifest. Present them together in one message:**

> Before I create the recording, a few quick questions:
> 1. **What language** should the narration be in? (default: English)
> 2. **What narration style** do you prefer?
>    - **Tutorial** — step-by-step, clear, like a YouTube tutorial
>    - **Professional** — polished, enterprise-ready
>    - **Conversational** — casual, like explaining to a colleague
>    - **Storytelling** — engaging, narrative-driven
>    - **Concise** — minimal, just the essentials
>    - **Exact** — neutral, factual, technical

Wait for the user to respond before proceeding. If they say "just go with defaults", use English + tutorial.

Set `videoContext` to a brief description of the flow (you write this yourself based on your codebase understanding). Set `customPrompt` to what the user said they want to pay attention to (from Step 1).

### 6. Write the Manifest

Create `vorec.json` with the actions and preferences.

```json
{
  "title": "How to [description of the flow]",
  "url": "<APP_URL_WITH_PORT>/<starting-route>",
  "viewport": { "width": 1920, "height": 1080 },
  "storageState": ".vorec/storageState.json",
  "language": "en",
  "narrationStyle": "tutorial",
  "videoContext": "Brief description of what the video shows",
  "actions": [
    { "type": "click", "selector": "<real-selector>", "description": "Open the create dialog" },
    { "type": "wait", "delay": 1000 },
    { "type": "type", "selector": "<real-input-selector>", "text": "My First Project", "description": "Enter the project name" },
    { "type": "select", "selector": "<real-select-selector>", "value": "public", "description": "Set visibility to public" },
    { "type": "click", "selector": "<real-submit-selector>", "description": "Save the new project" }
  ]
}
```

Replace all `<placeholders>` with real values. Omit `storageState` if no auth. Omit `language` if English.

### 7. Record the Video

First, record **without** uploading — so the user can validate:

```bash
npx @vorec/cli@latest run vorec.json
```

This records the video and saves it locally. **Do NOT use `--auto` yet.**

After recording completes, tell the user:

> Recording saved to `.vorec/recordings/[file].mp4` ([duration]s, [action count] actions tracked).
> Please review the video — if it looks good, I'll upload it to Vorec for narration. A bad recording will cost credits to re-do.
> Should I proceed?

**Wait for the user to confirm.** If they say redo, adjust the manifest and record again.

### 8. Upload and Process

Once the user confirms the recording is good:

```bash
npx @vorec/cli@latest run vorec.json --auto --skip-record --video .vorec/recordings/[file].mp4 --tracked-actions .vorec/tracked-actions.json
```

This uploads the validated recording and processes it. When done, it prints an editor URL.

### 9. Share the Result

Share the editor URL with the user. They can preview narration and generate audio in the editor.

## Action Reference

Every action **must include a `description`** — a clear, human-readable name describing what the action accomplishes.

**Good descriptions:** "Open the create dialog", "Enter the project name", "Save the new task"
**Bad descriptions:** "button:has-text('Create')", "input[type='email']", "click #submit-btn"

The description is NOT the selector — it's the intent. Vorec uses it to write narration, so it must read naturally. Think of it as what a human would say: "Now we click Save" not "Now we click button.submit".

| Type | Required Fields | What It Does |
|------|----------------|--------------|
| `click` | `selector`, `description` | Click an element |
| `type` | `selector`, `text`, `description` | Click an input, then type text. Include what was typed — Vorec needs this context. |
| `select` | `selector`, `value`, `description` | Pick from a dropdown. Include the selected value. |
| `hover` | `selector`, `description` | Hover (tooltips, menus) |
| `scroll` | `description` | Scroll the page down |
| `wait` | `delay` (ms) | Pause for animations/loading (no description needed) |
| `navigate` | `text` (URL), `description` | Go to a different page |

Optional on any action: `delay` (ms) — extra wait time after the action completes.

**Important:** Document ALL actions, not just clicks. If the user types text, include the `type` action with `text`. If they select a dropdown value, include `select` with `value`. Vorec uses this to understand the full workflow — clicks alone aren't enough.

## Alternative Commands

```bash
# Skip recording, use existing video + tracked actions
npx @vorec/cli@latest run vorec.json --skip-record --video recording.mp4 --tracked-actions tracked.json

# Just upload a video without actions
npx @vorec/cli@latest upload my-recording.mp4 --title "My Tutorial"

# Check processing status
npx @vorec/cli@latest status
```

## Playwright Best Practices

When writing the recording script, use these techniques for reliable automation:

### Use semantic locators — NOT CSS selectors

```javascript
// BEST: role-based (survives refactors, accessible)
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter password')
page.getByText('Sign up')
page.getByTestId('submit-btn')

// OK: CSS selectors (use when semantic not possible)
page.locator('button[type="submit"]')

// AVOID: fragile selectors
page.locator('.btn-primary')           // class can change
page.locator('#submit')                // id can change
page.locator('div > form > button')    // structure can change
```

### Chain and filter for precision

```javascript
// Find button inside a specific row
page.getByRole('row').filter({ hasText: 'My Project' }).getByRole('button', { name: 'Edit' })

// Find nth element
page.getByRole('listitem').nth(2)
```

### Wait for API responses, not just DOM

```javascript
// Wait for the API call to complete after clicking
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/projects') && resp.status() === 200),
  page.getByRole('button', { name: 'Save' }).click(),
]);
```

### Wait for loading states to clear

```javascript
// Wait for spinners/skeletons to disappear before interacting
await page.locator('.skeleton, .loading, [aria-busy="true"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
```

### Scroll elements into view

```javascript
const element = page.getByRole('button', { name: 'Submit' });
await element.scrollIntoViewIfNeeded();
await element.click();
```

### Handle cookie banners and overlays

```javascript
// Dismiss cookie/consent banners before recording
const cookieBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"]');
if (await cookieBanner.count() > 0) {
  const acceptBtn = cookieBanner.getByRole('button', { name: /accept|agree|ok|got it/i });
  if (await acceptBtn.count() > 0) await acceptBtn.first().click();
}
```

### Handle new tabs/popups

```javascript
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.getByText('Open in new tab').click(),
]);
await newPage.waitForLoadState();
// Record actions on newPage...
```

### Handle iframes

```javascript
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: 'Submit' }).click();
```

### Handle file uploads

```javascript
await page.getByLabel('Upload file').setInputFiles('path/to/file.pdf');
```

### Use slowMo for visible actions

```javascript
// Makes typing and clicks visible in the recording
const browser = await chromium.launch({ headless: false, slowMo: 50 });
```

### Capture JS errors during recording

```javascript
const jsErrors = [];
page.on('pageerror', error => jsErrors.push(error.message));
page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
// After recording, report any JS errors
if (jsErrors.length > 0) console.warn('JS errors during recording:', jsErrors);
```

### Enable tracing for debugging failed recordings

```javascript
await context.tracing.start({ screenshots: true, snapshots: true });
// ... run actions ...
// If something fails:
await context.tracing.stop({ path: '.vorec/trace.zip' });
// Debug with: npx playwright show-trace .vorec/trace.zip
```

### Retry flaky interactions

```javascript
// If an element is briefly obscured by animations
for (let i = 0; i < 3; i++) {
  try { await element.click({ timeout: 5000 }); break; }
  catch { await page.waitForTimeout(1000 * (i + 1)); }
}
```

### Auto-detect dev servers

```javascript
// Check common ports before hardcoding
import { exec } from 'node:child_process';
const ports = [3000, 3001, 4200, 5173, 8080];
// lsof -i :PORT to find which one is running
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| Validation failed | Read validation code, fix test data |
| Selector timeout | Use semantic locators (`getByRole`, `getByLabel`), add `scrollIntoViewIfNeeded()` |
| Submission error | Check API/backend validation rules |
| Page hangs on load | Change `waitStrategy` — avoid `networkidle` for SPAs with WebSockets |
| Cookie banner blocks clicks | Dismiss it at the start of recording |
| Element obscured | Wait for overlays to disappear, use `force: true` as last resort |
| JS errors in console | Check `page.on('pageerror')` output, may indicate app bugs |
| Project limit | Delete projects or upgrade plan |
| Insufficient credits | Buy credits or wait for monthly reset |
| Recording too short | Min 10 seconds. Add delays. |
