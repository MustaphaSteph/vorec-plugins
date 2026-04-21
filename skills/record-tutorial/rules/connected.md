---
name: connected-mode
description: Connected mode — using codebase knowledge to drive recording
---

# Connected Mode

Use this mode when you have the project's source code in front of you. Read the components to know exactly what to click and when to wait — no runtime exploration needed.

## Deep-scan the codebase

**This is your main advantage over Explore mode.** Before writing the `vorec.json` manifest, analyze the project.

### Project structure
- Read `package.json` — framework, dependencies, scripts, dev server port
- Read the router/App file — all routes, guards, redirects
- Read `.env` or config files — API URLs, feature flags

### For the specific flow being recorded
- **Page component** — what renders, what's interactive, the JSX structure
- **Form components** — field names, types, placeholders, labels, autoComplete attributes
- **Validation logic** — frontend validators, regex patterns, required fields, min/max lengths, password strength rules, disposable domain blocks, gmail normalization
- **API routes/handlers** — what the backend accepts/rejects
- **DB schema/models** — unique constraints, enums, required columns
- **Auth guards** — which routes need login, where login redirects to
- **Success states** — what the component renders on success (headings, icons, redirects)

### What to extract
- **Exact selectors**: `data-testid`, element IDs, names, placeholders, button text, `href` values
- **Valid test data** that passes ALL validation (frontend + backend + DB)
- **Expected results** after each action (URL change, toast, modal, redirect)
- **Wait conditions** (loading states, API calls, animations)
- **Success DOM state** to `waitFor` (e.g. `getByRole('heading', { name: 'Check your email' })`)
- **Error states** and how to recover from them

## Example: signup page analysis

Reading `src/components/auth/SignupPage.tsx` in one of our own projects tells you everything:

```tsx
<input type="email" placeholder="you@example.com" autoComplete="email" />
<input type="password" placeholder="Min. 8 characters" autoComplete="new-password" />
<input type="password" placeholder="Repeat your password" autoComplete="new-password" />
<button type="submit">Create account</button>

// On success:
<h2>Check your email</h2>
```

And the validation:
```tsx
if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
if (password !== confirmPassword) { setError('Passwords do not match'); return; }
// Gmail normalization: dots and +suffix are stripped
```

From this you know:
- Exact placeholders for `getByPlaceholder()` — no guessing
- Exact button text for `getByRole('button', { name: 'Create account' })`
- Exact success state to `waitFor(getByRole('heading', { name: 'Check your email' }))`
- Valid password: `StrongPass2026!` (12 chars + upper + digit + special = Strong)
- Unique email per run: use digits in local-part since Gmail strips dots and `+suffix`

## Writing the manifest

Once you have the selectors and validation rules, write `vorec.json` — see the manifest section in [../SKILL.md](../SKILL.md). Every selector comes from the source code — **no snapshots, no guessing**.

### The big win
- **Zero runtime exploration tokens** — no `playwright-cli snapshot` needed
- **Deterministic recording** — same selectors every run
- **Exact wait conditions** — `waitFor` specific DOM state, not fixed timeouts
- **Valid test data** on first try — passes validation because you read the validators

## When Connected mode is right

- Recording your own product's features
- Recording a teammate's PR for a code review video
- Recording a library/SDK demo where you have the source
- Recording a WordPress/Shopify site where you have the theme files

## When to switch to Explore mode

If any of these are true, switch to [./explore.md](./explore.md):
- You don't have the source code
- Third-party SaaS (Stripe, Gmail, any vendor tool)
- You have the code but it's heavily obfuscated (e.g., only a minified build)
- The app is rendered server-side and client selectors aren't in the code

## Both modes converge

After your manifest is written, Connected and Explore follow the same steps:
1. Run `npx @vorec/cli run vorec.json`
2. The Vorec Recorder app captures + uploads automatically
3. CLI triggers analysis and prints the editor URL
