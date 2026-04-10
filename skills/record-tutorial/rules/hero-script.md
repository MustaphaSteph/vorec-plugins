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
4. **Action log uses valid types only** — `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`. Never invent new types.
5. **Helpers must be inside the function body** — `playwright-cli run-code` expects a single async arrow function. No top-level `const` or `import`.

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

  // ── Action log (for Vorec narration) ─────────────────────
  const T0 = Date.now();
  const log = (type, description, target) => {
    const t = (Date.now() - T0) / 1000;
    // Emitted as console.log with VOREC_PHASE: prefix so the wrapper
    // script can grep them out and upload as tracked actions.
    console.log(`VOREC_PHASE:${JSON.stringify({ type, description, target, t })}`);
  };
  log('narrate', 'Recording starts', 'intro');

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
  const glideMove = async (locator) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 35 });
    await page.waitForTimeout(500);
  };

  // Glide + click with optional cursor shrink animation (if cursor pack is loaded).
  const glideClick = async (locator, description, target) => {
    await glideMove(locator);
    if (typeof window !== 'undefined' && window.__vc?.clickPulse) {
      await page.evaluate(() => window.__vc.clickPulse());
      await page.waitForTimeout(120);
    }
    log('click', description, target);
    await locator.click();
    await page.waitForTimeout(400);
  };

  // Human-like typing with jittered keystrokes (60-140ms).
  const slowType = async (locator, text, description, target) => {
    await glideMove(locator);
    await locator.click();
    await page.waitForTimeout(300);
    log('type', description, target);
    for (const ch of text) {
      await locator.page().keyboard.type(ch, { delay: 70 + Math.random() * 90 });
    }
  };

  // Hover over an element to "explain" it without clicking. Used in the
  // optional "explain first" phase of Explore mode recordings.
  const hoverTour = async (locator, description, ms = 1500) => {
    await glideMove(locator);
    log('narrate', description);
    await page.waitForTimeout(ms);
  };

  // ── Your flow starts here ────────────────────────────────
  // Wait for the page (already loaded by `playwright-cli open`) to stabilize
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Example actions — replace with your flow
  await slowScroll(200);
  await hoverTour(page.getByPlaceholder('you@example.com'), 'Email field');
  await slowType(page.getByPlaceholder('you@example.com'), 'demo@example.com', 'Type email', 'email');
  await glideClick(page.getByRole('button', { name: 'Submit' }), 'Click submit', 'submit');

  // ── Wait for success state ───────────────────────────────
  // In Connected mode, use the exact DOM element from the component source.
  // In Explore mode, use a semantic heading/text that appears on success.
  await page.getByRole('heading', { name: 'Success' })
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(3000);
  log('narrate', 'Flow complete');

  // ── Render flush before stop ─────────────────────────────
  // Avoids glitched/corrupted last frame of the recording.
  await page.evaluate(() => new Promise(r =>
    requestAnimationFrame(() => requestAnimationFrame(r))
  ));
  await page.waitForTimeout(500);
  await page.screencast.stop();
}
```

## Running the script

```bash
playwright-cli close-all
playwright-cli open <TARGET_URL>     # opens target directly — no white frame
playwright-cli resize 1920 1080
playwright-cli run-code --filename=./hero-script.js 2>&1 | tee /tmp/run.log
```

## Action log → tracked actions JSON

The `VOREC_PHASE:` lines in the output become the tracked actions JSON. A simple bash pipeline extracts them:

```bash
grep "VOREC_PHASE:" /tmp/run.log | sed 's/VOREC_PHASE://' | jq -s '.' > /tmp/tracked-actions.json
```

The resulting JSON matches the format Vorec's `agent-api/create-project` expects:
```json
[
  { "type": "narrate", "description": "Email field", "target": "email", "t": 2.1 },
  { "type": "type", "description": "Type email", "target": "email", "t": 4.5 },
  { "type": "click", "description": "Click submit", "target": "submit", "t": 8.2 }
]
```

**Only valid action types:** `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate`. Anything else gets rejected by the agent-api.

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
with open('/tmp/tracked-actions.json') as f:
    actions = json.load(f)

PRE, POST = 0.8, 2.0   # keep this long before/after each action
segs = []
for a in actions:
    if a['type'] in ('start', 'stop'): continue
    segs.append([max(0, a['t'] - PRE), a['t'] + POST])

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
