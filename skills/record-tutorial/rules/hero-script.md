---
name: hero-script
description: The canonical recording script template with smooth scrolls, cursor glide, and human typing
---

# Hero Script Template

This is the **recording script** that both Connected and Explore modes produce. It runs inside the already-open `playwright-cli` browser via `playwright-cli run-code --filename=./hero-script.js`.

## Critical rules

1. **Viewport and screencast size MUST match** — always 1920×1080. Mismatched sizes cause the content-in-top-left-quadrant bug.
2. **Open the target URL directly** via `playwright-cli open <url>` before running the hero script. Never `about:blank` (avoids white start frame).
3. **Render flush before stop** — `requestAnimationFrame × 2` + 500ms wait before `screencast.stop()` to avoid a glitched last frame.
4. **Action tracking uses valid types only** — see table below. Never invent new types.
5. **Helpers must be inside the function body** — `playwright-cli run-code` expects a single async arrow function. No top-level `const` or `import`.
6. **Every action must call `track()`** — not just clicks. If the user types → `track('type', ...)`. Dropdown → `track('select', ...)`. Vorec needs the full workflow.

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
| `scroll` | Scroll to reveal content | Manual `track()` with `{ context }` |
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

```js
async page => {
  // ── Screencast setup ──────────────────────────────────────
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screencast.start({
    path: './recordings/output.webm',
    size: { width: 1920, height: 1080 },
    fps: 60,
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

  // Smooth pixel-level scroll — 20 small wheel events with jitter.
  // Better than scrollBy({behavior:'smooth'}) for recordings.
  const slowScroll = async (totalY, steps = 20) => {
    const stepY = totalY / steps;
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepY);
      await page.waitForTimeout(40 + Math.random() * 20);
    }
  };

  // Glide cursor to an element over 35 animation frames (smooth cursor movement).
  // Returns the boundingBox so callers can track coordinates.
  const glideMove = async (locator) => {
    const box = await locator.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 35 });
    await page.waitForTimeout(500);
    return box;
  };

  // Glide + click with real coordinate tracking.
  // context = rich description for AI narration (what happens after the click)
  const glideClick = async (locator, description, target, context) => {
    const box = await glideMove(locator);
    if (typeof window !== 'undefined' && window.__vc?.clickPulse) {
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
  track('scroll', 'Scroll to sign-up form', null, null, {
    context: 'Scrolling down to reveal the sign-up form at the bottom of the landing page.',
  });
  await slowScroll(200);

  await hoverTour(page.getByPlaceholder('you@example.com'), 'The email field accepts any valid email address for account creation.');

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

  // ── Render flush before stop ─────────────────────────────
  // Avoids glitched/corrupted last frame of the recording.
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  ));
  await page.waitForTimeout(500);
  await page.screencast.stop();

  // ── Save tracked actions to page context ─────────────────
  // Stored on window so a second run-code call can extract them.
  await page.evaluate((a) => { window.__vorec_actions = a; }, __actions);
}
```

## Running the script

```bash
playwright-cli close-all
playwright-cli open <TARGET_URL>     # opens target directly — no white frame
playwright-cli resize 1920 1080
playwright-cli run-code --filename=./hero-script.js
```

## Extracting tracked actions

After the hero script finishes, the tracked actions are stored on `window.__vorec_actions`. Extract them with a second `run-code` call:

```bash
mkdir -p .vorec
playwright-cli run-code "async page => JSON.stringify(await page.evaluate(() => window.__vorec_actions || []))" 2>/dev/null | node -e "
  let buf = '';
  process.stdin.on('data', d => buf += d);
  process.stdin.on('end', () => {
    const m = buf.match(/\[[\s\S]*\]/);
    if (m) {
      const actions = JSON.parse(m[0]);
      require('fs').writeFileSync('.vorec/tracked-actions.json', JSON.stringify(actions, null, 2));
      console.log(actions.length + ' actions tracked');
    } else {
      console.error('No actions found — check hero script track() calls');
      process.exit(1);
    }
  });
"
```

**Why two run-code calls?** `console.log` inside `playwright-cli run-code` does NOT appear in stdout — only the script source and return value do. Storing actions on `window` and extracting separately is the reliable approach.

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

## Convert WebM → MP4 (visually lossless)

```bash
ffmpeg -y -i ./recordings/output.webm \
  -c:v libx264 -preset slower -crf 15 -tune animation \
  -pix_fmt yuv420p -movflags +faststart \
  ./recordings/output.mp4
```

Settings:
- `-crf 15` — visually lossless (lower = better, 17 is standard, 15 is premium)
- `-preset slower` — better compression at same quality
- `-tune animation` — UI-content-aware compression
- `-pix_fmt yuv420p` — universal compatibility
- `-movflags +faststart` — plays while downloading

## Dead-time trim (optional)

If the recording has long pauses between actions, trim them. Read the action log and keep only windows around each action:

```bash
# Python trim using action timestamps
python3 - <<PY
import json, subprocess
with open('.vorec/tracked-actions.json') as f:
    actions = json.load(f)

PRE, POST = 0.8, 2.0   # keep this long before/after each action
segs = []
for a in actions:
    if a['type'] in ('start', 'stop'): continue
    segs.append([max(0, a['timestamp'] - PRE), a['timestamp'] + POST])

# Merge overlapping segments
segs.sort()
merged = []
for s in segs:
    if merged and s[0] <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], s[1])
    else:
        merged.append(list(s))

sel = '+'.join(f"between(t,{s:.2f},{e:.2f})" for s, e in merged)
subprocess.run([
    'ffmpeg', '-y', '-i', './recordings/output.mp4',
    '-filter_complex', f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB[v]",
    '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'slower', '-crf', '15',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    './recordings/output-trimmed.mp4'
], check=True)
PY
```

Typical result: 80-90% of dead time removed, video length drops from ~60s to ~10-15s.

## Common failures and fixes

| Failure | Fix |
|---|---|
| "Screencast is already started" | Previous run crashed. `playwright-cli close-all` and retry. |
| Glitched last frame | Add `waitForLoadState('networkidle')` + `requestAnimationFrame` × 2 before stop. |
| Strict mode violation on locator | Use `{ exact: true }` or `.first()` or scope to a container. |
| Content in top-left quadrant (black padding) | Viewport and screencast size don't match. Set both to 1920×1080. |
| Content looks zoomed out | Don't use huge viewports. 1920×1080 is the sweet spot. |
| White frame at start of video | You opened `about:blank`. Open the target URL directly instead. |
| `networkidle` hangs forever | Replace with `domcontentloaded`. Sites with WebSockets never go idle. |
| Cart has leftover items | Clear cart before recording via `goto /cart/` and clicking remove buttons. |
| Click times out | Overlay intercepting. Dismiss cookie banner / popup first. |
