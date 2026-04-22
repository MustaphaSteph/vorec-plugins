---
name: explore-mode
description: Explore mode — discovering a live page without source code access
---

# Explore Mode

Use this mode when you **don't have the source code**. The agent has to discover the page at runtime using `playwright-cli snapshot` and semantic locators. It's slower than Connected mode because exploration costs tokens, but it works on any URL.

## MANDATORY: Full dry-run BEFORE writing any script

**Walk the entire flow end-to-end using playwright-cli FIRST.** Every page, every form, every click — manually verify each step works before writing `vorec.json`.

**Why:** If you discover validation rules, required fields, hidden dialogs, or unexpected page transitions during recording, the recording is already broken. Discover them during exploration when you can test freely.

During the dry-run, document for each step:
- **Selectors that work** — `getByRole`, `getByLabel`, `getByPlaceholder` (not CSS)
- **Valid input data** — what formats pass validation (emails, phone numbers, passwords)
- **Required fields** — what triggers "required" errors
- **Unexpected dialogs/modals** — welcome popups, cookie banners, profile setup
- **Success states** — what text/element appears after each successful action
- **Gotchas** — disabled buttons, rate limits, rapid-click blocks, timing issues
- **State carryover** — what gets saved to session/local storage between steps

**Keep these findings in your conversation context** — you'll reference them when writing `vorec.json` in the same session. Do NOT write them to disk: nothing automated reads them and serializing costs tokens without benefit.

**If you hit a validation error during the dry-run, fix it THERE** — find the valid input, find the missing step, find the required field. Don't leave it for the recording.

**Don't skip the dry-run** even if the flow seems obvious. "Obvious" flows still have surprises: hidden tooltips that block clicks, toggle buttons that need a second click, validation on blur, dialogs that appear only on first visit.

For live external websites, also load [./live-site-discovery.md](./live-site-discovery.md) for the safety checklist (blockers, sensitive actions). The `vorec.json` you produce must be based on verified discovery, not guesses.


## When to use Explore mode

- Third-party sites (signing up on vorec.ai, buying on Amazon, using Stripe dashboard)
- Competitor demos or public how-to videos
- Recording a SaaS tool where you have no code access
- Deployed versions of your own site if you don't want to bring up the dev server

## The exploration workflow

### Step 1 — Open the target URL directly

**Never `about:blank`** — it creates a white start frame. Open the target URL so the recording starts with real content.

```bash
playwright-cli close-all
playwright-cli open https://target-site.com/the-page
playwright-cli resize 1920 1080
```

### Step 2 — Take a snapshot to find refs

```bash
playwright-cli --raw snapshot | grep -E "relevant|keywords|here"
```

The snapshot is an accessibility tree. Each interactive element has a `ref=eXX` you can use with other `playwright-cli` commands. Or — better — use the `name` attribute with Playwright's semantic locators in your vorec script.

**Filter the snapshot aggressively.** The full snapshot is huge. Always grep for what you need:
```bash
# Looking for a signup form
playwright-cli --raw snapshot | grep -iE "email|password|sign ?up|create.*account"

# Looking for a product price/button
playwright-cli --raw snapshot | grep -iE "add.*cart|buy|price|\$|€"
```

### Step 3 — Prefer semantic locators over refs

Refs change per page state. Semantic locators are stable:

```js
// BEST — semantic, works across page states
page.getByRole('button', { name: 'Create account' })
page.getByPlaceholder('you@gmail.com')
page.getByLabel('Email')
page.getByText('Sign up for free')

// OK — refs from the snapshot (but can change)
// Only use if semantic locators don't disambiguate
```

### Step 4 — Handle ambiguous matches

If `getByRole('link', { name: 'Premium Plan' })` matches BOTH the product option AND a cart sidebar line, disambiguate:

```js
// Use exact match
page.getByRole('link', { name: 'Premium Plan', exact: true })

// Or scope to a container
page.locator('.product-variations').getByRole('link', { name: 'Premium Plan' })

// Or use .first()
page.getByRole('link', { name: 'Premium Plan' }).first()
```

### Step 5 — E-commerce gotcha: empty-state hides elements

Some buttons only appear after user action. Example: "Checkout" button is hidden when the cart is empty. If you try to snapshot before adding an item, the ref won't exist.

**Fix:** do a manual exploration pass first — add an item, then snapshot the populated page:
```bash
# Add an item by clicking through
playwright-cli open https://shop.example.com/product/x
playwright-cli click e42   # add to cart button
# Now snapshot the cart to find checkout ref
playwright-cli --raw snapshot | grep -iE "checkout|valider"
```

### Step 6 — Success state detection

Without source code, you have to observe what the success state looks like. Do a dry run first:
1. Manually click through the flow via playwright-cli commands
2. Watch what element appears on success (heading text, URL change, toast message)
3. Use that element as your `waitFor` in the vorec script

**Examples:**
```js
// URL-based detection
await page.waitForURL('**/success', { timeout: 15000 });

// Heading-based detection
await page.getByRole('heading', { name: 'Order confirmed' }).waitFor({ timeout: 15000 });

// Toast/notification
await page.getByText(/added to cart|added successfully/i).waitFor({ timeout: 5000 });
```

### Step 7 — Ask the user when stuck

The user knows the flow. If you're unsure about a step, ask:

> *"I see a 'Continue' button and a 'Next' button on this page. Which one proceeds to payment?"*

> *"After clicking submit, the page shows a success message. What's the exact text so I can wait for it?"*

> *"The cart has 3 items from a previous session. Should I clear them before recording, or leave them?"*

## Semantic locator cheat sheet for common flows

| Flow | Locator pattern |
|---|---|
| Signup email | `getByPlaceholder(/email|you@|example\.com/i)` or `getByLabel('Email')` |
| Signup password | `getByPlaceholder(/password|8 characters/i)` or `getByLabel('Password')` |
| Submit button | `getByRole('button', { name: /create|sign ?up|continue|submit/i })` |
| Login button | `getByRole('button', { name: /log ?in|sign ?in/i })` |
| Add to cart | `getByRole('button', { name: /add to cart|ajouter au panier|agregar|in den warenkorb/i })` |
| Checkout button | `getByRole('link', { name: /checkout|valider|proceed to pay|purchase/i })` |
| Search box | `getByRole('searchbox')` or `getByPlaceholder(/search/i)` |
| Close modal/popup | `getByRole('button', { name: /close|×|dismiss/i })` |
| Cookie accept | `getByRole('button', { name: /accept|agree|got it|ok/i })` |

## Dismissing cookie banners + popups

Most sites have cookie banners that intercept clicks. Check for them early:

```js
// In your vorec script
const cookieBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"]');
if (await cookieBanner.count() > 0) {
  const accept = cookieBanner.getByRole('button', { name: /accept|agree|ok|got it/i });
  if (await accept.count() > 0) await accept.first().click();
  await page.waitForTimeout(500);
}
```

## Unique test data per run

For signup flows, use a unique email per run so you don't hit "email already registered" errors. Since you don't know the validation rules (no code), use a timestamp-based unique suffix:

```js
// Timestamp digits (most sites accept this even if they normalize dots/+)
const unique = Date.now().toString().slice(-6);
const testEmail = `tutorial.${unique}@gmail.com`;

// Or for Gmail: dots don't count, so use digits
const gmailEmail = `tutorial${unique}@gmail.com`;
```

## After exploration → write the vorec script

Once you have:
- The list of elements you need to click/type into
- Semantic locators for each
- The success state to wait for
- Any overlays/popups to dismiss first

You're ready to write the vorec script. See the manifest section in [../SKILL.md](../SKILL.md) for the schema and action types.

## Both modes converge

Explore mode ends at the same place as Connected mode: write `vorec.json`, run `npx @vorec/cli run vorec.json`, the Vorec Recorder app captures + uploads. Return to the main `SKILL.md` when you're done exploring.
