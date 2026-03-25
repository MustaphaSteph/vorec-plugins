---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

Record a screen session and submit it to Vorec, which generates narrated tutorial videos automatically.

**Your role:** Record the video with valid test data, verify every action succeeds, and track what happens.
**Vorec's role:** Turn it into a narrated tutorial.

## Before You Start

```bash
# 1. Playwright
npm install playwright && npx playwright install chromium

# 2. FFmpeg
ffmpeg -version || echo "Install: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"

# 3. Vorec CLI
npx @vorec/cli@latest --version

# 4. API key
cat ~/.vorec/config.json 2>/dev/null || echo "Not configured"
# If not configured: npx @vorec/cli@latest init
# NEVER write ~/.vorec/config.json directly.
```

## Step-by-Step

### 1. Check User's Plan & Credits

**Before doing any work**, check if the user can afford this. Ask:

> Before I start, can you confirm you have credits available? Video analysis costs 10 credits. You can check in Settings → Usage.

If the user is on a free plan (3 projects max, 50 credits), warn them early.

### 2. Understand What to Record

Ask:

> 1. **What's the goal?** What should the viewer learn?
> 2. **Who's watching?** New users, developers, or customers?
> 3. **Anything to explain?** Features or concepts that need context?

### 3. Analyze the Code for Valid Test Data

**Critical step.** Before writing anything, read frontend AND backend to understand:

- **Form validation** — email format? Min password length? Required fields?
- **API validation** — what does the backend reject? Check routes, validators, middleware
- **Database constraints** — unique email? Enum values? Foreign keys?
- **Error states** — what happens on invalid input?

Generate **valid test data** that passes all validation:
- Email → realistic, passes regex (e.g., `demo.user@example.com`)
- Password → meets all rules (e.g., `DemoPass2026!` if min 8 + special char required)
- Unique fields → check if test data already exists in DB
- Dropdowns → read actual option values from code

**Never use placeholder data.** The recording should look professional.

### 4. Find App URL

Read project config — never assume ports. Check `package.json`, `vite.config`, `.env`.

### 5. Research Selectors

**Never guess.** Verify in source code.
Priority: `data-testid` → `:has-text()` → `[href]` → `#id` → `[name]` → `.class`

### 6. Handle Authentication

If auth needed: write `save-session.mjs`, user logs in manually, `waitForURL` saves session.
**Never ask for passwords.**

### 7. Ask Preferences

> 1. **What language?** (default: English)
> 2. **What style?** Tutorial / Professional / Conversational / Storytelling / Concise / Exact

### 8. Write the Recording Script

**Do NOT use `vorec run` for recording.** Write a standalone Playwright script so you have full control over error handling and recovery.

The script must:
1. Launch visible browser with video recording
2. Load storageState if auth needed
3. Execute each action and **check for errors after each step**
4. If an error appears on screen, **recover inside the recording** — don't stop
5. Track coordinates + timestamps
6. Convert webm → mp4 via FFmpeg
7. Save video + tracked actions JSON

**Error recovery pattern — keep recording, fix the mistake on screen:**

When an action produces a visible error (validation message, toast, red border), the recording should show the error AND the fix. This makes the tutorial more useful — viewers learn how to handle real mistakes.

```javascript
// General pattern: try → check → recover if needed
await actionElement.click();
await page.waitForTimeout(1000);

// Check if an error appeared
const errorEl = page.locator('.error, [role="alert"], .toast-error, [class*="error"]');
if (await errorEl.count() > 0 && await errorEl.first().isVisible()) {
  const errorText = await errorEl.first().textContent();
  console.log(`  ⚠ Error detected: ${errorText}`);

  // Track the error as a narrate action — Vorec will explain it
  track('narrate', '', null,
    'Error appeared',
    `An error message appeared: "${errorText}". This is a common mistake — let me show the correct way.`
  );
  await page.waitForTimeout(2000); // Let viewer see the error

  // RECOVER: fix the input and retry
  // Clear the field, type correct value, resubmit
  // ... (specific recovery depends on the error)
}
```

**When to stop vs recover:**
- **Recover in recording** (preferred): validation errors, wrong format, missing fields — these teach the viewer something useful
- **Stop and re-record**: wrong selector, page crash, auth expired, app bug — these are recording problems, not tutorial content

**If you must stop**, close the browser cleanly and report what went wrong:
```javascript
console.error('FATAL: Cannot recover from this error. Re-record needed.');
await page.close(); await context.close(); await browser.close();
process.exit(1);
```
```

### 9. Record and Verify

```bash
node record-tutorial.mjs
```

If it fails → fix the issue (wrong data, bad selector, validation error) → re-run.

After success, tell the user:

> Recording saved ([duration]s, [count] actions). Please review the video.
> If it looks good, I'll upload to Vorec (costs 10 credits). Should I proceed?

**Wait for confirmation.** A bad recording wastes credits.

### 10. Upload to Vorec

Once confirmed:

```bash
npx @vorec/cli@latest run vorec.json --skip-record --video <VIDEO_PATH> --tracked-actions .vorec/tracked-actions.json
```

With a minimal `vorec.json`:

```json
{
  "title": "<TITLE>",
  "url": "<APP_URL>",
  "language": "en",
  "narrationStyle": "tutorial",
  "videoContext": "<DESCRIPTION>"
}
```

### 11. Share the Result

Share the editor URL. User previews narration and generates audio there.

## Action Reference

Every action needs `description` (timeline label) and `context` (rich scene description).

| Type | Fields | What It Does |
|------|--------|-------------|
| `narrate` | `description`, `context`, `delay` | Pause — describe scene |
| `click` | `selector`, `description` | Click |
| `type` | `selector`, `text`, `description` | Type text |
| `select` | `selector`, `value`, `description` | Select dropdown |
| `hover` | `selector`, `description` | Hover to highlight |
| `scroll` | `description` | Scroll down |
| `wait` | `delay` (ms) | Pause |
| `navigate` | `text` (URL), `description` | Navigate |

## Key Rules

1. **Check credits first** — run `npx @vorec/cli check` before starting
2. **Analyze validation before choosing test data** — read frontend + backend + DB
3. **Verify every action** — check for errors after each step
4. **Recover from errors in the recording** — show the mistake and the fix. This teaches viewers.
5. **Only stop for unrecoverable errors** — wrong selector, crash, auth expired
6. **User validates video** before upload — saves credits on bad recordings
7. **Realistic data** — professional-looking, not `test123@test.com`
8. **Never ask for passwords**
9. Use `narrate` only when it adds value

## Troubleshooting

| Error | Fix |
|-------|-----|
| Validation failed | Read validation code, fix test data |
| Selector timeout | Verify in source, add `wait` before |
| Submission error | Check API/backend validation rules |
| Project limit | Delete projects or upgrade plan |
| Insufficient credits | Buy credits or wait for monthly reset |
| Recording too short | Min 10 seconds. Add delays. |
