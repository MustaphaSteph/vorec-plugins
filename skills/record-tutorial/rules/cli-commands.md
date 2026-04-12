---
name: playwright-cli-commands
description: playwright-cli core commands — open, click, snapshot, resize, etc.
---

# playwright-cli — Core Commands

`playwright-cli` is the CLI front-end for Playwright. It runs a persistent browser session you can drive command-by-command, and it supports page exploration via snapshots, clicks, and inline scripts.

> This file is adapted from Microsoft's official [playwright-cli skill](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/SKILL.md) (Apache 2.0). Bundled for reference inside the Vorec record-tutorial plugin.

## Install / verify

```bash
# Global install (preferred)
npm install -g @playwright/cli@latest
playwright-cli --version

# Or via npx
npx @playwright/cli@latest --version
```

## Quick start

```bash
# Open a browser — use a real URL, not about:blank
playwright-cli open https://example.com

# Take a snapshot (accessibility tree) to find element refs
playwright-cli snapshot
playwright-cli --raw snapshot | grep -E "keyword"

# Interact using refs from the snapshot
playwright-cli click e15
playwright-cli type "search query"
playwright-cli press Enter

# Take a screenshot (rarely used — snapshot is more common)
playwright-cli screenshot

# Close the browser
playwright-cli close
# Or stop all sessions
playwright-cli close-all
```

## Commands reference

### Navigation

```bash
playwright-cli open                 # open a new browser
playwright-cli open https://site.com  # open and navigate immediately
playwright-cli goto https://other.com  # navigate current tab
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload
```

### Element interaction

```bash
playwright-cli click e15            # click by ref from snapshot
playwright-cli dblclick e7          # double-click
playwright-cli type "hello world"   # type into currently focused element
playwright-cli fill e5 "user@gmail.com"  # fill an input
playwright-cli fill e5 "user@gmail.com" --submit  # fill then press Enter
playwright-cli select e9 "option-value"  # select dropdown option
playwright-cli check e12            # check a checkbox
playwright-cli uncheck e12
playwright-cli hover e4
playwright-cli drag e2 e8           # drag from one element to another
```

### Keyboard

```bash
playwright-cli press Enter
playwright-cli press ArrowDown
playwright-cli press Escape
playwright-cli keydown Shift
playwright-cli keyup Shift
```

### Mouse (lower-level)

```bash
playwright-cli mousemove 150 300
playwright-cli mousedown
playwright-cli mousedown right
playwright-cli mouseup
playwright-cli mousewheel 0 100     # scroll down by 100px
```

### Viewport

```bash
playwright-cli resize 1920 1080     # ALWAYS use 1920x1080 for Vorec recordings
```

### Snapshots

```bash
# Take a snapshot (auto-saved to .playwright-cli/)
playwright-cli snapshot

# Raw snapshot output to stdout (for grep/pipe)
playwright-cli --raw snapshot

# Snapshot a specific element
playwright-cli snapshot "#main-content"

# Limit depth to reduce output size
playwright-cli snapshot --depth=4
```

### Element targeting (in hero scripts)

By default, use refs from the snapshot. But in hero scripts, prefer semantic Playwright locators:

```js
// BEST — semantic, stable across page states
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('you@gmail.com')
page.getByText('Sign up')
page.getByTestId('submit-btn')

// OK — refs from snapshot (can change if page state changes)
// Only use for elements that don't have good semantic locators
```

### Dialogs

```bash
playwright-cli dialog-accept              # accept a confirm/alert
playwright-cli dialog-accept "prompt text"  # fill a prompt then accept
playwright-cli dialog-dismiss             # dismiss a dialog
```

### Eval (JS on the page)

```bash
playwright-cli eval "document.title"
playwright-cli eval "el => el.textContent" e5    # pass an element ref
```

### File uploads

```bash
playwright-cli upload path/to/file.pdf
```

## Raw output mode

The global `--raw` flag strips all formatting and returns only the result value. Use it to pipe into other tools:

```bash
playwright-cli --raw eval "JSON.stringify([...document.querySelectorAll('a')].map(a=>a.href))" > links.json
playwright-cli --raw snapshot > before.yml
# ... do stuff ...
playwright-cli --raw snapshot > after.yml
diff before.yml after.yml
```

## Install parameters

```bash
# Choose browser
playwright-cli open --browser=chrome
playwright-cli open --browser=firefox
playwright-cli open --browser=webkit

# Persistent profile (cookies, localStorage persist between sessions)
playwright-cli open --persistent
playwright-cli open --profile=/path/to/profile

# Config file
playwright-cli open --config=my-config.json

# Delete user data for the default session
playwright-cli delete-data
```

## Related files

- [./cli-video.md](./cli-video.md) — Video recording quality (CDP frames → FFmpeg)
- [./cli-running-code.md](./cli-running-code.md) — Running inline scripts for page exploration
- [./cli-session.md](./cli-session.md) — Multi-session management (named sessions, close-all, kill-all)
