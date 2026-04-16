---
name: validation-and-test-data
description: How to analyze validation rules and generate valid test data
---

# Validation & Test Data

## Analyze before choosing test data

Read frontend AND backend code to understand:

- **Form validation** — email format? Min password length? Required fields?
- **API validation** — what does the backend reject? Check routes, validators, middleware
- **Database constraints** — unique email? Enum values? Foreign keys?
- **Error states** — what happens on invalid input?

## Generate valid data

- Email → realistic, passes regex (e.g., `sarah.demo@gmail.com`)
- Password → meets all rules (e.g., `DemoPass2026!` if min 8 + special char required)
- Unique fields → check if test data already exists
- Dropdowns → read actual option values from code

**Never use placeholder data.** The recording should look professional.

## Error recovery during dry-run

When an action produces a visible error during exploration or dry-run, fix it there and update `flow-notes.md`. The final recording should replay the known-good path. Only include an error-and-fix sequence in the final video if the user explicitly asked for a troubleshooting tutorial.

```javascript
await actionElement.click();
await page.waitForTimeout(1000);

const errorEl = page.locator('.error, [role="alert"], .toast-error, [class*="error"]');
if (await errorEl.count() > 0 && await errorEl.first().isVisible()) {
  const errorText = await errorEl.first().textContent();
  console.log(`Error detected: ${errorText}`);

  const narration = "An error appeared. Fix the highlighted field before continuing.";
  track('narrate', 'Validation error', 'Show validation error', 'validation-error', null, {
    context: `An error message appeared: "${errorText}". The next action should fix the invalid input.`,
    narration,
    pause: pauseFor(narration),
  });
  await page.waitForTimeout(2000); // Let viewer see the error

  // RECOVER: fix the input and retry
}
```

## When to stop vs recover

- **Recover during dry-run**: validation errors, wrong format, missing fields — learn the valid path before recording
- **Stop and re-record final videos**: wrong selector, page crash, auth expired, or unexpected validation errors
- **Keep the error in the final video only when requested**: troubleshooting flows where the error is the lesson
