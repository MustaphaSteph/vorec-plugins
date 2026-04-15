---
name: recording-script
description: The recording script template — captures video, tracks actions, and outputs MP4 + tracked actions JSON
---

# Recording Script

This is the **recording script** that the agent writes for each tutorial. It opens a browser, walks through the flow, records a high-quality video, and tracks every action with coordinates and context.

The script is a standalone Node.js file (`vorec-script.mjs`) — run it with `node vorec-script.mjs`.

## Critical rules

### Recording quality
1. **4K quality by default** — record at 1920×1080 with DPR 2 via `recordVideo`, then upscale to 4K with FFmpeg lanczos.
2. **Navigate to the target URL directly** — `page.goto(url)`. Never leave the page on `about:blank` (avoids white start frame).
3. **Stop recording correctly** — (a) render flush with `requestAnimationFrame × 2`, (b) `page.close()`, (c) `page.video().saveAs(path)` which waits until the video is fully written, (d) `browser.close()`. Use `saveAs()` not `path()` — `path()` returns before the video is finalized.
4. **The vorec script is a standalone Node.js file** (`vorec-script.mjs`) — run with `node vorec-script.mjs`.

### Action tracking
5. **Every action must call `track()`** — not just clicks. If the user types → `track('type', ...)`. Dropdown → `track('select', ...)`. Vorec needs the full workflow.
6. **Action tracking uses valid types only** — see table below. Never invent new types.
7. **Scroll TO the element, not past it** — use `scrollToElement(locator)` to bring the next target into view. Never blindly scroll a fixed pixel amount.

### Pacing — this is what makes a tutorial watchable
8. **Context length = video length.** Every action pauses for `words÷3` seconds. 30-word context = 10s pause. Keep contexts tight. For loops (adding multiple items), first item gets full context, middle items get 3-6 words. See [./pacing.md](./pacing.md) and [./context-writing.md](./context-writing.md).

### Writing long scripts (10+ actions)
These rules prevent drift when the script gets big:

9. **Max 1 narrate before the first click on each page** — orient the viewer once, then start interacting. Don't stack 3-5 narrate blocks before clicking anything.
10. **description and context must be DIFFERENT** — `description` is a short label (5-15 words). `context` is a rich narration source (1-2 sentences). Never copy one into the other.
11. **Every tracked action must have context** — no empty context fields. If you're adding 7 players, each `track('type', ...)` needs context. For repeated actions, vary the context (e.g. "Adding our second player" → "Five players in, two more to go").
12. **Always use `slowType` for tracked type actions** — never use manual `keyboard.type` with different delays. The `slowType` helper handles timing consistently. No exceptions.
13. **Use loops for repeated actions, but keep context unique** — for adding multiple items (players, rows, products), use a loop but give at least the first and last items full context, and every 3rd item a progress update.

## Action types for `track()` calls

```js
track(type, name, description, target, coords, { context, typed_text, selected_value })
```

| Type | When to use | Helper |
|------|-------------|--------|
| `click` | Click a button, link, tab, checkbox, toggle | `glideClick(locator, name, description, target, context)` |
| `type` | Type text into an input field | `slowType(locator, text, name, description, target, context)` |
| `select` | Pick from a dropdown/select | Manual `track()` with `{ context, selected_value }` |
| `hover` | Hover to reveal tooltip/menu | Manual `track()` with `{ context }` |
| `scroll` | Scroll to reveal content | `scrollToElement(locator, name, description)` — auto-tracks |
| `wait` | Pause for animation/loading | Manual `track()` with `{ context }` |
| `navigate` | Navigate to a new page/URL | Manual `track()` with `{ context }` |
| `narrate` | Describe scene — NO interaction | `hoverTour(locator, name, description)` or manual `track()` |

### Fields explained

| Field | What it's for | Example |
|-------|--------------|---------|
| **`name`** | **Short label on timeline** (max 5 words). This is what appears on dots in the editor. | `"Generate Tournament"`, `"Enter email"`, `"Submit"` |
| **`description`** | Longer description of the action (5-15 words) | `"Click Generate Tournament to start the wizard"` |
| **`target`** | Element identifier (selector name) | `"generate-btn"`, `"email-input"` |
| **`context`** | **Rich scene description for AI narration** (1-2 sentences). What happens, what appears, why it matters. | `"Clicks Generate Tournament. The format picker appears with 6 options."` |
| **`typed_text`** | What was typed (auto-set by `slowType`) | `"sarah.demo@gmail.com"` |
| **`selected_value`** | What was picked from dropdown | `"Monthly"` |
| **`coordinates`** | Auto-captured by helpers from `boundingBox()`. Normalized 0-1000. | `{ x: 850, y: 120 }` |
| **`primary`** | Mark as a KEY action — **gold star** on timeline. Use for page state changes, goal completions, zoom-worthy moments. 2-4 per flow. | `true` |

### Writing good `context` — this is what makes narration great

**Load [./context-writing.md](./context-writing.md) before writing ANY context.** It teaches the 7 rules for context that produces professional narration. Key points:

1. Describe what you SEE, not just what you click
2. Set the scene BEFORE the action (where are we, what's on screen)
3. React to what CHANGED after the action (modal opened, page changed)
4. Group by intent, not individual click
5. Orient the viewer on every new page
6. Vary context for repeated actions (don't copy-paste)
7. Every action MUST have context — no empty fields

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

The vorec script is a **standalone Node.js file**. It uses Playwright's `recordVideo` for real-time recording (pauses are captured correctly), then upscales and re-encodes with FFmpeg.

Run it with: `node vorec-script.mjs`

```js
// vorec-script.mjs — standalone Node.js recording script
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

const OUTPUT_DIR = '.vorec/PROJECT_SLUG';
mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Recording setup ─────────────────────────────────────────
// Record at 1080p with DPR 2 (retina-sharp rendering internally).
// Then upscale to 4K with FFmpeg lanczos after recording.
// Uses recordVideo (standard Playwright API) — NOT page.screencast
// (which only exists in playwright-cli run-code, not standalone scripts).
const QUALITY = '4k'; // '4k', '2k', or '1080p'

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2, // always 2 — renders sharp text/UI internally
  recordVideo: {
    dir: OUTPUT_DIR,
    size: { width: 1920, height: 1080 },
  },
});
const page = await context.newPage();
await page.goto('TARGET_URL', { waitUntil: 'domcontentloaded' });

  // ── Action tracking (for Vorec narration) ────────────────
  // Timestamps are relative — they get scaled to match the actual
  // video duration after recording (see "Sync action timestamps" below).
  const VP = { w: 1920, h: 1080 };
  const __actions = [];
  const T0 = Date.now();
  const track = (type, name, description, target, coords, extra) => {
    __actions.push({
      type,
      name,          // short label for timeline (max 5 words, e.g. "Generate Tournament")
      description,   // what the user is doing (5-10 words)
      target,        // element identifier
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

  // ── Narration-driven timing ──────────────────────────────
  // Agent writes the NARRATION that will be spoken over each action.
  // Pause duration = time needed to speak the narration (~3 words/sec).
  // Narration must follow rules/narration-rules.md for the chosen style.
  const STYLE = 'tutorial'; // set from user's choice
  const TYPING_DELAY = { exact: 50, concise: 60, tutorial: 80, professional: 80,
    conversational: 100, storytelling: 100, academic: 100, persuasive: 80,
  }[STYLE] || 80;
  const pause = (narration) => Math.max(1500, Math.round(((narration || '').split(/\s+/).length / 3) * 1000));

  track('narrate', 'Intro', 'Recording starts', 'intro', null, {
    context: 'The page loads showing the main content.',
  });
  await page.waitForTimeout(pause('The page loads showing the main content.'));

  // ── Helpers ──────────────────────────────────────────────

  // Smooth scroll to bring a target element into view. Scrolls just enough
  // to center the element vertically — NEVER scrolls past it.
  // Use this instead of blindly scrolling a fixed pixel amount.
  const scrollToElement = async (locator, name, description) => {
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
    if (name) {
      track('scroll', name, description || name, null, toCoords(await locator.boundingBox()), {
        context: description || name,
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
    await scrollToElement(locator, null, null); // silent scroll, no tracking (caller tracks the action)
    const box = await locator.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 35 });
    await page.waitForTimeout(500);
    return box;
  };

  // Glide + click. Pause duration = time to speak the narration.
  // narration = what will be said aloud (sized to action duration, in style).
  const glideClick = async (locator, name, description, target, context, narration) => {
    const box = await glideMove(locator);
    if (await page.evaluate(() => !!window.__vc?.clickPulse)) {
      await page.evaluate(() => window.__vc.clickPulse());
      await page.waitForTimeout(120);
    }
    track('click', name, description, target, toCoords(box), { context, narration });
    await locator.click();
    await page.waitForTimeout(pause(narration || context));
  };

  // Human-like typing. narration controls the pause after typing.
  const slowType = async (locator, text, name, description, target, context, narration) => {
    const box = await glideMove(locator);
    await locator.click();
    await page.waitForTimeout(300);
    track('type', name, description, target, toCoords(box), { context, narration, typed_text: text });
    for (const ch of text) {
      await page.keyboard.type(ch, { delay: TYPING_DELAY + Math.random() * (TYPING_DELAY * 0.5) });
    }
    await page.waitForTimeout(pause(narration || context));
  };

  // Hover to explain an element. narration = what's spoken over the hover.
  const hoverTour = async (locator, name, description, narration) => {
    const box = await glideMove(locator);
    track('narrate', name, description, null, toCoords(box), { context: description, narration });
    await page.waitForTimeout(pause(narration || description));
  };

  // ── Your flow starts here ────────────────────────────────
  // Wait for the page to stabilize after page.goto()
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Example actions — replace with your flow
  //                                    name (5 words max)  description (longer)    target    context (1-2 sentences for narration)

  const emailField = page.getByPlaceholder('you@example.com');
  await scrollToElement(emailField, 'Sign-up form', 'Scroll down to the sign-up form section');

  await hoverTour(emailField, 'Email field', 'The email field accepts any valid email address for account creation.');

  await slowType(
    page.getByPlaceholder('you@example.com'), 'sarah.demo@gmail.com',
    'Enter email', 'Enter email address into signup form', 'email',
    'Types a demo email address. This will be the account login.',
  );

  await glideClick(
    page.getByRole('button', { name: 'Submit' }),
    'Submit', 'Click submit to create account', 'submit',
    'Clicks Submit. A success message appears confirming registration.',
  );
  __actions[__actions.length - 1].primary = true;

  // ── Wait for success state ───────────────────────────────
  // In Connected mode, use the exact DOM element from the component source.
  // In Explore mode, use a semantic heading/text that appears on success.
  await page.getByRole('heading', { name: 'Success' })
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  track('narrate', 'Complete', 'Flow complete', null, null, {
    context: 'The flow is complete. The user has successfully finished the task.',
  });

  // ── Stop recording ────────────────────────────────────────
  // Render flush to avoid glitched last frame
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  ));
  await page.waitForTimeout(500);

  // Close context to finalize recording, then use saveAs() which
  // WAITS until the video is fully written (unlike path() which returns early).
  const rawVideo = `${OUTPUT_DIR}/raw.webm`;
  await page.close();
  await page.video().saveAs(rawVideo);
  await browser.close();

  // ── Upscale + re-encode ───────────────────────────────────
  // Step 1: Re-encode WebM → MP4 at source resolution
  // Step 2: Upscale to target quality with lanczos (sharp edges)
  const SIZES = { '4k': '3840:2160', '2k': '2560:1440', '1080p': null };
  const targetSize = SIZES[QUALITY];
  const scaleFilter = targetSize ? `-vf "scale=${targetSize}:flags=lanczos"` : '';

  console.log(`Re-encoding to ${QUALITY} MP4...`);
  execSync(`ffmpeg -y -i "${rawVideo}" \
    ${scaleFilter} \
    -c:v libx264 -preset slow -crf 18 -tune animation \
    -pix_fmt yuv420p -movflags +faststart \
    "${OUTPUT_DIR}/output.mp4"`, { stdio: 'pipe' });
  execSync(`rm "${rawVideo}"`);

  // ── Sync action timestamps to video duration ─────────────
  // Date.now() and recordVideo are two separate clocks that drift.
  // Use the final MP4 duration as source of truth and scale all
  // timestamps so they fit inside the video exactly.
  const probe = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUTPUT_DIR}/output.mp4"`,
    { encoding: 'utf8' },
  );
  const videoDuration = parseFloat(probe.trim());
  const lastAction = __actions[__actions.length - 1]?.timestamp || 0;
  if (videoDuration > 0 && lastAction > 0) {
    const scale = (videoDuration - 1) / lastAction; // 1s margin before video end
    for (const a of __actions) a.timestamp = +(a.timestamp * scale).toFixed(2);
    console.log(`Synced timestamps: video=${videoDuration.toFixed(1)}s, scale=${scale.toFixed(3)}`);
  }

  // ── Save tracked actions ─────────────────────────────────
  writeFileSync(`${OUTPUT_DIR}/tracked-actions.json`, JSON.stringify(__actions, null, 2));
  console.log(`${__actions.length} actions tracked → ${OUTPUT_DIR}/tracked-actions.json`);
  console.log(`Recording saved → ${OUTPUT_DIR}/output.mp4`);
```

## Running the script

```bash
node .vorec/<project-slug>/vorec-script.mjs
```

The script:
1. Launches Chromium with DPR 2 (retina-sharp rendering)
2. Opens the target URL directly (no white frame)
3. `recordVideo` captures the browser in real-time (all pauses appear in video)
4. Runs the flow (clicks, types, scrolls)
5. Closes context → FFmpeg upscales to 4K with lanczos + re-encodes to MP4
6. Saves tracked actions

Output (inside `.vorec/<project-slug>/`):
- `output.mp4` — 4K H.264 video
- `tracked-actions.json` — action data for Vorec

The resulting JSON matches the format Vorec's `agent-api/create-project` expects:
```json
[
  {
    "type": "narrate", "name": "Intro", "description": "Recording starts", "target": "intro",
    "timestamp": 0, "coordinates": { "x": 500, "y": 500 },
    "context": "The landing page loads showing the hero section with a sign-up form."
  },
  {
    "type": "type", "name": "Enter email", "description": "Enter email address into signup form",
    "target": "email", "timestamp": 4.5, "coordinates": { "x": 480, "y": 420 },
    "context": "Types a demo email. This will be the account login.",
    "typed_text": "sarah.demo@gmail.com"
  },
  {
    "type": "click", "name": "Submit", "description": "Click submit to create account",
    "target": "submit", "timestamp": 8.2, "coordinates": { "x": 510, "y": 580 },
    "context": "Clicks Submit. A success message confirms registration.",
    "primary": true
  },
  {
    "type": "narrate", "name": "Complete", "description": "Flow complete",
    "target": null, "timestamp": 12.0, "coordinates": { "x": 500, "y": 500 },
    "context": "The signup flow is complete. The user now has an account."
  }
]
```

### How Vorec uses each field

| Field | Stored as | Used for |
|-------|-----------|----------|
| `name` | `element_name` | **Timeline dot label** (what appears on hover) |
| `type` | `interaction_type` | Color-coded click dots on timeline |
| `description` | `description` | Longer action label, narration fallback |
| `target` | Included in action data | Element identifier |
| `timestamp` | `timestamp_seconds` | Position on timeline + narration timing |
| `coordinates` | `coordinates_x/y` | Click markers, auto-zoom targets, cursor effects |
| `context` | `ui_change` | **Fed to Vorec AI as narration source** |
| `typed_text` | `typed_text` | Narration knows what was typed |
| `selected_value` | `selected_value` | Narration knows what was picked |
| `primary` | `is_primary` | **Gold star on timeline** — auto-zoom targets, article screenshots |

**Only valid action types:** `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`. Anything else gets rejected by the agent-api.

**Why this matters:** When Vorec receives tracked actions, it skips video-based click detection entirely. The agent already knows what was clicked, when, and why — so Vorec only needs to write narration scripts using the action descriptions as context. This is faster, cheaper, and more accurate.

## Video quality presets

Recording always happens at 1920×1080 with DPR 2 (sharp text/UI). FFmpeg upscales to the target resolution after recording using lanczos (preserves sharp edges).

| Preset | Output | How |
|--------|--------|-----|
| `'4k'` (default) | 3840×2160 | Record 1080p DPR 2 → upscale with lanczos |
| `'2k'` | 2560×1440 | Record 1080p DPR 2 → upscale with lanczos |
| `'1080p'` | 1920×1080 | Record 1080p DPR 2 → re-encode only (no upscale) |

DPR 2 is always on — even 1080p gets retina-sharp rendering. The upscale works because the source pixels are already crisp from DPR 2.

## No dead-time trimming needed

The recording script controls all timing directly — every `waitForTimeout` is intentional (giving the viewer time to read, waiting for animations, holding after clicks). Since `recordVideo` records in real-time, these pauses appear naturally in the video. No post-processing trim needed — get the pacing right in the script.

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
