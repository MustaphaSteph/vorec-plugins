---
name: troubleshooting
description: Common errors and fixes for recording tutorials
---

# Troubleshooting

Run `npx @vorec/cli check` first — it surfaces most issues in one command.

## App / CLI prerequisites

| Error | Fix |
|-------|-----|
| `Vorec Recorder app is not running` | Install from https://vorec.ai/download, open the app (it's a menubar icon) |
| `Vorec Recorder is not signed in` | Click the Vorec icon in the macOS menubar → sign in with magic link or password |
| `Screen Recording permission not granted` | Open the app → Settings → Permissions → Grant Screen Recording |
| `cliclick not found` | `brew install cliclick` — without it the mouse cursor won't be visible in recordings |
| `Vorec API key missing` | `npx @vorec/cli login` (or `npx @vorec/cli init`) |
| Insufficient credits | Check balance in the app or at vorec.ai/settings, upgrade or buy a pack |
| Project limit reached | Delete old projects at vorec.ai/dashboard, or upgrade plan |

## Recording failures

| Error | Fix |
|-------|-----|
| Chromium window not found | Make sure the browser actually launched; the CLI diffs the window list before/after launch to locate it |
| Recording file is empty (0 bytes) | The target window was hidden/minimized during capture — make sure the Chromium window stays visible |
| Recording under 10 seconds | Min length is 10s. Add more actions or increase delays in the manifest |
| Cursor not visible in video | Install cliclick (above). If installed, grant Terminal (or whatever shell ran `vorec run`) access in System Settings → Privacy → Accessibility |

## Manifest selector issues

The manifest takes Playwright selector strings (not JS helpers). Good patterns:

| Goal | Selector |
|------|----------|
| Button by label | `"text=Create account"` |
| Role-based | `"role=button[name='Create']"` |
| Input by placeholder | `"[placeholder='you@example.com']"` |
| CSS | `"button.primary"`, `"input[name=email]"` |
| Disambiguate | `"css=.modal >> text=Save"` |

If a selector times out:
- Add a `wait` action before it so the page has time to render
- Check for cookie banners or overlays that may be covering the element (add an earlier click to dismiss them)
- In Explore mode, re-run `playwright-cli --raw snapshot` to find the current selector

## Page load / timing

| Error | Fix |
|-------|-----|
| Page hangs on load | Change `waitStrategy` in manifest — avoid `networkidle` for SPAs with WebSockets; try `load` or `domcontentloaded` |
| Element not visible yet | Insert a `{ "type": "wait", "delay": 1500 }` action before the click |
| Cookie banner blocks clicks | Dismiss it as the first action: `{ "type": "click", "selector": "role=button[name='Accept']", "description": "Dismiss cookies" }` |

## Upload / analysis

| Error | Fix |
|-------|-----|
| Upload failed | Re-run — the app retries automatically. If persistent, check `vorec check` for credits |
| `analyze-video-v2` error | The video reached Vorec but analysis failed. Open the editor URL and retry analysis there |
| Timed out waiting for analysis | Analysis sometimes takes 2+ minutes. The CLI prints the editor URL anyway — open it and wait |

## Validation issues

If `vorec run` succeeds but the resulting video shows validation errors / disabled buttons / failure states, the manifest used bad test data. Load [./validation.md](./validation.md) for how to read validators and produce good data.
