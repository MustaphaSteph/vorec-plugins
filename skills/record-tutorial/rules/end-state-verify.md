---
name: end-state-verify
description: How to handle errors during recording, verify end state, and recover
---

# Error Handling & End State Verification

A recording that ended in a broken state is worse than no recording. Before stopping the recording, prove the flow actually succeeded. When things go wrong, fail loudly and ask the user for help — don't silently ship a broken video.

## Mandatory checks before stopping recording

### 1. Read the screen — don't just trust your script

Take a final snapshot. Scan for any element whose text, role, class, or attribute signals failure:
- `role="alert"`, `aria-invalid="true"`
- Classes containing `error|invalid|warning|danger|failed`
- Visible text matching `/error|invalid|required|fix|issue|must|failed/i`

If any exist, the flow did NOT succeed.

### 2. A disabled primary action is a validation signal — never a workaround target

If the button you planned to click is disabled (`disabled`, `aria-disabled`, `pointer-events: none`), the app is telling you the state is invalid.

**STOP.** Read the nearby validation messages. Fix the root cause in your script (wrong count, missing field, bad selection, skipped step).

**Never** "skip the click and narrate around it."

### 3. Never assume a side effect is inert

Any save/submit/confirm may create records, change counters, or pre-fill the next step. After each such action, re-read the next screen before continuing (counters, list length, selected state).

### 4. Fail loudly, not quietly

If a pre-close check fails, `throw` with a clear message. Do not downgrade to a narration or silently continue. A broken script the agent can fix beats a broken video the user has to catch.

## The assertion pattern

```js
async function assertHealthyEndState(page) {
  const alerts = await page.locator('[role="alert"], [aria-invalid="true"]').count();
  const errorText = await page.getByText(/error|invalid|required|fix|must|failed/i).count();
  if (alerts > 0 || errorText > 0) {
    throw new Error('End state shows validation errors — fix the flow, do not ship this recording.');
  }
}

// Run this (or an equivalent check appropriate to the app) immediately
// before stopping the recording. No exceptions.
await assertHealthyEndState(page);
```

## When the script fails mid-recording

If the script throws or an action fails:

1. **Stop the script immediately** — don't try to continue past a broken state
2. **TAKE A SCREENSHOT** of the current page — this is how you SEE what went wrong. Never guess based on selectors or text alone.
3. **Read the screenshot + snapshot** — look for error messages, disabled buttons, missing elements, unexpected UI state
4. **Diagnose the root cause:**
   - Wrong selector? Element changed? → update the locator
   - Validation error shown? → fix the input data (read the error text in the screenshot)
   - Missing step? → add the missing action before the failing one
   - Page crashed? → check if auth expired or network issue

### How to take a screenshot

**From playwright-cli (during exploration or debugging):**
```bash
playwright-cli screenshot .vorec/<slug>/debug-$(date +%s).png
```

**During a recording (on error):**
```js
try {
  // ... your flow ...
} catch (err) {
  await page.screenshot({ path: `${OUTPUT_DIR}/error-${Date.now()}.png`, fullPage: true });
  console.error(`Error: ${err.message}. Screenshot saved.`);
  throw err;
}
```

**Always take a screenshot before asking the user for help** — then include the path so they can see the same thing you see.

### Add try/catch wrapping to your script

Wrap each major step (or the whole flow) in try/catch that screenshots on failure:

```js
try {
  await glideClick(saveBtn, 'Save', 'Save the changes', 'save-btn', context, narration, pauseFor(narration));
} catch (err) {
  await page.screenshot({ path: `${OUTPUT_DIR}/error-save.png`, fullPage: true });
  throw new Error(`Save button click failed: ${err.message}. Screenshot: ${OUTPUT_DIR}/error-save.png`);
}
```

## When to ask the user for help

Ask the user when:
- You can't tell what went wrong from the snapshot
- The error message references something only the user knows (account state, billing, permissions)
- The UI behaves differently than expected and you're not sure why
- A selector that worked in exploration now fails — maybe the page has a different variant for the user

**How to ask:**

1. **First take a screenshot** of the current page
2. **Read the screenshot yourself** — often the error is visible and you can fix without asking
3. **Only if still stuck**, ask the user with the screenshot path included:

> I hit a problem during recording. Screenshot saved at `.vorec/<slug>/error-XXX.png`.
> The screen shows: [what you see in the screenshot].
>
> Can you tell me:
> - [specific question about what they expect to happen]
> - [anything else you need]
>
> Or I can rewrite the script to [alternative approach].

## When to rewrite the script

If you've tried to fix it and still fails, or if the flow needs a different approach entirely:

1. Tell the user clearly: "The current approach isn't working. I need to rewrite the script to [new approach]."
2. Explain what's changing and why
3. Wait for approval before rewriting
4. Delete the old recording attempt (if any) and start fresh

Don't accumulate fixes on top of a broken script — if it's not working, a clean rewrite is faster than patching.
