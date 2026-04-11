---
name: playwright-cli-session
description: Session management — named browsers, close-all, kill-all, persistent profiles
---

# playwright-cli — Session Management

`playwright-cli` supports multiple browser sessions that run concurrently and persist between commands. For Vorec recordings, you typically use the **default** session — but here's the full reference.

> Adapted from Microsoft's [playwright-cli session-management reference](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/references/session-management.md) (Apache 2.0).

## ⚠️ CRITICAL: Headed vs headless

**`playwright-cli open` defaults to HEADLESS.** The browser window is invisible — the user will not see it and cannot interact.

| Use case | Flag |
|---|---|
| User needs to see or interact (login, validation, session capture) | **`--headed`** (REQUIRED) |
| Automated recording with no user interaction | default (headless) is fine |
| Session capture for a login flow | **`--headed`** (REQUIRED) |
| Reconnaissance snapshot + grep | default (headless) is fine |
| When in doubt during setup | **`--headed`** |

```bash
# WRONG — user can't see the browser to log in
playwright-cli open https://vorec.ai/login

# RIGHT — browser window is visible
playwright-cli open --headed https://vorec.ai/login
```

**If you open for a user-interactive flow without `--headed`, the user will ask "I don't see anything".** Don't make them. Always use `--headed` when the user needs to do something in the browser.

## Default session (what Vorec uses)

Most Vorec recordings use the default session — no `-s` flag needed:

```bash
playwright-cli close-all                    # stop everything first
playwright-cli open https://target.com      # opens default session
playwright-cli resize 1920 1080
playwright-cli run-code --filename=hero.js
playwright-cli close                         # stop the default session
```

## Named sessions (for complex flows)

Use the `-s=name` flag to run multiple isolated browsers at once:

```bash
# Browser 1: authenticated user
playwright-cli -s=auth open https://app.example.com/login

# Browser 2: public browsing (separate cookies, separate storage)
playwright-cli -s=public open https://example.com

# Each session is isolated
playwright-cli -s=auth fill e1 "user@example.com"
playwright-cli -s=public snapshot
```

Each named session has independent:
- Cookies
- localStorage / sessionStorage
- IndexedDB
- Cache
- Open tabs

## Session commands

```bash
# List all running sessions
playwright-cli list

# Stop a specific session
playwright-cli close                    # default
playwright-cli -s=mysession close       # named

# Stop all sessions (MOST COMMON — start every recording with this)
playwright-cli close-all

# Force kill all browser processes (nuclear option)
playwright-cli kill-all

# Delete session user data
playwright-cli delete-data              # default
playwright-cli -s=mysession delete-data
```

## Persistent profiles

By default, sessions are in-memory — closing the browser loses cookies and storage. For flows that need auth to persist across runs:

```bash
# Save profile to auto-generated directory
playwright-cli open --persistent https://app.example.com

# Save profile to specific directory
playwright-cli open --profile=/path/to/profile https://app.example.com
```

**For Vorec recordings:** avoid persistent profiles unless you need cached auth. Fresh profile = clean state = deterministic recording.

## Environment variable for default session name

```bash
export PLAYWRIGHT_CLI_SESSION="recording"
playwright-cli open https://example.com  # uses "recording" session automatically
```

## Common patterns for Vorec

### Pattern 1 — Clean start (recommended for every recording)

```bash
playwright-cli close-all
playwright-cli open <TARGET_URL>
playwright-cli resize 1920 1080
playwright-cli run-code --filename=./hero-script.js
```

### Pattern 2 — Interactive reconnaissance (Explore mode)

```bash
playwright-cli close-all
playwright-cli open https://target.com

# Explore manually
playwright-cli --raw snapshot | grep -iE "signup|login"
playwright-cli click e42
playwright-cli --raw snapshot | grep -iE "form field"

# Once you know the flow, write the hero script and run it
playwright-cli run-code --filename=./hero-script.js
```

### Pattern 3 — Auth capture then recording

```bash
# First: capture auth (save storageState)
playwright-cli close-all
playwright-cli open --persistent https://app.example.com/login
# ... user logs in manually in the real browser ...
playwright-cli state-save .vorec/storageState.json
playwright-cli close

# Second: record using the saved auth
# (The hero script loads storageState at the start)
playwright-cli open https://app.example.com
playwright-cli run-code --filename=./hero-script.js
```

See [./auth.md](./auth.md) for the full auth capture workflow.

## Related files

- [./cli-commands.md](./cli-commands.md) — Core commands (open, click, snapshot, resize)
- [./cli-video.md](./cli-video.md) — Video recording API
- [./cli-running-code.md](./cli-running-code.md) — `run-code` for hero scripts
- [./auth.md](./auth.md) — Storage state + session capture
