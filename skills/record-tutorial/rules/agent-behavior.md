---
name: agent-behavior
description: How the agent should communicate and act during a recording task
---

# Agent Behavior

These rules govern HOW the agent interacts with the user during a recording task. Load this file at Step 0 of every recording, **before** anything else.

## 🎯 Rule 1 — Act first, ask later

When the user's request requires a blocking action (opening a browser, installing a tool, logging in, capturing a session), **do the action first**. Announce it in one sentence. Then ask any follow-up questions while the action is in progress or after it's done.

❌ **Don't:**
> "Are you ready for me to open the browser?"
> "Should I launch Chromium now?"
> "Let me know when you want me to start."

✅ **Do:**
> "Opening Chromium now so you can log in."
> "Launching browser at vorec.ai/login — tell me 'done' when you're on the dashboard."

The user didn't come here to answer meta-questions. They came for a recording.

## 🎯 Rule 2 — Never batch 3+ questions

Ask at most **2 questions at a time**. Prefer sensible defaults over asking.

❌ **Don't:**
> "Quick setup for your recording:
> 1. Is this a local app or a live website?
> 2. Cinematic / Natural / Fast style?
> 3. Cursor style: dot / big / mac / branded / system?
> 4. Explain first or go straight to action?
> 5. What's the target URL?
> 6. Include chapters?"

✅ **Do:**
> "I'll record the vorec.ai signup flow. One thing — is this your project (I can read the code) or should I explore the page?"
>
> *(later)*
>
> "Session saved. Visible cursors in the video? (yes/no)"

Every question is a blocker. Minimize them.

## 🎯 Rule 3 — Use short status updates, not essays

Keep updates to **1-2 sentences**. The user wants a video, not a lecture.

❌ **Don't:**
> "I found two blockers I need to resolve with you before recording. The first is that we don't have a valid login session for vorec.ai — there's an old .vorec/storageState.json, but it's for localhost:3000 and has 0 cookies. Useless for production. The second is that I need to capture a fresh session. Playwright will open Chromium → you log in manually once → I save cookies + localStorage → all future recordings skip the login. Let me also grab the dashboard 'new video' flow selectors while we decide."

✅ **Do:**
> "No valid session yet. Opening Chromium for login now."

## 🎯 Rule 4 — Prefer sensible defaults

When the user asks to record a flow, **assume these defaults and proceed**. Only ask if the user explicitly says otherwise or the default is wrong for the task.

| Thing | Default | When to ask |
|---|---|---|
| Scope | Minimum-viable (just the core action, no deep follow-up) | User explicitly says "full walkthrough" |
| Viewport | 1920×1080 | User wants 2K/4K |
| Language | English | User writes in another language |
| Style | Tutorial | User picks from the style list |
| Visible cursors | No | User says "yes cursors" |
| Dead-time trim | Yes | User says "keep all the pauses" |
| Test data | Generated fresh (unique email, Strong password from code rules) | User provides specific values |
| Session | Use existing if valid, otherwise capture fresh | — |

## 🎯 Rule 5 — Default to headed when the user needs to see anything

`playwright-cli open` **defaults to headless**. The user won't see the browser window.

- **User needs to see/interact** (login, manual validation, session capture): `playwright-cli open --headed <url>`
- **Automated recording** (no user interaction): default (headless) is fine
- **When in doubt during setup**: use `--headed`

See [./cli-session.md](./cli-session.md) for details.

## 🎯 Rule 6 — Re-check state before blocking the user

Before asking the user to re-do something they might have already done:
- Check if a session file exists AND is valid for the target origin
- Check if test data already exists
- Check if the browser is already running
- Check if the output directory is clean

Only ask the user after you've checked what's already on disk.

**Example:**
```bash
# Before "please log in", check if we already have a valid session
test -f .vorec/storageState.json && \
  cat .vorec/storageState.json | python3 -c "
import json, sys, urllib.parse
d = json.load(sys.stdin)
origins = [o.get('origin','') for o in d.get('origins',[])]
target = '${TARGET_URL}'
host = urllib.parse.urlparse(target).netloc
valid = any(host in o for o in origins)
print('valid' if valid else 'stale')
"
```

If `valid` → skip login capture, reuse the session.
If `stale` → capture a fresh one.

## 🎯 Rule 7 — When genuinely stuck, ask the smallest possible question

If you hit something you can't decide, ask **ONE specific question** — not five.

❌ **Don't:**
> "What scope? What file? What style? What language? Should I clear the cart?"

✅ **Do:**
> "The cart has 3 items from an earlier session. Clear them or record as-is?"

## 🎯 Rule 8 — Announce what you're doing as you do it

Give the user a 1-sentence status update before each significant action:

- "Opening browser at vorec.ai/login in headed mode."
- "Running the hero script — this takes about 30 seconds."
- "Converting WebM to MP4..."
- "Uploading to Vorec..."
- "Done. Editor URL: https://vorec.ai/editor?project=..."

Not:
- "Let me think about the next step..."
- "I'm about to run a command. Is that okay?"
- "Here's what I'm going to do in detail: first I'll..."

## 🎯 Rule 9 — On failure, fix silently when you can

If a command fails because of a known-fixable issue, **fix it and retry** rather than reporting the failure to the user.

**Fix silently:**
- `playwright-cli open` opened headless → retry with `--headed`
- `.webm` file path rejected → retry inside allowed roots
- Screencast already running → `close-all` and retry
- Locator strict-mode violation → add `.first()` or `exact: true`
- Cart has leftover items → clear them then proceed

**Report to user:**
- Login required (needs their input)
- Payment/sensitive action required (needs their decision)
- Ambiguous flow (two plausible next clicks)
- Test data validation failed in a way you can't predict

## 🎯 Rule 10 — End with a useful link or file path

When the task is done, the final message should contain exactly ONE actionable result:

✅ "Done. Video: `/Users/you/recordings/signup-123.mp4`"
✅ "Done. Editor: https://vorec.ai/editor?project=xyz"
❌ "I have successfully completed the recording. Here's a summary of what was accomplished: [wall of text]"

The user wants the output. Give them the output.

---

## The pattern, in one sentence

> **Do the work first. Announce in one line. Ask at most one thing at a time. End with a link.**

If an action in the plugin's workflow makes you want to ask a question, re-read this file and ask yourself: **can I just do it with a sensible default?**
