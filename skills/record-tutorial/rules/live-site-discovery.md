---
name: live-site-discovery
description: Safety + thoroughness checklist for discovering an unknown live website before recording
---

# Live Site Discovery

Use this for Explore mode on external websites. The agent has no source code, so it must discover the page at runtime before recording — but it must do so **safely** (no real-world side effects) and **thoroughly** (no surprises during recording).

**All discovery findings stay in your conversation context.** Do NOT write `live-site-map.json`, `flow-notes.md`, or any other discovery file. The CLI, backend, and app never read them — serializing wastes tokens.

## Core Rule

Do not write `vorec.json` for a live website task until you can truthfully answer YES to every readiness question in the "Pre-Recording Gate" below. You don't write the checklist to a file — you mentally satisfy each item, then include the summary in the discovery report you show the user.

The agent should not "understand" an unknown site from memory. It must inspect the page tree, DOM, validation attributes, and dry-run results.

## What the Agent Can Inspect

### Accessibility Tree

Use first. It reveals the semantic page tree: headings, buttons, links, inputs, labels, dialogs, tabs, and disabled states.

```bash
playwright-cli --raw snapshot
playwright-cli --raw snapshot | grep -iE "<keywords relevant to the flow>"
```

Pipe to `grep` when you're looking for specific elements — don't save the whole snapshot to disk.

### DOM Field Inventory

Use after the snapshot to discover validation hints that the accessibility tree may omit.

```bash
playwright-cli run-code "async page => {
  return await page.locator('input, textarea, select, button').evaluateAll((els) =>
    els.map((el) => {
      const label = el.id
        ? document.querySelector(\`label[for=\"\${CSS.escape(el.id)}\"]\`)?.innerText
        : '';
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.id,
        label,
        text: el.innerText || el.value || '',
        placeholder: el.getAttribute('placeholder'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaRequired: el.getAttribute('aria-required'),
        ariaInvalid: el.getAttribute('aria-invalid'),
        required: el.hasAttribute('required'),
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        pattern: el.getAttribute('pattern'),
      };
    })
  );
}"
```

Read the output inline. Don't save the JSON.

### Always use the most specific selector available

Never use a partial text selector that could match multiple elements on the page. A short prefix like `button:has-text("<word>")` can match several buttons whose labels start with or contain that word — and Playwright picks the first one, not necessarily the right one.

Test every selector for uniqueness before using it in the manifest:

```js
const matches = await page.$$('<your selector>');
// If matches.length > 1 → make it more specific:
//   - use the full button label, not a prefix
//   - prefer role=X[name='Y'] over :has-text()
```

**When in doubt, prefer `role=X[name='Y']` over `:has-text()`.** Role+name selectors are unambiguous by ARIA spec; text matches are fuzzy by nature.

If a click doesn't produce the expected result (navigation didn't happen, modal didn't open, form didn't submit) → the WRONG element was matched. Add a URL check or visible-element check after the action to confirm it hit the right target:

```js
await page.getByRole('button', { name: '<exact label>' }).click();
await page.waitForURL('**/<expected-path>/**', { timeout: 10000 });
```

Document every ambiguous selector you found during discovery — it's the most common cause of "agent clicked something but nothing happened" failures.

### Validation Discovery

During dry-run, learn rules safely:
- Click Next/Create with empty fields only if it does not submit a destructive/sensitive action
- Fill one field at a time and watch disabled buttons become enabled
- Blur fields to reveal validation messages
- Try safe invalid values for obvious constraints, such as `1` for a player count
- Capture visible validation text in your conversation — *"the email field shows 'invalid format' on blur when empty"*

**Never spam backend submissions.** Stop before payment, booking, publishing, email sends, invitations, deletes, or billing changes unless the user explicitly approves.

### Network and Storage

Use only when needed:
- Inspect API errors if a safe dry-run submit fails
- Check local/session storage for language, draft state, onboarding flags, or auth state
- Do not record secrets (tokens, cookies) in your notes

## What to track (mentally, not on disk)

For every meaningful page or modal you walk through, note:
- URL or route
- Purpose of the page
- The key headings + visible text you'd reference in narration
- Candidate actions (their selectors + what they did when clicked)
- Fields, labels, required state, valid demo values you found that passed validation
- Primary buttons
- Enabled/disabled conditions
- Success state or transition (URL pattern, visible element, success banner)
- Risks (sensitive actions, blockers, state carryover)

Mark unknowns explicitly in your conversation. Unknown is better than invented.

## Pre-Recording Gate — mental checklist

Before writing `vorec.json`, verify you can answer YES to all of these. If any answer is NO, continue discovery or ask the user ONE targeted question to resolve it.

- **Entry action known** — you can name the first click / field / URL the recording will start from
- **Required fields known** — for every field the script will fill, you know whether it's required
- **Valid demo values known** — you know what to type that passes validation for every scripted field
- **Primary buttons known** — you've identified the hero action per page and what it looks/feels like
- **Success state known** — you can describe exactly how the flow ends (URL pattern + visible evidence)
- **Blockers reviewed** — cookie banners, onboarding popups, rate limits, locale / region gates, sticky headers all noted and handled
- **Sensitive actions reviewed** — payments, deletes, emails, invitations, publishes all either avoided or explicitly approved by the user

## Include in the discovery report to the user

The report you print before writing the manifest MUST include this one-line summary:

> **Blockers reviewed: yes. Sensitive actions reviewed: yes. Valid demo values ready for N fields. Success state verified.**

If you cannot truthfully say this, do not write the manifest.
