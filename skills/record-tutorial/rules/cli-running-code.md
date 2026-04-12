---
name: playwright-cli-running-code
description: Running inline scripts via playwright-cli run-code for page exploration
---

# playwright-cli — Running Code

`playwright-cli run-code` executes JavaScript inside the current browser session. Use it in **Explore mode** to inspect pages, test selectors, and discover elements before writing the recording script.

**Note:** The recording script itself is a standalone Node.js file (`hero-script.mjs`) — NOT a `run-code` function. See [./hero-script.md](./hero-script.md).

## Basic usage

```bash
# Open a browser first
playwright-cli open https://example.com

# Run inline code
playwright-cli run-code "async page => { return await page.title(); }"

# Run a .js file
playwright-cli run-code --filename=./inspect.js
```

## Common exploration tasks

### Check if an element exists
```bash
playwright-cli run-code "async page => {
  const btn = page.getByRole('button', { name: 'Sign Up' });
  return await btn.count();
}"
```

### Get all form fields
```bash
playwright-cli run-code "async page => {
  const inputs = await page.locator('input, select, textarea').all();
  const fields = [];
  for (const el of inputs) {
    fields.push({
      tag: await el.evaluate(e => e.tagName),
      type: await el.getAttribute('type'),
      placeholder: await el.getAttribute('placeholder'),
      name: await el.getAttribute('name'),
    });
  }
  return JSON.stringify(fields, null, 2);
}"
```

### Check if page requires login
```bash
playwright-cli run-code "async page => {
  const loginForm = await page.locator('form[action*=login], input[type=password]').count();
  return loginForm > 0 ? 'LOGIN REQUIRED' : 'PUBLIC PAGE';
}"
```

## Script shape

Must be a single async arrow function with `page` argument:

```js
// ✅ CORRECT
async page => {
  return await page.title();
}

// ❌ WRONG — no imports, no top-level code
import { chromium } from 'playwright';
```

## Limitations

- No `require()`, `import`, `fs`, `process` — browser sandbox only
- `console.log` does NOT appear in stdout — use `return` for output
- For anything needing Node APIs, write a standalone `.mjs` script instead

## Related files

- [./cli-commands.md](./cli-commands.md) — Core commands (open, click, snapshot)
- [./hero-script.md](./hero-script.md) — Recording script template (standalone Node.js)
