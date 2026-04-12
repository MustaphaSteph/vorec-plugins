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

## Error recovery during recording

When an action produces a visible error, **keep recording** — show the error AND the fix:

```javascript
await actionElement.click();
await page.waitForTimeout(1000);

const errorEl = page.locator('.error, [role="alert"], .toast-error, [class*="error"]');
if (await errorEl.count() > 0 && await errorEl.first().isVisible()) {
  const errorText = await errorEl.first().textContent();
  console.log(`  ⚠ Error detected: ${errorText}`);

  // Track as narrate — Vorec will explain the error
  track('narrate', '', null,
    'Error appeared',
    `An error message appeared: "${errorText}". Let me fix this.`
  );
  await page.waitForTimeout(2000); // Let viewer see the error

  // RECOVER: fix the input and retry
}
```

## When to stop vs recover

- **Recover in recording** (preferred): validation errors, wrong format, missing fields — teaches viewers
- **Stop and re-record**: wrong selector, page crash, auth expired — recording problems
