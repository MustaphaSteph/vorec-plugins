---
name: playwright-cli-running-code
description: Running hero scripts via playwright-cli run-code
---

# playwright-cli — Running Code

`playwright-cli run-code` executes arbitrary JavaScript inside the current browser session. This is how hero scripts run for Vorec recordings.

> Adapted from Microsoft's [playwright-cli running-code reference](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/references/running-code.md) (Apache 2.0).

## Basic usage

```bash
# Open a browser first (always to a real URL, not about:blank)
playwright-cli open https://example.com

# Run a .js file
playwright-cli run-code --filename=./hero-script.js

# Or pass code inline
playwright-cli run-code "async page => { console.log(await page.title()); }"
```

The script file **must** be a single async arrow function that receives a `page` argument. No top-level code, no `import`, no `require`.

## The expected script shape

```js
// ✅ CORRECT — single async arrow function
async page => {
  await page.goto('https://example.com');
  await page.click('button');
}
```

```js
// ❌ WRONG — top-level code, imports, multiple statements
import { chromium } from 'playwright';  // ❌ import not allowed
const name = 'Demo';                     // ❌ top-level const not allowed
async function main() { ... }            // ❌ wrong function shape

(async () => {                           // ❌ IIFE not expected
  await page.goto('...');
})();
```

## What's available inside the script

### ✅ Available
- `page` — the Playwright Page object for the current browser session
- All Playwright Page methods: `goto`, `click`, `getByRole`, `evaluate`, `screenshot`, `screencast`, etc.
- All Playwright Locator methods
- `setTimeout`, `Promise`, standard browser/JS APIs
- You can define local `const` and helper functions INSIDE the function body

### ❌ Not available
- `require()` — Node module system not available
- `import` / `export` — ES modules not supported
- `process`, `fs`, `path` — Node APIs not in scope
- Top-level code or statements outside the async function

## Working around the no-`require` limitation

To use Node APIs or include external data, **bake the data into the script at generation time** before calling `run-code`:

### Example: inject file contents as constants

```bash
# Read the file in bash, generate a JS constant, prepend to hero script
node -e "
const svg = require('fs').readFileSync('./cursor.svg', 'utf-8');
const b64 = Buffer.from(svg).toString('base64');
console.log('const CURSOR_DATA_URL = \"data:image/svg+xml;base64,' + b64 + '\";');
" > /tmp/const.js

# Prepend inside the async function body
sed "s|async page => {|async page => {\n$(cat /tmp/const.js)|" \
  hero-script.template.js > hero-script.js

playwright-cli run-code --filename=hero-script.js
```

Or just write the hero script in one pass with constants inlined:

```js
async page => {
  const CURSOR_DATA_URL = 'data:image/svg+xml;base64,PD94bWw...'; // baked at generation

  await page.addStyleTag({ content: `
    .cursor { background: url(${CURSOR_DATA_URL}); }
  `});
  // ... rest of script
}
```

## Error handling

`run-code` prints the script's stdout to its output. If the script throws, you'll see a stack trace:

```bash
playwright-cli run-code --filename=./hero.js 2>&1 | tail -20
```

Common errors:
- `ReferenceError: require is not defined` — you tried to use Node's `require`
- `Unexpected token 'const'` — you have top-level code outside the async function
- `TypeError: Cannot read properties of null` — an element wasn't found; check your locators
- `TimeoutError: locator.click: Timeout` — an overlay is intercepting; dismiss popups first

## Tracking data between run-code calls

⚠️ **`console.log` inside `run-code` does NOT appear in stdout.** The output only contains the script source and the return value. Do NOT use `console.log` to emit data.

Instead, store data on `window` and extract with a second `run-code` call:

```js
// hero-script.js — stores actions on window
async page => {
  const actions = [];
  const T0 = Date.now();
  const track = (type, description, target) => {
    actions.push({ type, description, target, t: +((Date.now() - T0) / 1000).toFixed(2) });
  };

  track('narrate', 'Recording starts');
  await page.goto('https://example.com');
  track('click', 'Click submit');
  await page.click('button[type="submit"]');

  // Save to window for extraction
  await page.evaluate((a) => { window.__vorec_actions = a; }, actions);
}
```

Then extract with a second call:
```bash
playwright-cli run-code "async page => JSON.stringify(await page.evaluate(() => window.__vorec_actions || []))"
```

The return value of the async arrow function IS printed to stdout. Use this to capture structured data from hero scripts. See [./hero-script.md](./hero-script.md) for the full extraction pipeline.

## Browser session persistence

`run-code` runs in the **currently open browser session**. If you close the browser (`close-all`) and run-code again, it fails — you need to reopen first:

```bash
playwright-cli close-all
playwright-cli open https://target.com    # open with the target URL
playwright-cli run-code --filename=hero.js # runs on the already-open page
```

## Related files

- [./cli-commands.md](./cli-commands.md) — Core commands
- [./cli-video.md](./cli-video.md) — Video recording API
- [./hero-script.md](./hero-script.md) — Canonical hero script template
