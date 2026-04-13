---
name: cursor-pack
description: Visible cursor injection with auto-morph and click shrink animation (opt-in)
---

# Cursor Pack (Opt-in)

When the user answered **Yes** to "visible cursors?" in Step 6 of the main workflow, this rule is loaded. The vorec script gets an extra cursor-injection block that:

- Shows a big, visible cursor overlay on top of every page
- Auto-morphs between arrow / pointer / text / grabbing / crosshair based on what element is under the mouse (uses the CSS `cursor` property of the hovered element)
- Plays a quick shrink-and-return animation on every click for tactile feedback
- Uses Vorec's bundled SVG cursor pack — no user-provided assets

If the user answered **No**, skip this file entirely.

## The bundled cursor pack

Vorec ships 5 SVG cursors with the plugin at `skills/record-tutorial/cursors/`:

| File | Purpose | Shown when hovering |
|---|---|---|
| `arrow.svg` | Default pointer | Normal whitespace, non-interactive areas |
| `pointer.svg` | Pointing hand | Buttons, links, `[role="button"]` (CSS `cursor: pointer`) |
| `text.svg` | I-beam | Input fields, textareas (CSS `cursor: text`) |
| `grabbing.svg` | Closed hand | Draggable elements, sortable items (CSS `cursor: grab`/`grabbing`) |
| `crosshair.svg` | Precise cross | Selection tools, canvases (CSS `cursor: crosshair`) |

Plus `hotspots.json` mapping each cursor to its "tip" pixel (the coordinate inside the image that aligns with the mouse position).

## How the vorec script loads them

`playwright-cli run-code` doesn't allow `require` or dynamic imports. So the cursor SVGs must be **baked into the vorec script as base64 data URLs at script generation time**.

### Step 1 — Read the SVG files from the plugin

The agent uses the `Read` tool (or `cat` via bash) to load the 5 SVG files from the plugin's bundled `cursors/` directory. The plugin install path depends on Claude Code's plugin manager, but the files are always at:

```
<plugin-root>/skills/record-tutorial/cursors/arrow.svg
<plugin-root>/skills/record-tutorial/cursors/pointer.svg
<plugin-root>/skills/record-tutorial/cursors/text.svg
<plugin-root>/skills/record-tutorial/cursors/grabbing.svg
<plugin-root>/skills/record-tutorial/cursors/crosshair.svg
<plugin-root>/skills/record-tutorial/cursors/hotspots.json
```

### Step 2 — Generate the cursor constants

Use a short node one-liner to read + base64-encode each SVG:

```bash
node -e "
const fs = require('fs');
const dir = '<plugin-root>/skills/record-tutorial/cursors';
const files = ['arrow', 'pointer', 'text', 'grabbing', 'crosshair'];
const cursors = {};
for (const f of files) {
  const svg = fs.readFileSync(dir + '/' + f + '.svg', 'utf-8');
  cursors[f] = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}
const hotspots = JSON.parse(fs.readFileSync(dir + '/hotspots.json', 'utf-8'));
console.log('const CURSORS = ' + JSON.stringify(cursors) + ';');
console.log('const HOTSPOTS = ' + JSON.stringify(hotspots) + ';');
" > /tmp/cursor-consts.js
```

### Step 3 — Add the constants to the recording script

Write the cursor constants directly into `vorec-script.mjs` at the top of the file, before any page interactions. The agent writes the full script in one pass — no sed injection needed.

## The cursor injection block (goes inside the vorec script)

Add this to the vorec script AFTER the constants and BEFORE any page interactions:

```js
// Inject visible cursor with auto-morph + click shrink animation
const injectCursor = async () => {
  await page.addStyleTag({ content: `
    .__vc-root {
      position: fixed; top: 0; left: 0;
      pointer-events: none;
      z-index: 2147483647;
      transition: transform 70ms cubic-bezier(0.2, 0.8, 0.2, 1);
      will-change: transform;
    }
    .__vc-root img {
      display: block;
      width: 48px;
      height: 48px;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
      transform: scale(1);
      transform-origin: var(--hs-x, 0) var(--hs-y, 0);
      transition: transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .__vc-root img.__vc-clicking {
      transform: scale(0.78);
    }
  `}).catch(() => {});

  await page.evaluate(({ cursors, hotspots }) => {
    if (document.querySelector('.__vc-root')) return;

    const root = document.createElement('div');
    root.className = '__vc-root';
    const img = document.createElement('img');
    img.src = cursors.arrow;
    img.draggable = false;
    root.appendChild(img);
    document.body.append(root);

    // Native SVG dimensions (used to scale hotspots to 48px display)
    const nativeSizes = {
      arrow: [28, 28], pointer: [32, 32], text: [16, 28],
      grabbing: [32, 32], crosshair: [32, 32],
    };

    let currentStyle = 'arrow';
    const applyStyle = (name) => {
      if (name === currentStyle) return;
      if (!cursors[name]) return;
      img.src = cursors[name];
      currentStyle = name;
      const hs = hotspots[name] || [0, 0];
      const [w, h] = nativeSizes[name] || [28, 28];
      const pxHx = hs[0] * (48 / w);
      const pxHy = hs[1] * (48 / h);
      root.dataset.pxhx = pxHx;
      root.dataset.pxhy = pxHy;
      img.style.setProperty('--hs-x', pxHx + 'px');
      img.style.setProperty('--hs-y', pxHy + 'px');
    };
    const initHs = hotspots.arrow || [0, 0];
    const [iw, ih] = nativeSizes.arrow;
    root.dataset.pxhx = initHs[0] * (48 / iw);
    root.dataset.pxhy = initHs[1] * (48 / ih);
    img.style.setProperty('--hs-x', (initHs[0] * (48 / iw)) + 'px');
    img.style.setProperty('--hs-y', (initHs[1] * (48 / ih)) + 'px');

    // Expose the click pulse so glideClick can trigger it
    window.__vc = {
      clickPulse() {
        img.classList.remove('__vc-clicking');
        void img.offsetWidth;
        img.classList.add('__vc-clicking');
        setTimeout(() => img.classList.remove('__vc-clicking'), 160);
      },
    };

    // Track mouse movement + auto-morph based on CSS cursor of hovered element
    document.addEventListener('mousemove', (e) => {
      const pxHx = parseFloat(root.dataset.pxhx || 0);
      const pxHy = parseFloat(root.dataset.pxhy || 0);
      root.style.left = (e.clientX - pxHx) + 'px';
      root.style.top = (e.clientY - pxHy) + 'px';

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const cur = getComputedStyle(el).cursor;
        if (cur === 'pointer') applyStyle('pointer');
        else if (cur === 'text') applyStyle('text');
        else if (cur === 'grab' || cur === 'grabbing') applyStyle('grabbing');
        else if (cur === 'crosshair') applyStyle('crosshair');
        else applyStyle('arrow');
      }
    }, true);
  }, { cursors: CURSORS, hotspots: HOTSPOTS });
};

await injectCursor();
// Re-inject after every navigation (new DOM wipes the overlay)
page.on('load', () => injectCursor().catch(() => {}));
```

## How `glideClick` triggers the shrink animation

The `glideClick` helper (from `vorec-script.md`) already checks for `window.__vc?.clickPulse`:

```js
const glideClick = async (locator, description, target) => {
  await glideMove(locator);
  if (await page.evaluate(() => !!window.__vc?.clickPulse)) {
    await page.evaluate(() => window.__vc.clickPulse());
    await page.waitForTimeout(120);
  }
  log('click', description, target);
  await locator.click();
  await page.waitForTimeout(400);
};
```

If the cursor pack is loaded, every click fires a ~160ms shrink-and-return animation. If not loaded, the helper is a no-op — no errors.

## Click shrink animation mechanics

- Cursor scales from `1.0` → `0.78` over 120ms with a bouncy spring curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Snaps back to `1.0` after 160ms total
- `transform-origin` is set to the hotspot pixel, so the cursor shrinks AROUND its tip — tip stays anchored, body compresses inward
- Feels tactile, like a real click

## What we DON'T include

- **No hover rings** (green glow around clickable elements) — removed for cleaner look, Vorec adds highlight effects in post-production
- **No click ripples** (purple ring overlay) — replaced by the shrink animation
- **No chapter cards** — Vorec adds intro slides and section markers in post-production
- **No step numbers** (numbered badges on clicks) — Vorec adds them in post if needed

Everything the cursor pack does is just cursor-level visual feedback. All post-production effects (zoom, spotlight, callouts, branding) come from Vorec after upload.

## Bigger or smaller cursors?

Change the `width: 48px; height: 48px` in the CSS to whatever you want:
- **48px** (default) — visible but not obtrusive
- **64px** — for 4K recordings or emphasis
- **32px** — minimal, closer to OS size

The hotspot math scales automatically.
