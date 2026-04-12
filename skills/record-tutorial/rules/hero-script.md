---
name: recording-script
description: The recording script template — captures video, tracks actions, and outputs MP4 + tracked actions JSON
---

# Recording Script

This is the **recording script** that the agent writes for each tutorial. It opens a browser, walks through the flow, records a high-quality video, and tracks every action with coordinates and context.

The script is a standalone Node.js file (`hero-script.mjs`) — run it with `node hero-script.mjs`.

## Critical rules

1. **4K quality by default** — viewport 1920×1080 + `deviceScaleFactor: 2` = 3840×2160 output. CDP frame capture with PNG → FFmpeg at 8 Mbit/s.
2. **Navigate to the target URL directly** — `page.goto(url)`. Never leave the page on `about:blank` (avoids white start frame).
3. **Render flush before stop** — `requestAnimationFrame × 2` + 500ms wait before stopping CDP capture to avoid a glitched last frame.
4. **Action tracking uses valid types only** — see table below. Never invent new types.
5. **Every action must call `track()`** — not just clicks. If the user types → `track('type', ...)`. Dropdown → `track('select', ...)`. Vorec needs the full workflow.
6. **Scroll TO the element, not past it** — use `scrollToElement(locator)` to bring the next target into view. Never blindly scroll a fixed pixel amount. Always focus on the element the user is about to interact with.
7. **The hero script is a standalone Node.js file** (`hero-script.mjs`) — NOT a `playwright-cli run-code` function. This gives access to `child_process` for FFmpeg piping.

## Action types for `track()` calls

```js
track(type, description, target, coords, { context, typed_text, selected_value })
```

| Type | When to use | Helper |
|------|-------------|--------|
| `click` | Click a button, link, tab, checkbox, toggle | `glideClick(locator, description, target, context)` |
| `type` | Type text into an input field | `slowType(locator, text, description, target, context)` |
| `select` | Pick from a dropdown/select | Manual `track()` with `{ context, selected_value }` |
| `hover` | Hover to reveal tooltip/menu | Manual `track()` with `{ context }` |
| `scroll` | Scroll to reveal content | `scrollToElement(locator, description)` — auto-tracks |
| `wait` | Pause for animation/loading | Manual `track()` with `{ context }` |
| `navigate` | Navigate to a new page/URL | Manual `track()` with `{ context }` |
| `narrate` | Describe scene — NO interaction | `hoverTour(locator, description)` or manual `track()` |

### Fields explained

| Field | What it's for | Example |
|-------|--------------|---------|
| **`description`** | Short label shown on timeline (5-10 words) | `"Click the Create Project button"` |
| **`target`** | Element identifier for Vorec click markers | `"create-btn"`, `"email-input"` |
| **`context`** | **Rich scene description for AI narration** (1-2 sentences). Describe what happens, what appears on screen, and why this step matters. | `"Clicks the blue Create Project button in the top right. A dialog appears with title and template fields."` |
| **`typed_text`** | What was typed (auto-set by `slowType`) | `"sarah.demo@gmail.com"` |
| **`selected_value`** | What was picked from dropdown | `"Monthly"` |
| **`coordinates`** | Auto-captured by helpers from `boundingBox()`. Normalized 0-1000. | `{ x: 850, y: 120 }` |
| **`primary`** | Mark as a KEY action — gets a **gold star** on the timeline. Use for the most important steps (page state changes, goal completions, zoom-worthy moments). Most flows have 2-4 primary actions. | `true` |

### Writing good `context` — this is what makes narration great

Vorec's AI uses `context` to write the voice-over script. Without it, narration is generic ("Click the button"). With it, narration explains what's happening and why.

**Bad context (or no context):**
```js
glideClick(btn, 'Click Create', 'create-btn')
// → Vorec narration: "Click the Create button."
```

**Good context:**
```js
glideClick(btn, 'Click Create Project', 'create-btn',
  'Clicks the blue Create Project button in the top-right corner. A creation dialog slides in with fields for project title and template selection.')
// → Vorec narration: "Now let's create our first project. Click the Create Project button in the top right — you'll see a dialog where we can give it a name and choose a template."
```

**Rules for context:**
1. Describe what you SEE, not just what you click
2. Say what appears AFTER the action (modal opens, page changes, data loads)
3. Mention WHY this step matters if it's not obvious
4. 1-2 sentences max — Vorec expands it into natural narration

### Marking primary actions (gold stars)

Set `primary: true` on the most important actions in the flow. These get a **gold star** on Vorec's timeline instead of a regular dot, and Vorec uses them as the main anchors for narration segments.

**When to mark as primary:**
- The action that completes a goal (submit, save, publish, confirm)
- The action that changes the page state (navigate, open modal, switch tab)
- The action you'd zoom into for a product demo
- Usually 2-4 primary actions per flow

**When NOT to mark as primary:**
- Typing into a field (the submit is more important)
- Scrolling (it's a transition, not a goal)
- Narrate pauses (no interaction happened)

```js
// Set primary after a glideClick call:
await glideClick(submitBtn, 'Submit the form', 'submit-btn',
  'Clicks Submit. The account is created and a welcome page appears.');
__actions[__actions.length - 1].primary = true;
```

## The canonical template

The hero script is a **standalone Node.js file** (not a `playwright-cli run-code` function). This gives us access to `child_process` for piping lossless CDP frames directly to FFmpeg — no 1 Mbit/s screencast bottleneck.

Run it with: `node hero-script.mjs`

```js
// hero-script.mjs — standalone Node.js recording script
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('./recordings', { recursive: true });

// ── Quality presets ──────────────────────────────────────────
// Change QUALITY to '4k', '2k', or '1080p' based on user preference.
const QUALITY = '4k';
const PRESETS = {
  '4k':    { dpr: 2, w: 3840, h: 2160, bitrate: '8M' },
  '2k':    { dpr: 1.5, w: 2880, h: 1620, bitrate: '6M' },
  '1080p': { dpr: 1, w: 1920, h: 1080, bitrate: '4M' },
};
const Q = PRESETS[QUALITY];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: Q.dpr,
});
const page = await context.newPage();
await page.goto('TARGET_URL', { waitUntil: 'domcontentloaded' });

// ── High-quality recording via CDP frames → FFmpeg ──────────
// CDP sends lossless PNG frames → piped to FFmpeg in real-time
const FPS = 30;
const cdp = await context.newCDPSession(page);
const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'animation',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-b:v', Q.bitrate,
  './recordings/output.mp4',
], { stdio: ['pipe', 'pipe', 'pipe'] });
ffmpeg.stderr.on('data', () => {}); // suppress FFmpeg logs

let recording = true;
cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
  if (!recording) return;
  ffmpeg.stdin.write(Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId });
});
await cdp.send('Page.startScreencast', {
  format: 'png', quality: 100,
  maxWidth: Q.w, maxHeight: Q.h,
  everyNthFrame: 1,
});

  // ── Action tracking (for Vorec narration) ────────────────
  // Actions are collected in a local array during recording,
  // then saved to window.__vorec_actions after screencast stops.
  // A second run-code call extracts them to a JSON file.
  // NOTE: console.log does NOT reach stdout in playwright-cli run-code,
  //       so we MUST use this window-based approach instead.
  const VP = { w: 1920, h: 1080 };
  const __actions = [];
  const T0 = Date.now();
  const track = (type, description, target, coords, extra) => {
    __actions.push({
      type, description, target,
      timestamp: +((Date.now() - T0) / 1000).toFixed(2),
      coordinates: coords || { x: 500, y: 500 },
      // context = rich scene description for AI narration (1-2 sentences)
      // typed_text = what was typed (for 'type' actions)
      // selected_value = what was picked (for 'select' actions)
      // primary = true marks this as a KEY action (gets gold star on timeline)
      ...extra,
    });
  };
  // Convert boundingBox center to Vorec's 0-1000 coordinate space
  const toCoords = (box) => box ? {
    x: Math.round(((box.x + box.width / 2) / VP.w) * 1000),
    y: Math.round(((box.y + box.height / 2) / VP.h) * 1000),
  } : { x: 500, y: 500 };

  track('narrate', 'Recording starts', 'intro');

  // ── Helpers ──────────────────────────────────────────────

  // Smooth scroll to bring a target element into view. Scrolls just enough
  // to center the element vertically — NEVER scrolls past it.
  // Use this instead of blindly scrolling a fixed pixel amount.
  const scrollToElement = async (locator, description) => {
    // First check if element is already in viewport
    const box = await locator.boundingBox();
    if (box && box.y >= 0 && box.y + box.height <= VP.h) return; // already visible

    // Scroll element to center of viewport with smooth animation
    await locator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
      const distance = targetY - window.scrollY;
      const steps = 20;
      const stepY = distance / steps;
      let i = 0;
      return new Promise(resolve => {
        const tick = () => {
          if (i++ >= steps) return resolve();
          window.scrollBy(0, stepY);
          requestAnimationFrame(tick);
        };
        tick();
      });
    });
    await page.waitForTimeout(400);
    if (description) {
      track('scroll', description, null, toCoords(await locator.boundingBox()), {
        context: description,
      });
    }
  };

  // Smooth pixel-level scroll — 20 small wheel events with jitter.
  // Use scrollToElement() instead when you have a target element.
  // Only use slowScroll for general page exploration (no specific target).
  const slowScroll = async (totalY, steps = 20) => {
    const stepY = totalY / steps;
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepY);
      await page.waitForTimeout(40 + Math.random() * 20);
    }
  };

  // Glide cursor to an element over 35 animation frames (smooth cursor movement).
  // Auto-scrolls to bring the element into view first if needed.
  // Returns the boundingBox so callers can track coordinates.
  const glideMove = async (locator) => {
    // Scroll into view if off-screen (smooth, stops at the element)
    await scrollToElement(locator);
    const box = await locator.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 35 });
    await page.waitForTimeout(500);
    return box;
  };

  // Glide + click with real coordinate tracking.
  // context = rich description for AI narration (what happens after the click)
  const glideClick = async (locator, description, target, context) => {
    const box = await glideMove(locator);
    if (await page.evaluate(() => !!window.__vc?.clickPulse)) {
      await page.evaluate(() => window.__vc.clickPulse());
      await page.waitForTimeout(120);
    }
    track('click', description, target, toCoords(box), { context });
    await locator.click();
    await page.waitForTimeout(400);
  };

  // Human-like typing with real coordinate tracking.
  // context = rich description for AI narration (what this input does)
  const slowType = async (locator, text, description, target, context) => {
    const box = await glideMove(locator);
    await locator.click();
    await page.waitForTimeout(300);
    track('type', description, target, toCoords(box), { context, typed_text: text });
    for (const ch of text) {
      await locator.page().keyboard.type(ch, { delay: 70 + Math.random() * 90 });
    }
  };

  // Hover over an element to "explain" it without clicking.
  // description = what this element is; used as both label AND context
  const hoverTour = async (locator, description, ms = 1500) => {
    const box = await glideMove(locator);
    track('narrate', description, null, toCoords(box), { context: description });
    await page.waitForTimeout(ms);
  };

  // ── Your flow starts here ────────────────────────────────
  // Wait for the page (already loaded by `playwright-cli open`) to stabilize
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Example actions — replace with your flow
  // scrollToElement brings the target into view and stops — no blind scrolling
  const emailField = page.getByPlaceholder('you@example.com');
  await scrollToElement(emailField, 'Scroll to the sign-up form');

  await hoverTour(emailField, 'The email field accepts any valid email address for account creation.');

  await slowType(
    page.getByPlaceholder('you@example.com'), 'sarah.demo@gmail.com',
    'Enter email address', 'email',
    'Types a demo email address into the signup form. This will be used as the account login.',
  );

  // primary: true → gold star on timeline (this is the key action of the flow)
  await glideClick(
    page.getByRole('button', { name: 'Submit' }), 'Click submit button', 'submit',
    'Clicks the Submit button to create the account. A success message appears confirming registration.',
  );
  // Mark the last click as primary (key action)
  __actions[__actions.length - 1].primary = true;

  // ── Wait for success state ───────────────────────────────
  // In Connected mode, use the exact DOM element from the component source.
  // In Explore mode, use a semantic heading/text that appears on success.
  await page.getByRole('heading', { name: 'Success' })
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  track('narrate', 'Flow complete');

  // ── Stop recording ────────────────────────────────────────
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  ));
  await page.waitForTimeout(500);
  recording = false;
  await cdp.send('Page.stopScreencast');
  ffmpeg.stdin.end();
  await new Promise(r => ffmpeg.on('close', r));

  // ── Save tracked actions ─────────────────────────────────
  writeFileSync('.vorec/tracked-actions.json', JSON.stringify(__actions, null, 2));
  console.log(`${__actions.length} actions tracked → .vorec/tracked-actions.json`);

  await browser.close();
  console.log('Recording saved → ./recordings/output.mp4');
}
```

## Running the script

```bash
mkdir -p .vorec recordings
node hero-script.mjs
```

The script:
1. Launches Chromium with DPR 2 (4K rendering)
2. Opens the target URL directly (no white frame)
3. Starts CDP frame capture → pipes lossless PNGs to FFmpeg in real-time
4. Runs the flow (clicks, types, scrolls)
5. Stops recording → FFmpeg finalizes the MP4
6. Saves tracked actions to `.vorec/tracked-actions.json`

Output:
- `./recordings/output.mp4` — 4K H.264 video (8 Mbit/s, CRF 18)
- `.vorec/tracked-actions.json` — action data for Vorec

The resulting JSON matches the format Vorec's `agent-api/create-project` expects:
```json
[
  {
    "type": "narrate", "description": "Recording starts", "target": "intro",
    "timestamp": 0, "coordinates": { "x": 500, "y": 500 },
    "context": "The landing page loads showing the hero section with a sign-up form."
  },
  {
    "type": "type", "description": "Enter email address", "target": "email",
    "timestamp": 4.5, "coordinates": { "x": 480, "y": 420 },
    "context": "Types a demo email into the signup form. This will be the account login.",
    "typed_text": "sarah.demo@gmail.com"
  },
  {
    "type": "click", "description": "Click submit button", "target": "submit",
    "timestamp": 8.2, "coordinates": { "x": 510, "y": 580 },
    "context": "Clicks Submit to create the account. A success message confirms registration.",
    "primary": true
  },
  {
    "type": "narrate", "description": "Flow complete", "target": null,
    "timestamp": 12.0, "coordinates": { "x": 500, "y": 500 },
    "context": "The signup flow is complete. The user now has an account and can log in."
  }
]
```

### How Vorec uses each field

| Field | Stored as | Used for |
|-------|-----------|----------|
| `type` | `interaction_type` | Color-coded click dots on timeline |
| `description` | `description` | Timeline label + fallback for narration |
| `target` | `element_name` | Click marker tooltip |
| `timestamp` | `timestamp_seconds` | Position on timeline + narration timing |
| `coordinates` | `coordinates_x/y` | Click markers, auto-zoom targets, cursor effects |
| `context` | `ui_change` | **Fed to Vorec AI as narration source** — this is what makes voice-over rich |
| `typed_text` | Built into description | Narration knows what was typed |
| `selected_value` | Built into description | Narration knows what was picked |
| `primary` | `primary_click_index` on segment | **Gold star on timeline** — Vorec picks `primary_click` per narration segment based on action importance. Marking `primary: true` + writing strong `context` influences which clicks get stars. Stars are used for auto-zoom targets and article screenshots. |

**Only valid action types:** `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`. Anything else gets rejected by the agent-api.

**Why this matters:** When Vorec receives tracked actions, it skips video-based click detection entirely. The agent already knows what was clicked, when, and why — so Vorec only needs to write narration scripts using the action descriptions as context. This is faster, cheaper, and more accurate.

## Video quality presets

The hero script records directly to H.264 MP4 via CDP frames → FFmpeg. No WebM intermediate — no double compression.

Set `QUALITY` at the top of the hero script based on user preference:

| Preset | Resolution | DPR | Bitrate | Best for |
|--------|-----------|-----|---------|----------|
| `'4k'` (default) | 3840×2160 | 2 | 8 Mbit/s | Product demos, marketing, investor pitches |
| `'2k'` | 2880×1620 | 1.5 | 6 Mbit/s | Tutorials, onboarding, docs |
| `'1080p'` | 1920×1080 | 1 | 4 Mbit/s | Internal demos, quick recordings |

All presets use: lossless PNG frames, H.264 codec, CRF 18, slow preset, animation tune, 30 FPS.

Viewport is always 1920×1080 — only DPR changes. Content stays the same size, just sharper pixels.

## No dead-time trimming needed

The recording script controls all timing directly — there are no random pauses like a human recording. Every `waitForTimeout` in the script is intentional (waiting for animations, page loads, giving the viewer time to see what happened). No post-processing trim needed.

## Common failures and fixes

| Failure | Fix |
|---|---|
| FFmpeg "pipe broken" | Previous recording process still running. Kill it: `pkill -f 'ffmpeg.*output.mp4'` |
| Glitched last frame | Add `requestAnimationFrame` × 2 + 500ms wait before `Page.stopScreencast`. |
| Strict mode violation on locator | Use `{ exact: true }` or `.first()` or scope to a container. |
| Content looks zoomed out / tiny | Don't change viewport size for quality. Keep 1920×1080 viewport, use `deviceScaleFactor: 2` for sharp pixels. |
| White frame at start of video | You opened `about:blank`. Open the target URL directly instead. |
| `networkidle` hangs forever | Replace with `domcontentloaded`. Sites with WebSockets never go idle. |
| Cart has leftover items | Clear cart before recording via `goto /cart/` and clicking remove buttons. |
| Click times out | Overlay intercepting. Dismiss cookie banner / popup first. |
