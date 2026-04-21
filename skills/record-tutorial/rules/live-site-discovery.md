---
name: live-site-discovery
description: How to build a live-site map for unknown websites before recording
---

# Live Site Discovery

Use this for Explore mode on external websites. The agent has no source code, so it must build a map from the live page before recording.

## Core Rule

Do not write `vorec.json` for a live website task until `.vorec/<slug>/live-site-map.json` proves:
- The entry action is known
- Required fields are known or explicitly marked unknown
- Valid demo values are known for every field the script fills
- Primary buttons are known
- Success state is known
- Blockers and sensitive actions are reviewed

The agent should not "understand" an unknown site from memory. It should inspect the page tree, DOM, validation attributes, screenshots, and dry-run results.

## What the Agent Can Inspect

### Accessibility Tree

Use first. It reveals the semantic page tree: headings, buttons, links, inputs, labels, dialogs, tabs, and disabled states.

```bash
playwright-cli --raw snapshot > .vorec/<slug>/snapshot-home.txt
playwright-cli --raw snapshot | grep -iE "create|tournament|start|next|submit|save|player|court|round"
```

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
        ariaDescribedBy: el.getAttribute('aria-describedby'),
        required: el.hasAttribute('required'),
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        min: el.getAttribute('min'),
        max: el.getAttribute('max'),
        minLength: el.getAttribute('minlength'),
        maxLength: el.getAttribute('maxlength'),
        pattern: el.getAttribute('pattern'),
      };
    })
  );
}"
```

### Validation Discovery

During dry-run, learn rules safely:
- Click Next/Create with empty fields only if it does not submit a destructive/sensitive action
- Fill one field at a time and watch disabled buttons become enabled
- Blur fields to reveal validation messages
- Try safe invalid values for obvious constraints, such as `1` for a player count
- Capture visible validation text and associate it with the field

Never spam backend submissions. Stop before payment, booking, publishing, email sends, invitations, deletes, or billing changes unless the user explicitly approves.

### Network and Storage

Use only when needed:
- Inspect API errors if a safe dry-run submit fails
- Check local/session storage for language, draft state, onboarding flags, or auth state
- Do not store secrets in notes or maps

## Required Output

Save `.vorec/<slug>/live-site-map.json`. Follow [../../../schemas/live-site-map.schema.json](../../../schemas/live-site-map.schema.json).

Minimum shape:

```json
{
  "url": "https://example.com",
  "recording_type": "task_tutorial",
  "goal": "Create a tournament",
  "auth": {
    "required": false,
    "evidence": "Creation page is visible without a login redirect"
  },
  "pages": [],
  "blockers": [],
  "sensitive_actions": [],
  "readiness": {
    "entry_action_known": true,
    "required_fields_known": true,
    "valid_demo_values_known": true,
    "primary_buttons_known": true,
    "success_state_known": true,
    "blockers_reviewed": true,
    "sensitive_actions_reviewed": true
  }
}
```

## Page Map Requirements

For every meaningful page or modal, capture:
- URL or route
- Purpose
- Headings
- Candidate actions
- Fields and validation attributes
- Primary buttons
- Button enabled/disabled conditions
- Success state or transition
- Risks

Mark unknowns explicitly. Unknown is better than invented.

```json
{
  "label": "Ranking level",
  "required": "unknown",
  "valid_demo_value": "Intermediate",
  "evidence": "Selected during dry-run; no validation error appeared"
}
```

## Pre-Recording Gate

Before building `vorec.json`, read the map and ask:
- Is there a known entry action?
- Do all scripted fields have valid demo values?
- Is every primary action followed by an observable assertion?
- Is the final success state specific enough to wait for?
- Are blockers like cookies, modals, auth, locale, and sticky headers handled?
- Are sensitive actions either avoided or explicitly approved?

If any answer is no, continue discovery instead of recording.
