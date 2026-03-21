---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
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

Ask the user or infer from context what flow to demonstrate. Then ask these questions:

> Before I start, a few quick questions:
> 1. **What's the goal?** What should the viewer be able to do after watching? (e.g., "Create their first project")
> 2. **Who's watching?** New users, developers, or existing customers?
> 3. **Any pages or sections to explain?** Should I pause on certain screens to describe the layout before interacting? (e.g., "Explain the dashboard before clicking anything", "Show what the settings page looks like")

Use their answers to:
- Add `narrate` actions before key interactions to describe what's on screen
- Add `hover` actions to point at UI elements while narrating
- Write rich `context` on each action (tailored to the audience)
- Add `wait` actions for animations or loading states
- Set `customPrompt` and `videoContext` for Vorec

### 2. Determine the App URL

Find the dev server URL from the project config — don't hardcode assumptions. Check:
- `package.json` scripts (e.g., `"dev": "vite --port 5173"`)
- `vite.config.ts`, `next.config.js`, `.env` files
- Framework defaults (Vite: 5173, Next.js: 3000, CRA: 3000)

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
    {
      "type": "click",
      "selector": "<real-selector>",
      "description": "Open the create dialog",
      "context": "Clicks the 'New Project' button in the top-right of the dashboard. A modal appears with a form for project name and visibility settings."
    },
    { "type": "wait", "delay": 1000 },
    {
      "type": "type",
      "selector": "<real-input-selector>",
      "text": "My First Project",
      "description": "Enter the project name",
      "context": "Types 'My First Project' into the title field. This is the only required field — the modal also has an optional description textarea below."
    },
    {
      "type": "click",
      "selector": "<real-submit-selector>",
      "description": "Save the new project",
      "context": "Clicks the blue 'Create' button at the bottom of the modal. After saving, the modal closes and the new project appears at the top of the project list."
    }
  ]
}
```

Replace all `<placeholders>` with real values. Omit `storageState` if no auth. Omit `language` if English.

### 7. Record and Upload

Record the video and upload it (without spending credits yet):

```bash
npx @vorec/cli@latest run vorec.json
```

This records the screen, uploads the video, and saves the project. **It does NOT start analysis yet.**

After it completes, tell the user:

> Recording uploaded. The video is at `.vorec/recordings/[file].mp4` ([duration]s, [action count] actions tracked).
> Please review it in the editor. If it looks good, I'll start the narration process (costs 10 credits).
> Should I proceed?

**Wait for the user to confirm.** If they say redo, adjust the manifest and run again.

### 8. Start Analysis

Once the user confirms:

```bash
npx @vorec/cli@latest run vorec.json --auto --skip-record
```

This resumes the existing project (does NOT create a new one) and runs the analysis + narration steps. When done, it prints the editor URL.

### 9. Share the Result

Share the editor URL with the user. They can preview narration and generate audio in the editor.

## Action Reference

Every action **must include a `description`** — a clear, human-readable name describing what the action accomplishes.

**Good descriptions:** "Open the create dialog", "Enter the project name", "Save the new task"
**Bad descriptions:** "button:has-text('Create')", "input[type='email']", "click #submit-btn"

The description is NOT the selector — it's the intent. Think: "Save the project" not "button.submit".

Every action should also include a **`context`** field — a rich sentence or two explaining what's happening on screen, what the user just did, and what changes after this action. This is what Vorec uses to write intelligent narration.

**Good context:** "Clicks the blue 'Create' button. A success toast appears and the new project shows at the top of the list."
**Bad context:** "Clicks submit" (too vague — Vorec can't write good narration from this)

Write context as if you're describing the screen to someone who can't see it. Include:
- What the UI looks like at this moment
- What text was typed or what option was selected
- What visually changes after the action (modal opens, page navigates, toast appears)

| Type | Required Fields | What It Does |
|------|----------------|--------------|
| `narrate` | `description`, `context`, `delay` | Pause and describe what's on screen — no interaction. Use before key actions to set the scene. |
| `click` | `selector`, `description` | Click an element |
| `type` | `selector`, `text`, `description` | Click an input, then type text. Include what was typed. |
| `select` | `selector`, `value`, `description` | Pick from a dropdown. Include the selected value. |
| `hover` | `selector`, `description` | Hover to draw attention to an element (tooltips, menus, highlights) |
| `scroll` | `description` | Scroll the page down |
| `wait` | `delay` (ms) | Pause for animations/loading (no description needed) |
| `navigate` | `text` (URL), `description` | Go to a different page |

Optional on any action: `delay` (ms) — extra wait time after the action completes.

**Important:** Document ALL actions, not just clicks. If the user types text, include the `type` action with `text`. If they select a dropdown value, include `select` with `value`. Vorec uses this to understand the full workflow — clicks alone aren't enough.

### When to use `narrate` and `hover`

Add `narrate` actions when the user lands on a new page or screen that needs explanation before interacting:

```json
{ "type": "narrate", "delay": 4000, "description": "Dashboard overview", "context": "The dashboard shows a grid of project cards. Each card has a thumbnail, title, and status badge. The sidebar has Library, Recent, and Settings links." }
```

Add `hover` actions to draw attention to specific elements while narrating:

```json
{ "type": "hover", "selector": ".sidebar .settings-link", "description": "Point to Settings", "context": "Hovers over the Settings link in the sidebar to show where account preferences are managed.", "delay": 2000 }
```

Use this pattern: **narrate** (describe the page) → **hover** (point at key elements) → **click** (interact). This gives Vorec enough context to write a tutorial that explains the UI, not just the clicks.

## Alternative Commands

```bash
# Skip recording, use existing video + tracked actions
npx @vorec/cli@latest run vorec.json --skip-record --video recording.mp4 --tracked-actions tracked.json

# Just upload a video without actions
npx @vorec/cli@latest upload my-recording.mp4 --title "My Tutorial"

# Check processing status
npx @vorec/cli@latest status
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Playwright required" | `npm install playwright && npx playwright install chromium` |
| "FFmpeg required" | `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux) |
| "No API key" | `npx @vorec/cli@latest init` — get key from vorec.ai Settings |
| Selector timeout | Add a `wait` action before, or verify selector in source |
| 401 error | API key revoked — create a new one |
| Recording too short | Minimum 10 seconds. Add more actions or increase delays. |
