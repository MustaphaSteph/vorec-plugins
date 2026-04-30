---
name: record-tutorial
description: >
  Record narrated tutorial videos via the Vorec Recorder macOS app.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration. Also use when the user wants to update
  narration or translations on an existing Vorec project.
---

# Record Tutorial with Vorec

## Read this entire file before recording anything

This skill is split into two halves:

1. **Workflow** (Steps 0 → 10) — what you do, in order, when the user asks for a recording.
2. **Reference Rules** (the appendix at the bottom) — every rule the workflow references, inlined. Topics: agent behavior, recording types, scroll mechanics, pacing, actions, end-state verification, validation, context writing, narration rules + styles, explore mode, live-site discovery, connected mode, Shopify Admin specifics, article-guide parsing, auth, CLI commands, running code, Playwright, troubleshooting.

**Read both halves in full at the start of every recording job.** Do not skip a Reference Rules section because it "doesn't seem relevant" — you cannot reliably judge relevance until you know what's in it. Past failures have been traced to agents skipping `scroll`, `pacing`, and similar sections that turned out to be load-bearing for the specific case.

## Safety rules — read these once, follow always

### Never `pkill` Chrome broadly — track what you open and kill only that

Discovery and recording use Chrome/Chromium profiles. If a stale process is holding a profile lock, you may be tempted to clean up. **Do not** kill all Chrome processes — that wipes the user's actual browsing session, open tabs, and any in-flight work.

#### The pattern: scoped per-session profile

Every time you launch a browser for discovery (`playwright-cli`, `agent-browser`, manual Chromium), **use a unique per-session profile path** so any later cleanup is automatically scoped to ONLY the windows you opened:

```bash
# At session start — declare a unique profile path
SESSION_PROFILE="/tmp/vorec-discovery-$(date +%s)"

# Use it consistently throughout discovery
playwright-cli open https://example.com --profile "$SESSION_PROFILE"
playwright-cli snapshot
playwright-cli click "role=button[name='X']"

# Cleanup at session end — kills ONLY processes pointing at this profile
pkill -f "$SESSION_PROFILE" 2>/dev/null || true
rm -rf "$SESSION_PROFILE"
```

#### Wrong vs. right

| Wrong (kills user's browser) | Right (scoped to your session) |
|---|---|
| `pkill -9 -f "Google Chrome"` | `pkill -f "$SESSION_PROFILE"` |
| `pkill chrome` | `pkill -f "/tmp/vorec-discovery-..."` |
| `killall "Google Chrome"` | `pkill -f "Vorec/Profiles/<slug>"` (recording-time profile) |
| "I'll close all Chrome to be safe" | Close ONLY the windows your session spawned |

#### When you didn't use a scoped profile

If you forgot to launch with `--profile $SESSION_PROFILE` and now have a hanging Chrome process you'd like to clean up: **do nothing automatically**. Tell the user verbatim:

> I have a stale Chrome process I'd normally clean up, but I didn't open it with an isolated profile so I can't tell it apart from your real browser. Please quit any leftover windows manually.

Asking the user to close windows is annoying once. Killing their entire browser session is unforgivable.

#### Recording-time cleanup is the CLI's job, not yours

`vorec run` already kills only the processes pointing at its own recording profile dir (see `cleanProfileForLaunch` in `run.ts`). You should not pre-emptively `pkill` anything before running it. If `vorec run` errors due to a profile lock, just re-run the command — the CLI handles its own cleanup.

### Never delete `.vorec/` directories without asking

Each `.vorec/<slug>-<timestamp>/` folder is the user's session state — manifest, sidecar, optionally an unsubmitted MP4. Deleting one mid-flow loses the recording. If a directory looks stale, ask first.

### Never push or commit on the user's behalf without explicit approval

Showing the user a diff and getting agreement that the change is good is **not** authorization to commit or push. Only commit or push when the user explicitly says "ship", "push", "commit", or equivalent. Phrases like "ok", "looks good", "agreed", or "X is better" are reactions to analysis, not green lights.

## What is Vorec?

Vorec (vorec.ai) turns screen recordings into narrated tutorial videos. You record a flow — Vorec adds AI voice-over, zoom effects, cursor animations, subtitles, and a full video editor.

## How recording works

Recording is done by the **Vorec Recorder desktop app** (macOS only). The app captures the browser window natively (ScreenCaptureKit, 2× retina, H.264), uploads to Vorec, and returns an editor URL. The CLI (`@vorec/cli`) is a driver: it automates the browser and tells the app what to capture.

**You do not record with Playwright, FFmpeg, or any other tool. Only the app records. If the app is not installed, stop and tell the user to install it — do not suggest alternatives.**

## Your role as the AI agent

1. Verify the app is ready (installed, signed in, permission granted).
2. Write a `vorec.json` manifest describing the flow (url, viewport, actions).
3. Run `npx @vorec/cli@latest run vorec.json`. The CLI launches Chromium, tells the app to record that window, drives the actions, stops, uploads, and starts analysis.
4. Return the editor URL to the user.

Vorec then:
- Reads your tracked actions (descriptions, context, coordinates)
- Writes narration scripts that explain each step
- Places click markers, zoom targets, and cursor effects using your coordinates
- Gives the user an editor URL where they can preview, edit, and export

**The better your action tracking (name, description, context), the better Vorec's narration will be.** You are the eyes — Vorec is the voice.

**Recording benchmarks:**
- Short tutorial: 5–15 tracked actions
- Deep walkthrough: 15–30 tracked actions
- Final video sweet spot: 1–3 minutes
- More than 30 actions or 4 minutes → consider splitting into multiple recordings

## FIRST: Load agent-behavior rules

Before anything else, read the **agent-behavior** section below. It's short and teaches you:
- Act first, ask later
- Never batch 3+ questions
- Prefer sensible defaults
- Fix silently, retry without reporting small failures
- End with a link/path, not an essay

**These rules override everything else.**

## Step 0: Detect the mode

**Auto-detect — don't ask the user unless you're unsure:**

- Project has `shopify.app.toml` OR URL is `admin.shopify.com/...` → **Shopify Admin mode** (read the **shopify-admin** section below)
- User mentions an external URL (any third-party site — SaaS dashboards, landing pages, competitor products) → **Explore mode**
- User mentions their own project and you can see the codebase → **Connected mode**
- Not sure → ask ONE question.

**Shopify Admin:** embedded apps require special handling — never record from the raw tunnel URL, never automate Google login, use a dedicated browser profile.
**Connected:** you have the source code — read components for selectors, validation, success states.
**Explore:** you don't have the code — discover the page via Playwright snapshots. Read the **explore** section below.

## Step 0.5: Detect the recording type

Read the **recording-types** section below, then classify: task tutorial / website tour / bug reproduction / UX review.

For external URLs in Explore mode, also read the **live-site-discovery** section below.

## Prerequisites — ALL must pass

Run this single command and read the output:

```bash
npx @vorec/cli@latest check
```

The `@latest` tag is critical — without it, `npx` reuses whatever version is in your local cache, which can be months stale and silently produce broken recordings (e.g. cropped-coords bug fixed in 2.25, hidden-input clicks fixed in 2.27, parallel iframe resolution in 2.26). Always pin `@latest` on the CLI, both for `check` and for the actual `run`/`analyze` commands.

The check verifies:
- **Vorec Recorder app** is running (macOS only)
- **User is signed in** to the app
- **Screen Recording permission** is granted
- **cliclick** is installed (so the cursor is visible in recordings)
- **Vorec account** has credits and project slots available

### Confirm the CLI version is current

After `vorec ... check` completes, also run:

```bash
npx @vorec/cli@latest --version
```

Compare the output to the latest published version (the CLI itself prints a warning when stale; in `@vorec/cli@2.28.0+` it auto-checks the npm registry and aborts on a major-version gap). If the version is more than one minor behind, force a clean reinstall before proceeding:

```bash
npm uninstall -g @vorec/cli   # removes any global pin
npm cache clean --force       # clears npx cache
npx @vorec/cli@latest --version  # verifies fresh fetch
```

A stale CLI is the #1 source of "I thought we fixed that bug" failures. Always confirm the version before recording.

### If the app is NOT installed or not running

Stop and tell the user, verbatim:

> The Vorec Recorder app is required to record. Install it from https://vorec.ai/download, open it, sign in, and grant Screen Recording permission — then ask me again.

**Do not offer alternatives. Do not fall back to Playwright recordVideo, FFmpeg, screencapture, or any other tool. The app is the only supported recorder.**

### If cliclick is missing

Run `brew install cliclick`. Without it, the mouse cursor is not visible in the recording.

### Install the discovery browser (agent-browser)

For live-site discovery (Explore mode), the skill uses `agent-browser` — a CLI that returns a compact accessibility tree with ref tags (`@e1`, `@e2`) instead of full DOM dumps. It keeps discovery tokens small and selectors deterministic.

Check + install in one line:

```bash
command -v agent-browser >/dev/null 2>&1 || npm install -g agent-browser
agent-browser install  # first-time: downloads Chrome. Safe to re-run (no-op after first)
```

If `npm install -g` fails due to permissions, fall back to `npx agent-browser` for every call — slightly slower but no install needed.

### API key

The CLI needs a Vorec API key for analysis steps. Save once: `npx @vorec/cli@latest init` (the skill's rule files cover this — see the **auth** section below).

## Step 1: Elicit URL + discovery mode + goal + audience + gotchas — one message

The user told you *what* flow to record. You still need to know *where* to record it, *whether you can read their code*, *why*, *for whom*, and *what to watch out for*. Without this, your discovery is blind, your narration is generic, and you may record against the wrong URL entirely.

### First — detect what URLs are actually available

Before asking, quickly scan the workspace for real URL signals. Do NOT ask about URLs that don't exist. Do NOT invent a "your-live-domain.com" placeholder.

Check, in order:

| Signal | What it tells you |
|---|---|
| `package.json` → `scripts.dev` / `dev:*` | local dev port (usually `localhost:3000`) |
| `package.json` → `homepage` field | deployed URL |
| `vercel.json`, `.vercel/project.json` | Vercel-hosted deployed URL |
| `netlify.toml` → `[build].publish` + netlify project | Netlify-hosted deployed URL |
| `wrangler.toml` → `routes` / `*.workers.dev` | Cloudflare Workers deployed URL |
| `shopify.app.toml` → `application_url` | Shopify embedded app (uses admin.shopify.com host) |
| `.env`, `.env.local` → `NEXT_PUBLIC_*URL`, `PUBLIC_SITE_URL`, `VITE_*_URL` | explicit deployed URL |
| `README.md` → first http(s) link in a "Live demo" / "Production" / "Deployed at" section | deployed URL |
| `git remote -v` → GitHub Pages URL (`github.io`) | deployed URL if that's where it lives |

Record what you found — 1 localhost option, 0-1 deployed option, or neither.

### Then — ask, with REAL options only

Present URL choices based on what you detected. If the user already pasted a URL in their request, make that the pre-selected option. Never fabricate options.

> Got it — I'll record `<what they asked for>`.
>
> Before I start exploring:
>
> 1. **Which URL should I record against?**
>    `<list the real options you found, e.g.:>`
>    - `http://localhost:3000` (your local dev server — from package.json dev script)
>    - `https://example.com` (your deployed site — from package.json homepage)
>    - or paste another URL
>
>    *(If you didn't find any URL at all, just ask: "Which URL should I record? Paste a link.")*
>
> 2. **Can I read your source code for discovery, or should I stay out of it?**
>    - **Read code** — faster, more accurate selectors (I stick to the files related to this flow; I don't copy secrets)
>    - **Live only** — I explore the page through snapshots, never open your files
>
>    *(If no code is present in the cwd, skip this question — default to live only.)*
>
> 3. **What's the goal of this video?** (e.g. "show new users how fast signup is", "document how admins manage refunds", "explain feature X to the sales team")
>
> 4. **Who's watching?** (customer, internal team, developer, investor — shapes tone + what details to show)
>
> 5. **Anything I should pay attention to or avoid?** (e.g. "don't show pricing because it's changing", "the first-time onboarding popup should be dismissed before recording", "the Save button looks stuck for 2 seconds — that's normal", "use product 'Acme Pro' — it's our demo product")
>
> Reply with those or say "go" for sensible defaults.

### Always ask, even when there's only one URL option

If the user only has `localhost:3000` detected and no deployed URL, still ask. They might want to paste a totally different URL (a competitor site, a different env, a staging domain). The question costs one line; the wrong URL on camera costs a re-recording.

### Why each question matters

- **URL** → Determines WHERE the recording happens. Local dev shows seed data + dev banners; live prod shows real branding. User's call, not yours.
- **Discovery mode** → Whether you're allowed to grep the codebase at all. Users may prefer live-only for privacy, to avoid leaking secrets, or because their deployed prod doesn't match current code (stale branch, migrations pending).
- **Goal** → Determines which path to show when flow has alternatives (fastest signup vs. feature-rich signup), what to highlight, what to gloss over
- **Audience** → Shapes narration style, which details to name, what terminology level to use
- **Gotchas** → Catches things you CANNOT discover by exploring: feature flags, flaky UI, specific demo data requirements, first-time-user popups, rate limits, region-specific UI

### What the agent does with the answers

- **URL answer** → this becomes the manifest `url`. If the user picked a URL different from what they initially mentioned, that's the one that wins.
- **Discovery mode answer** → controls Step 3. If "live only", you MUST NOT open any local source files even when the cwd has the code. Live dry-run only.
- **Goal answer** → becomes `videoContext` in the manifest (Gemini uses it to ground narration)
- **Audience answer** → influences which narration style to suggest in Step 6
- **Gotchas answer** → added to discovery checklist; agent explicitly verifies each one during dry-run

### If the user says "go" / "defaults"

Proceed with reasonable guesses:
- URL: whatever they initially mentioned; if nothing, the deployed domain inferred from the repo
- Discovery mode: **live-only** — safer default. Don't read code unless the user says you can.
- Goal: what the flow name implies ("record checkout" → "show how to complete a purchase")
- Audience: generic users
- Gotchas: none known; agent will ask mid-discovery if anything weird shows up

Do NOT skip the question just because it looks obvious. A user who says "record our checkout" might mean localhost, their staging env, or production — you cannot guess which one they want on camera.

### If the user shares an article / guide / docs link

When the request includes a link to a help article, documentation page, or any step-by-step guide (Crisp help, Intercom, Notion docs, blog tutorial, etc.) — **read the **article-guide-parsing** section below now**. That article is the source of truth for what the video must show: its screenshots define the UI states, its demo values define what to type. Parse them before writing anything.

Signals that trigger this:
- User pastes a URL before the recording request
- Phrases like "record this", "follow this guide", "same as this article", "make a video of this"
- The URL resolves to a help center / docs / blog post

## Step 2: Check the page first — don't assume login

Before discovery, find out whether the target URL is public, auth-walled, or partially gated. This shapes the entire rest of the flow.

```bash
playwright-cli open <URL>
playwright-cli --raw snapshot
```

Look at the snapshot:
- **Public page, target content visible** → no login needed. Go to Step 3.
- **Login page / redirect to auth** → login required. Open in headed mode so the user can sign in, capture the session. Read the **auth** section below.
- **Partially visible, some actions need auth** → ask the user one question: *"Do I need to log in to do `<specific action>`?"*

**NEVER assume login.** Most public sites (marketing, docs, tools) need none. Only handle auth when you SEE a login wall or the user tells you.

## Step 3: MANDATORY deep discovery — DO NOT SKIP, DO NOT CUT CORNERS

**You MUST discover the full flow BEFORE writing a single line of manifest.** Not optional. Discovery is where recordings are won or lost.

Discovery has **two phases** — a high-level exploration pass and a selector-verification pass. Skipping either produces broken recordings.

### Phase 3a — Flow exploration (what exists, where, what's the UX)

This is the "walk the site and map it" phase. You produce a flow map that lists:
- Every URL in the sequence (including redirects)
- Every step / page / modal / popup encountered
- Field inventory per page (textbox names, button labels, constraints)
- Pre-filled values, defaults, validation errors
- Minimum player counts / field requirements / enable-disable triggers
- Success state (end URL, visible text, success banner)

**Default discovery tool: `agent-browser`** (installed in prereqs). It returns a compact accessibility tree with ref tags like `@e1` instead of full DOM dumps — keeps the agent's context small and selectors deterministic.

| Tool | When to use |
|---|---|
| `agent-browser` | **Default** for all live-site discovery. Produces a compact a11y tree with refs, URL transitions, and element-at-ref lookups. Low token cost. |
| `playwright-cli` snapshot + click loops | Used in Phase 3b (selector verification) where you need the full ARIA snapshot with role + name for every target element. |
| Direct source-code reading (Connected mode with user permission) | When user allowed "read code" in Step 1 and the flow is static enough that code tells the full story. |

Standard pattern: `agent-browser` for the high-level site map (Phase 3a), then `playwright-cli` snapshot per element (Phase 3b).

### Phase 3b — Playwright selector verification (MANDATORY no matter which tool Phase 3a used)

This is the part that catches the #1 failure mode: **the Playwright selector isn't what the high-level tool showed**.

For EVERY action in your planned manifest, you must use `playwright-cli --raw snapshot` to confirm the element's ARIA **role** and accessible **name**. A site-mapping tool may describe an element only by its visible label — e.g. the doc calls something a "tab" but doesn't specify whether that's a `role="tab"`, a `role="button"`, or a plain link styled like a tab. If you guess wrong and write `button:has-text('Label')` when the element is actually `role="tab"`, Playwright will fail to find it.

For each action:

1. Navigate to the page where the action happens (`playwright-cli open` + clicks to reach it).
2. `playwright-cli --raw snapshot` — find the target element.
3. Record its `role` + accessible `name` as they appear in the snapshot:
   ```
   - <role> "<name>" [ref=eNN]
     ↑ role    ↑ name
   ```
4. The manifest selector becomes `role=<role>[name='<name>']`. Use that EXACT Playwright syntax — not CSS, not `:has-text()` guesses.
5. Verify the selector resolves by actually clicking it via `playwright-cli click <ref>` and snapshotting the result.
6. Note observed response time for the manifest's `pause` value.
7. **Append an entry to `discovery_log.json`** (see below) — this is the CLI-enforced proof that you walked this action.

**This phase is non-negotiable.** Whatever Phase 3a told you is the flow, Phase 3b confirms the Playwright selectors that will actually fire during recording.

### Click interception: when a "correct" selector still won't click

This is the Phase 3b failure mode that snapshots can't catch on their own. An ARIA snapshot shows `role=checkbox[name='Foo']` is present — but the click doesn't toggle anything. Recording then hangs ~10s per intercepted click and the run aborts with a Playwright actionability error.

It happens when a design system **hides the real input behind a styled wrapper**. Polaris (Shopify Admin), Material UI, Radix, Mantine, Headless UI — all do some variant of:

```html
<label class="Polaris-Checkbox">
  <input type="checkbox" class="visually-hidden">  ← real input, opacity:0, 1px×1px
  <span class="Polaris-Checkbox__Backdrop">         ← visible "checkbox", catches clicks
</label>
```

Playwright's actionability check sees the input as `display:none`-equivalent and refuses. Two ways to fix it — **prefer the first**:

**1. Wrapper-selector first (preferred — purer, no CLI flag).**
Find the visible parent and target it instead. For Polaris:
```
role=checkbox[name='Select: Example 1 & 2']        ← intercepted
[aria-label='Select: Example 1 & 2']               ← works (the visible label)
```
For Polaris listbox options:
```
role=option[name='India']                          ← may intercept
.Polaris-Listbox-TextOption:has-text('India')      ← works
```
Phase 3b discovers these by **clicking the role= variant first, watching it fail to change UI, then re-snapshotting around the element to find the wrapping `[aria-label=…]` or class-based target**.

**2. `"force": true` on the action (fallback — when wrappers aren't clean).**
Add `"force": true` to the action in `vorec.json`. The CLI passes it to Playwright's click and skips actionability checks — the click dispatches at the element's coordinates regardless of overlay. The framework's JS handler still picks it up.
```json
{
  "type": "click",
  "selector": "role=checkbox[name='Apply this rate for certain countries only']",
  "force": true,
  "description": "Toggle countries-only checkbox"
}
```
Use `force` ONLY when (a) Phase 3b verified the selector is correct AND (b) the click still intercepts. Never as a workaround for a wrong selector — force-clicking the wrong element produces wrong UI state silently. Available in `@vorec/cli@2.27.0+`.

**How to tell during Phase 3b which path you need:**
- Click the role= selector via playwright-cli/agent-browser
- Snapshot the page
- If UI changed → role= selector works, no force needed → proceed.
- If UI did NOT change → check for a wrapper attribute (`[aria-label=…]`, `[data-…]`) or a stable class on the parent (`.Polaris-Listbox-TextOption`). Use that. Try again. If still no change, fall back to `"force": true` on the role= selector.

### discovery_log.json — CLI-enforced walk-the-flow proof

Starting with `@vorec/cli@2.23.0`, `vorec run` refuses to record unless a `discovery_log.json` file sits next to the manifest and contains a verified entry for every action that has a selector (click, type, select, hover). narrate / scroll / wait / navigate are exempt.

Write the log progressively as you do Phase 3b — one entry per action you snapshot + click. The final file must look like this:

```json
[
  {
    "step": 1,
    "selector": "role=link[name='Generate Tournament']",
    "verified": true,
    "ui_after": "Format chooser page loaded. 6 tournament format cards visible (Classic Americano, Mixed Americano, Team Americano, Classic Mexicano, Mixed Mexicano, Team Mexicano). ~1.8s transition."
  },
  {
    "step": 2,
    "selector": "role=link[name='Classic Mexicano']",
    "verified": true,
    "ui_after": "Intro modal appeared with 'Got it' button. Behind it: wizard step 1 (Choose Format) with format pre-selected."
  }
]
```

Required fields per entry:
- `selector` — EXACT string you will put in the manifest (must match character-for-character)
- `verified: true` — you actually clicked it via playwright-cli or agent-browser and saw the response
- `ui_after` — ≥20 chars describing what changed on screen

If any selector in vorec.json has no matching log entry — or the entry is missing `verified:true` or `ui_after` — the CLI prints the list of failures and exits. No recording happens. No credits are spent.

**You cannot fake the log by copying values.** If you write the log without actually walking the flow, your manifest selectors will fail during recording and the run will abort mid-flight. The log is the artifact; the verified snapshots are the work.

For manual human use (not an AI agent), pass `--skip-discovery-check`.

### Discovery is iterative, not a single pass

Whatever tool you use in Phase 3a and 3b, you will **repeatedly** open, snapshot, click, observe, back-track, and try again. Budget for this — a good dry-run on a 10-step flow is 30–60 playwright-cli calls (in Phase 3b alone), not 10. If you finish discovery with the same number of snapshots as planned actions, you went too shallow.

### What "deep discovery" means concretely

For **every action** in your planned flow:

1. **Open / navigate to the page** — `playwright-cli open --headed <url>` or click to it.
2. **Snapshot the page** — `playwright-cli --raw snapshot`. Read ALL the content, not just the target.
3. **Locate the target** — find by accessibility role+name, note the ref.
4. **Click / fill it** — `playwright-cli click <ref>` or `fill <ref> <value>`.
5. **Snapshot AGAIN** — what rendered? What changed?
6. **Note everything observed**:
   - Resolved selector you'll use in the manifest
   - Exact observed UI response (modal? toast? navigation? inline expand?)
   - Timing: how long did the response take?
   - Anything else that appeared you didn't expect (warning banner, cookie consent, tooltip)
7. **Check disabled/enabled states** — is the next primary button enabled now? If not, what's still required?
8. **For form submits: probe validation** — try submitting with empty required fields (non-destructively). Capture the exact error text and which field each error belongs to.
9. **For success states at flow end**: verify the URL pattern AND a visible element AND any toast/banner text. All three.

Do this for **every action**. Not just the risky ones. Every one. Consider the action "discovered" only when you've snapshotted the state both before AND after.

### What else to verify beyond clicks

Deep discovery covers state the agent tends to miss:

- **Loading states** — how long does each async operation take? (matters for `pause` timing)
- **Empty states** — what does an empty list / fresh account / blank form look like? (does the tutorial start from empty?)
- **Filled states** — if fields retain values across sessions, does that affect the recording?
- **Disabled → enabled transitions** — what specifically unlocks the Save button?
- **First-time vs. returning user UI** — onboarding tours, tip popups, "new feature" banners
- **Modals & overlays** — which ones appear mid-flow? Cookie banners, consent dialogs, upgrade nudges
- **Rate limits / throttles** — if you hit one during dry-run, document the threshold
- **Cross-origin iframes** — if any action lives inside an iframe, you need the iframe selector for the manifest `frame` field
- **Conditional branches** — if the flow forks ("if paid user → X, if free user → Y"), you need to record ONE specific path; ask the user which if unclear
- **Keyboard-only paths** — sometimes the click-only path doesn't work (e.g., combobox needs typing to filter). Try both.

### Honor the user's discovery-mode choice

The Step 1 question "can I read your source code" sets a hard rule for this phase:

- **"Read code"** — you may grep / read files in the cwd for the flow being recorded. Stick to files relevant to the flow (components, routes, forms, validation schemas). Do NOT read unrelated files, .env, credentials, or parts of the codebase outside the feature. Still verify live when the code doesn't answer a question (dynamic UI, API responses).
- **"Live only"** — you MUST NOT open any source file, even if the cwd is full of code. All discovery is via `playwright-cli snapshot` + click loops. If a selector is hard to find, keep snapshotting, don't fall back to reading code.
- **No answer given** — default to **live only**. Safer.

If the user chose live-only and you catch yourself wanting to grep or read a file, STOP. Ask the user: *"I need `<specific info>` to continue. Can I read `<specific file>`, or do you want to tell me directly?"*

### Honor the user's gotchas from Step 1

If the user mentioned anything in question 5 ("anything to pay attention to"), verify each one explicitly during discovery. Each gotcha = at least one snapshot that confirms it's handled. Examples:
- User said "skip the first-time tour" → open with a fresh session, confirm the tour appears, find the dismiss button, note its selector
- User said "use product 'Acme Pro'" → confirm that product exists in the target UI, note its exact label
- User said "Save button takes 2s to respond" → time it during discovery, use that as your `pause`

### When you get stuck — ask, don't guess

You WILL hit things you can't resolve by exploring. That's normal. When you hit any of these, STOP discovery and ask the user ONE specific question:

- Selector won't resolve / two equally plausible selectors exist
- Form validation blocks you with a rule you don't understand (*"it wants a VAT number — what format?"*)
- Two visible paths forward, unclear which the user wants recorded
- An action would be destructive to verify (submitting a real payment, sending a real email, deleting a real record)
- A login or 2FA popup appears mid-flow that you can't bypass alone
- The UI looks broken / loading forever — need the user to check

**Do not guess. Do not try random values. Do not proceed with "I think the user probably wanted X."** Ask.

Format:

> I'm stuck at `<specific step>`: `<exactly what happened>`. `<one clear question for the user>`.

Resume discovery as soon as you have the answer.

### The `pause` timing comes from discovery

When an action's response takes 800ms, write `pause: 1800` (response + a beat for comprehension + narration word count). When it takes 3s (form submit, page transition), write `pause: 4000`. Use real observed times, not guesses. If you didn't time it during discovery, you don't know it — go re-time it.

### Depth checklist — cannot leave Step 3 with any NO

Before you print the discovery report to the user, mentally check:

- [ ] Every planned action has a verified selector (role+name preferred over CSS)
- [ ] Every selector tested for uniqueness — no partial text matches that hit multiple elements
- [ ] Stateful controls (toggles, pickers, radios) tested for reset behavior — known whether they persist across submits or reset per row
- [ ] Every form field has a valid demo value that passes validation
- [ ] Every form field's "required" state is known
- [ ] Every primary button's enabled/disabled trigger is known
- [ ] Success state has URL + visible element + evidence text
- [ ] Loading / async timings noted for every slow action (>500ms)
- [ ] Cumulative recording time estimated and under any tier limit (<8 min for short, <15 min deep; split if longer)
- [ ] First-time popups / onboarding state handled
- [ ] Cookie / consent banners handled
- [ ] Every user-listed gotcha verified
- [ ] No sensitive action will fire during recording (payments, emails, deletes, invitations)
- [ ] No blocker remains unresolved (rate limit, verification, region gate)

If any box is UN-ticked, you're not done. Do not write the manifest.

### Keep findings in conversation — DO NOT write discovery files

Everything you discover lives in your conversation context. Do **not** write `flow-notes.md`, `live-site-map.json`, or any other discovery-output file. They consume tokens without being consumed by anything — the CLI doesn't read them, the backend doesn't read them, nothing automated uses them. The only consumer of your discovery is *you* writing the manifest in Step 5, which happens in the same conversation.

What you need to remember across the dry-run (mentally, not on disk):
- Selectors that resolved for each planned action
- Valid demo values that pass validation (what you typed into fields)
- Required fields + the exact error text on empty submit
- Success state at flow end (URL, visible element, text)
- Hidden modals / dialogs / intermediate states the text summary misses
- Sensitive actions you avoided (payments, deletes, emails, invitations)
- Blockers you encountered (rate limits, regional restrictions, verifications)

### PRE-RECORDING GATE — mental readiness check

**You cannot write the manifest until you can truthfully say, in the discovery report below:**
1. **Blockers reviewed** — you've identified anything that could stop the recording mid-flow (rate limits, verification requirements, geo-gates).
2. **Sensitive actions reviewed** — you've identified anything that would have real-world consequences (charges, emails sent, records deleted, invitations issued) and decided how to avoid / neutralize them.

This is a self-imposed gate. No file is checked — you are. If either item is unverified, go back to discovery or ask the user ONE targeted question to resolve it. Never claim "reviewed" without evidence.

### Why this is non-negotiable

- You **cannot** predict selectors from a URL or product name. "Add conditions" might be a button, dropdown, link, or section header. Snapshots tell you.
- You **cannot** predict required fields, validation rules, or error text without actually submitting.
- You **cannot** predict multi-step flows ("click X → Y appears → click Z") without clicking X and seeing what renders.
- The app records native H.264 — if your manifest clicks the wrong thing on take one, there's no "fix in post."

### The discovery report you show the user

Before writing the manifest, print a thorough report that covers the depth checklist:

> **Dry-run complete — here's what I verified end-to-end.**
>
> **Flow (N actions):**
> 1. `<action 1 description>` → `<resolved selector>`; clicked → `<observed response>` (~`<ms>`ms)
> 2. `<action 2 description>` → `<resolved selector>`; typed `'<demo value>'` → `<observed behavior>`
> 3. …
>
> **Validation discovered:**
> - `<field>` — required; empty submit shows `"<exact error text>"`
> - `<field>` — accepts `<format>`; rejected `<bad example>` with `"<error>"`
>
> **Success state:** URL matches `<pattern>`, banner shows `"<text>"`, `<element>` visible.
>
> **Gotchas you mentioned — how I'll handle them:**
> - `<user's gotcha 1>` → `<what the agent verified / how the manifest addresses it>`
> - `<user's gotcha 2>` → `<resolution>`
>
> **Other observations worth flagging:**
> - `<any surprise found during discovery>` — e.g. "A 'Save draft?' popup appeared between step 5 and 6; I'll add a dismiss click for it"
> - `<any timing that's unusually slow>`
>
> **Sensitive actions / blockers:** Do: reviewed. `<say what was avoided or how it was neutralized>`.
>
> Ready to write the manifest with the flow above? (yes, or tell me what to change)

A single-line "Dry-run complete" is NOT an acceptable report. The report is the user's audit checkpoint — skimp on it and they can't catch your mistakes before the recording wastes credits.

Only after the user confirms do you proceed to Step 4.

### Exceptions

**NONE for Explore mode / Shopify Admin** (any URL without source code access). Full dry-run is mandatory.

**Connected mode only**: if you have the full source code AND the components are small AND you can read every piece of the logic (field names, validation schema, success redirect, API response handling), you can skip clicking through and rely on the code. You still document findings and show the user the report — just sourced from code instead of playwright-cli. If ANY part of the flow isn't fully visible in the code (dynamic UI, cross-origin iframes, async network responses), fall back to live dry-run.

Rule files: the **explore** section below for Explore flows, the **connected** section below for Connected flows, the **live-site-discovery** section below for extra guidance on safe discovery on third-party sites.

**If you catch yourself writing selectors you haven't verified, STOP and go do the discovery first.**

## Step 4: Map the flow

With discovery complete, plan the sequence you'll record. For each step, write **structure only** — no narration yet, no code, no timings:

- What page / section we're on
- What interactions happen there (click X, type Y, hover Z)
- How we get to the next step (navigation, scroll, modal close)

This becomes the skeleton you'll turn into a manifest in Step 5 and the plan you'll show the user in Step 6. Real timing is computed from narration word count later.

Keep it tight: 5–15 actions for a short tutorial, 15–30 for a deep walkthrough. If you're over 30, split into two recordings.

## Step 5: Create the project folder + write the manifest

Every recording gets its own timestamped folder under `.vorec/` so different sessions never collide.

```bash
# Format: <slug>-<YYYYMMDD-HHMMSS>
# Pick a short slug from the flow title (no spaces, lowercase).
SLUG="<your-slug>-$(date +%Y%m%d-%H%M%S)"
mkdir -p ".vorec/$SLUG"
```

Folder contents:

```
.vorec/
├── storageState.json                  # shared session (one per origin, optional)
└── <slug>-<timestamp>/
    └── vorec.json                     # manifest for this recording — the only file you write
```

Manifest contents:

```json
{
  "title": "<short tutorial title — what the user wants to learn>",
  "url": "<the URL to start on>",
  "viewport": { "width": 1600, "height": 1000 },
  "language": "en",
  "narrationStyle": "tutorial",
  "storageState": ".vorec/storageState.json",
  "actions": [
    { "type": "narrate", "delay": 4000, "description": "<orienting scene label>", "context": "<what the user is looking at right now>" },
    { "type": "click", "selector": "<selector>", "description": "<what this click does>", "context": "<what changes on screen>" },
    { "type": "type", "selector": "<input selector>", "text": "<value>", "description": "<what is being entered>" },
    { "type": "click", "selector": "<submit selector>", "description": "<end-state trigger>", "context": "<what the user now sees>" }
  ]
}
```

**The CLI records the full Chromium window — every time, no exceptions.** Chromium launches with the standard tab bar + URL bar visible; the recording captures everything. There is no flag to hide chrome at record time and no flag to crop to an iframe. The Vorec editor has a crop tool — if the tutorial would look cleaner without browser chrome, the user crops in post. **Do not add `chromeless`, `recordFrame`, `viewport`, or any other layout/crop field to the manifest** — the CLI ignores them. If you've used these in older skills, drop them.

If your recording dimensions are too small (sub-retina output), the manifest is **not** the cause. The actual causes:

| Cause | Fix |
|---|---|
| Chromium cached window-placement from a previous run | Quit recorder app + scoped pkill (see "Verify recording dimensions" in Step 7) |
| CDP resize race during launch | CLI 2.31.0+ auto-retries the resize; upgrade with `npm install -g @vorec/cli@latest` |

**Action types:** `click` · `type` · `select` · `hover` · `scroll` · `wait` · `navigate` · `narrate`.

For scroll mechanics (reveal-before-click, SPA reset trap, smooth scroll), read the **scroll** section below.

**Every action carries these four text-ish fields — always write all four:**

| Field | Purpose | Length |
|---|---|---|
| `description` | Timeline label shown in the editor | 5–10 words |
| `context` | Rich scene description (what's on screen, why it matters) — used by Vorec to ground narration generation | 1–3 sentences |
| `narration` | Draft of the spoken script for this moment — always included in the JSON Vorec receives; becomes final verbatim if `skipNarration: true`, otherwise Vorec polishes it | 1 spoken line |
| `pause` | Hold time in ms the narration has to be spoken in. Formula: `wordCount × 350 + 500` | integer |

- `narrate` = no interaction, just a pause with a scene description.
- `primary: true` on exactly ONE action per page = "this is the key click, zoom on it, gold-star it in the timeline".
- `force: true` on `click` / `type` / `hover` = skip Playwright actionability checks (`@vorec/cli@2.27.0+`). Use **only** when Phase 3b proved the selector is correct AND the click still intercepts (Polaris hidden inputs, MUI checkboxes, Radix Listbox options). Never as a workaround for a wrong selector — see "Click interception" in Step 3b for the wrapper-first vs force decision.

### Manifest must mirror what a human would actually do

The synthetic cursor on the final video shows users **how** to do something, not just **that** something happened. If the manifest skips visible navigation steps, the cursor teleports in the rendered video and the tutorial fails its purpose. Viewers see clicks landing on things they never saw the user navigate to, and they can't replicate the flow themselves.

**Core principle:** every action that produces visible motion must be its own step in the manifest. Playwright is happy to auto-scroll, auto-resolve, or chain things internally — but those internal helpers are **silent**, **off-cursor**, and break the tutorial's teaching value. Never use them as a substitute for explicit human-style actions.

#### Wrong vs. right — common cases

| What goes wrong | The right way |
|---|---|
| `click "role=option[name='Morocco']"` directly when the option isn't visible yet | open combobox → `type "Mor"` to filter → click the Morocco option |
| `click "role=checkbox[name='Some hidden product']"` deep in a picker list | open picker → `scroll` to bring it into view (or `type` a search query) → click |
| `click "role=button[name='Save']"` when Save is below the fold | `scroll` to reveal Save → click |
| `click` an autocomplete suggestion that appears after typing | `type` slowly, `wait` 500–800 ms for suggestions, then click |
| `click` a tooltip-revealed control | `hover` the trigger first → `wait` 300 ms → click the revealed control |
| `click` an expand/collapse arrow then immediately click the now-visible child | open accordion → `wait` for the panel to settle → click child |
| `click` inside a modal as soon as it would render | click trigger → `narrate` ~1.5–2 s ("a dialog appears with…") → click inside |
| `select` a deep dropdown option in one shot | open dropdown → `scroll` if needed → click the option |
| Filling a form: `type` field 1 → `type` field 2 → `type` field 3 in instant succession | type field 1 → `pause` 800–1200 ms → type field 2 → … (so the cursor visibly moves between fields) |
| Clicking 5 checkboxes back-to-back with no breathing room | put a 600–1000 ms `pause` on each so the cursor settles before the next |
| Submit then immediately interact with the next page | submit → `wait`/`narrate` for the page transition → next action |
| Hovering the menu and clicking a sub-item in the same breath | hover top-level item → `wait` 250 ms for sub-menu → click sub-item |
| Tab switch + click in the new tab as one chain | click tab → `narrate` 1–2 s describing what the new tab shows → first action in new tab |
| Drag-and-drop simplified to two clicks | use explicit `drag` action if available; otherwise narrate the workaround clearly |
| `click` on a button that's hidden behind a sticky header | `scroll up` to expose it (or scroll past it and let the header re-pin) → click |

#### Pacing rules

- **800–1200 ms pause** on rapid sequential clicks (checkboxes, toggles, list selections) so the cursor visibly settles between each.
- **Type slowly when filtering search/autocomplete** — Playwright already types at 50 ms/char in CLI; that's fine. Don't compensate by lowering the next pause; let the user see the suggestions appear.
- **Long-running content (page navigation, file upload, async load)** → use a `narrate` action with a `pause` matching how long the load actually takes. The narration covers the wait visibly.
- **Modal/dialog appearance** → always narrate the moment it opens. Even a 1.5 s "a dialog opens with X" is enough; don't dive into clicking inside before the user has seen what's there.
- **Hover-only interactions (tooltips, sub-menus, dropdowns triggered by hover)** → `hover` action, then `wait` ~300 ms, then the click. Skipping the hover-then-wait makes the cursor teleport into a control that wasn't visible 50 ms earlier.

#### Ask yourself before each action

1. **Could a real user see and reach this control without doing anything else first?** If no → add the prerequisite step.
2. **Will the cursor have time to settle visibly between this action and the previous one?** If no → bump the previous action's `pause`.
3. **Did anything appear or change on screen as a result of the previous action?** If yes → does the user need a moment to see it before the next action fires?

If you can't answer "yes" to all three for every action, the recording will look like a teleporting robot and the synthetic cursor on export won't save it.

### How narration actually works

Vorec **always** receives the full JSON — including your `narration` and `pause`. The `--skip-narration` flag on `vorec run` only controls whether Vorec polishes your draft or uses it verbatim. **Ask the user upfront which mode they want** (see the third preference in the **agent-behavior** section below):

| `--skip-narration` | When to pass it | Result |
|---|---|---|
| omitted (default) | User picked "Vorec polishes" | Vorec regenerates narration using your draft + context as grounding. Polished for pacing/tone, semantically faithful to what you wrote. |
| passed | User picked "verbatim" (legal copy, brand voice, exact wording) | Your `narration` becomes the final spoken script verbatim. One segment per action, no merging, no intro. |

**Write narration drafts for every action regardless of mode.** They're never wasted — they ground Vorec even when being rewritten. The mode flag only decides how Vorec treats the drafts.

Full action reference: the **actions** section below.
Narration guidance: the **narration-rules** section below and the **narration-styles** section below.
Writing good `context`: the **context-writing** section below.

## Step 6: Show the recording plan to the user

Before you run anything, print a short numbered plan in plain language and wait for the user's OK. This protects the user from surprises and gives them a last chance to edit the scope.

Use this format:

> Here's what the recording will do:
> 1. Open `<url>` in a fresh browser window
> 2. `<plain-language description of action 1>`
> 3. `<plain-language description of action 2>`
> 4. … (one line per action)
> 5. Stop recording and save locally (no upload yet)
>
> Narration mode: **<Vorec polishes | verbatim>** — language **<en|…>**, style **<tutorial|…>**
>
> Ready to record? (yes to start, or tell me what to change)

Keep it to one sentence per action. Don't explain selectors, timings, or credits. If the user asks to adjust, rewrite the manifest and show the plan again — never start recording until the user explicitly says yes.

## Step 7: Record (no upload yet)

```bash
npx @vorec/cli@latest run .vorec/<slug>-<timestamp>/vorec.json
```

What happens:
1. CLI confirms the app is ready (otherwise aborts with a clear error).
2. Chromium launches at a fixed position so page coords map to screen coords.
3. CLI tells the app to record the Chromium window (native 2× retina H.264).
4. For each action: Playwright fires the action, cursor path is tracked between targets.
5. On stop: the app finalizes the MP4 at `~/Movies/Vorec/recording-<ts>.mp4`.
6. CLI writes a session sidecar `recording-<ts>.vorec.json` next to the MP4 with the manifest meta + tracked actions + cursor track.
7. **No upload. No credits spent.** CLI prints the local MP4 path and exits.

**Recording quality is fixed: 2× retina, 30 fps, H.264. Do not ask the user about quality, dpr, codec, or cursor styling — those aren't configurable.**

### Verify recording dimensions before letting the run continue

When `vorec run` starts (CLI 2.30.0+), it prints a line like:

```
  Will record 1728×1079 CSS px (3456×2158 retina pixels)
```

The CLI itself aborts when dimensions fall below 1024×600. But **you should still read this line** — even when above the floor, sub-retina recordings make blurry tutorials.

Expected dimensions:

| Display | Expected min CSS px | Expected min retina px |
|---|---|---|
| Retina MacBook | ≥ 1440×900 | ≥ 2880×1800 |
| Non-Retina display | ≥ 1024×600 | n/a |

#### If the printed size is too small (or the CLI aborts on dimensions)

Do this exact sequence — tested, narrow-pattern, never touches the user's real Chrome:

```bash
# 1. Quit the Vorec Recorder app (right-click menubar icon → Quit, NOT just close window)

# 2. Kill ONLY Chrome for Testing + Playwright's bundled Chromium.
#    NEVER use "Chromium" alone, "Google Chrome" alone, or "Google Chrome Helper" —
#    those would kill the user's real browser.
pkill -9 -f "Google Chrome for Testing" 2>/dev/null || true
pkill -9 -f "playwright-core.*chromium" 2>/dev/null || true

# 3. Sleep 5 seconds — pkill is async; processes need a beat to fully exit
sleep 5

# 4. Verify zero stale processes (using the same narrow patterns)
LEFTOVER=$(ps aux | grep -E "(Google Chrome for Testing|playwright-core.*chromium)" | grep -v grep | wc -l | tr -d ' ')
if [ "$LEFTOVER" != "0" ]; then
  echo "$LEFTOVER stale processes still running — kill manually before retry"
  exit 1
fi

# 5. If you used --profile, also clear Chromium's cached window placement:
#    rm -f "<profile-dir>/Default/Preferences"
#    (CLI 2.30.0+ does this automatically inside cleanProfileForLaunch)

# 6. Reopen the recorder app, sign in, retry vorec run
```

#### Common causes (in priority order)

1. **Cumulative state leak across multiple runs** — Chromium accumulates window-placement memory; macOS ScreenCaptureKit may cache window bounds. The hard-purge above resets both. CLI 2.31.0 also auto-purges and waits for window stability before recording.
2. **Wrong manifest viewport (red herring)** — DON'T change the manifest's `viewport` field thinking it'll help. The CLI ignores it.

#### Never proceed past a small recording

If the CLI prints a sub-retina dimension and you hit Ctrl+C, the recording was free. If you watch a 3-minute recording and only then realize it's small, you've burned 3 minutes per attempt. Read the dimension line. Abort early.

### Verbatim narration mode

If you want your `narration` drafts used word-for-word (no Gemini rewrite), pass `--skip-narration` during `vorec run`. It's recorded in the sidecar and honored by the later `vorec analyze` call:

```bash
npx @vorec/cli@latest run vorec.json --skip-narration
```

## Step 8: Show the MP4 to the user and wait for approval

This is the critical gate. The recording is local-only — nothing has been sent to Vorec yet and no credits are spent. The user must confirm the recording looks right before you proceed.

After `vorec run` exits, the CLI prints a line like:

```
Local MP4: /Users/you/Movies/Vorec/recording-1776774835.mp4
```

Open it for them:

```bash
open /Users/you/Movies/Vorec/recording-1776774835.mp4
```

Then ask plainly, e.g.: *"Recording saved. Does the video look right? Say 'yes' to generate narration (costs ~10 credits), or 'no' and I'll discard and re-run."*

**Do not proceed until the user explicitly approves.** If they reject, discard the recording from the Vorec Recorder app → Library and re-run from Step 7.

## Step 9: On approval, upload + analyze

```bash
npx @vorec/cli@latest analyze "/Users/you/Movies/Vorec/recording-1776774835.mp4"
```

What happens:
1. CLI reads the `.vorec.json` sidecar next to the MP4 (title, language, style, actions, cursor track).
2. Calls `create-project` with the tracked actions + cursor track.
3. Uploads the MP4 to Vorec storage.
4. Calls `confirm-upload` (duration, dimensions, thumbnail).
5. Triggers narration generation.
6. Polls until the editor URL is ready and prints it.

**Narration cost:** duration-based. Short (≤3min) = 8 credits, 3–8min = 15, 8–15min = 25, 15–30min = 45.

## Step 10: Report

Print only the final editor URL once analysis is done. No essays.

If the user wants to tweak narration later, point them to `vorec update-narration` (below).

## Updating narration on an existing project

```bash
# Read current narration
npx @vorec/cli@latest segments --project <id> --json > segments.json

# Edit segments.json — update the "script" field on any row
npx @vorec/cli@latest update-narration segments.json --project <id>
```

Details: the **agent-behavior** section below covers when to do this automatically.

## Translating narration

```bash
# List what exists
npx @vorec/cli@latest languages --project <id>

# Pull English segments as the source of truth
npx @vorec/cli@latest segments --project <id> --json > en.json

# Write a translations file
cat > es.json <<'EOF'
[
  { "id": "<segment-id>", "script": "Spanish text…" }
]
EOF

# Push
npx @vorec/cli@latest update-translations es.json --language es --project <id>
```

Translations cost 0 credits — you (the agent) write them directly. Don't mention Vorec's internal AI models.

## When things go wrong

Read the **troubleshooting** section below. Common issues:
- `vorec check` fails → fix what it reports, don't proceed
- Chromium window not found → make sure the browser actually launched; the CLI diffs window lists
- Cursor not visible → `brew install cliclick`
- Upload fails → check the user's credit balance via `vorec check`

## What not to do

- Do not record with Playwright's `recordVideo`, FFmpeg, `screencapture`, QuickTime, or any other tool. Only the Vorec Recorder app records.
- Do not mention internal Vorec systems (no model names, provider names, credit math beyond what `vorec check` prints).
- Do not batch setup questions. Fix silently and retry.
- Do not ship a recording under 10 seconds — it's almost certainly broken. Retry with more actions.
- Do not explain quality, retina, codec, or cursor options to the user — those are not configurable.


---

# Reference rules (all mandatory — read in full)

The sections above reference these rules by topic. **All of them are mandatory** — load them by reading on. Do not skip a section because the situation "doesn't seem relevant"; you cannot reliably judge relevance without reading first.



## Rules — agent-behavior

---
name: agent-behavior
description: How the agent should communicate and act during a recording task
---

# Agent Behavior

These rules govern HOW the agent interacts with the user during a recording task. Load this file at Step 0 of every recording, **before** anything else.

## Rule 1 — Act first, ask later

When the user's request requires a blocking action (opening a browser, installing a tool, logging in, capturing a session), **do the action first**. Announce it in one sentence. Then ask any follow-up questions while the action is in progress or after it's done.

Don't:
> "Are you ready for me to open the browser?"
> "Should I launch Chromium now?"
> "Let me know when you want me to start."

Do:
> "Opening Chromium now so you can log in."
> "Launching browser at vorec.ai/login — tell me 'done' when you're on the dashboard."

The user didn't come here to answer meta-questions. They came for a recording.

## Rule 2 — Never batch 3+ questions

Ask at most **2 questions at a time**. Prefer sensible defaults over asking.

**Exceptions (both are OK to batch in one message):**
1. **Step 1 elicitation** — URL + discovery mode + goal + audience + gotchas (5 questions) in one message. All five have defaults; user can say "go". This is the ONLY time 5 questions are acceptable, because the user picking the wrong URL or letting the agent snoop their code when they didn't want to is worse than reading one larger message upfront.
2. **Step 6 preferences** — language + narration style + narration author (3 questions) in one message. All three have defaults; user can say "go".

**When stuck during discovery — ask ONE specific question, not batched.** If you hit a selector you can't resolve, a validation rule you don't understand, or a fork in the path, ask a single targeted question. This is the opposite of "prefer defaults": during discovery, asking is cheaper than guessing wrong. See SKILL.md Step 3 § "When you get stuck — ask, don't guess".

If the user explicitly says "defaults", "record with defaults", or "quick record", apply English + Tutorial style without asking again.

Don't:
> "Quick setup for your recording:
> 1. Is this a local app or a live website?
> 2. Cinematic / Natural / Fast style?
> 3. What's the target URL?
> 4. Explain first or go straight to action?
> 5. Include chapters?"

Do:
> "I'll record the vorec.ai signup flow. One thing — is this your project (I can read the code) or should I explore the page?"

Every question is a blocker. Minimize them.

Quality, resolution, codec, and cursor styling are **not** configurable — the Vorec Recorder app records at a fixed 2× retina H.264, with the real macOS cursor captured automatically. Never ask the user about those.

## Rule 3 — Keep the chat clean

The user sees only: plan, preferences, status updates, and the final result. Everything else (narration drafts, manifests, tracked actions JSON, file paths, internal logs) is saved to files silently.

**The user should NEVER see:**
- Narration text you wrote
- Manifest code
- Tracked actions JSON
- pauseMs calculations
- Internal file paths (except the final editor URL)

**The user should see:**
- The recording plan (steps overview)
- Preference questions (language, narration style)
- Status updates: "Writing manifest...", "Recording...", "Uploading..."
- The final result: editor URL

Keep updates to **1-2 sentences**. The user wants a video, not a lecture.

Don't:
> "I found two blockers I need to resolve with you before recording. The first is that we don't have a valid login session for vorec.ai — there's an old .vorec/storageState.json, but it's for localhost:3000 and has 0 cookies. Useless for production. The second is that I need to capture a fresh session. Playwright will open Chromium → you log in manually once → I save cookies + localStorage → all future recordings skip the login. Let me also grab the dashboard 'new video' flow selectors while we decide."

Do:
> "No valid session yet. Opening Chromium for login now."

## Rule 4 — Prefer sensible defaults, but ALWAYS ask narration preferences

For technical decisions (mode detection, wait strategy, selectors), use defaults and proceed. Don't ask.

**Always ask the three narration preferences** before writing the manifest unless the user requested defaults:
- Language
- Narration style
- Narration author (who writes the final spoken script — Vorec or you)

Bundle them into ONE message. They all have defaults so the user can just say "go".

### How to ask narration author

> "Should Vorec write the final narration (polishes the drafts I include, better pacing) or should my drafts be used word-for-word (for legal copy, brand voice, exact wording you've already written)?"

- **Vorec polishes (default)** → run without `--skip-narration`. Agent still writes `narration` drafts for every action — Vorec uses them as semantic grounding and rewrites in the chosen style.
- **Verbatim** → pass `--skip-narration` to `vorec run`. Agent's draft per action becomes the final spoken script word-for-word. One segment per action, no merging, no intro generation.

Write narration drafts for every action regardless — they are always sent to Vorec. The flag only controls whether Vorec treats them as drafts or final.

| Thing | Default | Ask? |
|---|---|---|
| **App + permission + CLI key** | MUST pass `vorec check` | Block if failing |
| **Language** | English | **Always ask** |
| **Narration style** | Tutorial | **Always ask** |
| **Narration author** | Vorec polishes | **Always ask** |
| Quality / codec / retina / cursor | Fixed by the app | **Never ask** |
| Mode (Connected/Explore) | Auto-detect | Only if unsure |
| Scope | Minimum-viable | Only if user says "full walkthrough" |
| Test data | Generated fresh | Only if user provides specific values |
| Session | Reuse if valid | Never ask |

## Rule 5 — Use `--headed` for any interactive playwright-cli step

Recording itself is done by the Vorec Recorder app, not playwright-cli. But you'll still use `playwright-cli` for **exploration** (finding selectors) and **session capture** (user login).

`playwright-cli open` **defaults to headless** — the user won't see the window. For anything the user needs to see or do:

- **User needs to log in** → `playwright-cli open --headed <url>`
- **User needs to validate a page** → `playwright-cli open --headed <url>`
- **Pure reconnaissance** (you grep the snapshot, user does nothing) → default headless is fine
- **When in doubt** → use `--headed`

See [./cli-commands.md](./cli-commands.md) for details.

## Rule 6 — Re-check state before blocking the user

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

## Rule 7 — When genuinely stuck, ask the smallest possible question

If you hit something you can't decide, ask **ONE specific question** — not five.

Don't:
> "What scope? What file? What style? What language? Should I clear the cart?"

Do:
> "The cart has 3 items from an earlier session. Clear them or record as-is?"

## Rule 8 — Tell the user what you're doing at every step

The user should always know what's happening. Give clear status updates in plain language — not technical jargon.

**Before writing the manifest:**
> "Writing vorec.json now — it describes the flow the app will record."

**Before recording:**
> "Here's the plan:
> 1. Open vorec.ai/signup
> 2. Enter email and password
> 3. Click Create Account
> 4. Wait for the welcome page
>
> Ready? Starting the recording now."

**During recording:**
> "Recording in progress — the script is walking through the signup flow now."

**After recording:**
> "Done! Recorded 15 seconds with 6 tracked actions. Please review the video."

**During upload:**
> "Uploading video and action data to Vorec..."

**After upload:**
> "Your tutorial is ready! Open the editor: https://vorec.ai/editor?project=abc"

**Never say:**
- "Let me think about the next step..."
- "I'm about to run a command. Is that okay?"
- "Here's what I'm going to do in detail: first I'll..."
- Technical details like "Capturing at 2× retina with H.264 high profile..."

## Rule 9 — On failure, fix silently when you can

If a command fails because of a known-fixable issue, **fix it and retry** rather than reporting the failure to the user.

**Fix silently:**
- `playwright-cli open` opened headless → retry with `--headed`
- `.mp4` file path rejected → retry inside allowed roots
- Screencast already running → `close-all` and retry
- Locator strict-mode violation → add `.first()` or `exact: true`
- Cart has leftover items → clear them then proceed

**Report to user:**
- Login required (needs their input)
- Payment/sensitive action required (needs their decision)
- Ambiguous flow (two plausible next clicks)
- Test data validation failed in a way you can't predict

## Rule 10 — End with a useful link or file path

When the task is done, the final message should contain exactly ONE actionable result:

Do: "Done. Video: `/Users/you/recordings/signup-123.mp4`"
Do: "Done. Editor: https://vorec.ai/editor?project=xyz"
Don't: "I have successfully completed the recording. Here's a summary of what was accomplished: [wall of text]"

The user wants the output. Give them the output.

---

## The pattern, in one sentence

> **Do the work first. Announce in one line. Ask at most one thing at a time. End with a link.**

If an action in the plugin's workflow makes you want to ask a question, re-read this file and ask yourself: **can I just do it with a sensible default?**


## Rules — recording-types

---
name: recording-types
description: Classify what kind of video is being recorded so the agent picks the right discovery and narration behavior
---

# Recording Types

Classify every recording request before planning the flow. The type controls what the agent optimizes for.

## Types

| Type | User wording | Optimize for |
|---|---|---|
| `task_tutorial` | "how to create", "show how to set up", "record checkout", "make a tutorial" | Successful completion, valid data, assertions, clean end state |
| `website_tour` | "showcase this site", "tour the homepage", "explain the landing page" | Content-aware scrolling, section coverage, no unnecessary clicks |
| `bug_reproduction` | "record the bug", "show the error", "it breaks when..." | Faithful reproduction, visible error, diagnostic context |
| `ux_review` | "review this website", "compare competitor", "critique flow" | Observations, friction points, persona/style, no account-changing actions |

## Defaults

- If the user asks "how to do X", default to `task_tutorial`.
- If the user gives only a URL and asks for a demo/tour, default to `website_tour`.
- If the user mentions broken behavior, default to `bug_reproduction`.
- If the user asks for critique, competitor analysis, or opinionated commentary, default to `ux_review`.

## Behavior by Type

### Task Tutorial

The final video should show a known-good path from start to success.

Required before recording:
- Entry action
- Required fields
- Valid demo values
- Primary submit/create buttons
- Button enabling rules, if visible
- Success assertion
- Sensitive action review

### Website Tour

The final video should explain visible page content with purposeful scrolling.

Required before recording:
- 3-5 meaningful sections
- Scroll target for each section
- Visual goal for each section
- No unnecessary form submissions

### Bug Reproduction

The final video should preserve the bug, not hide it.

Required before recording:
- Initial state
- Exact reproduction steps
- Expected result
- Actual result
- Error message or broken UI evidence

### UX Review

The final video may include opinionated commentary, but must not perform sensitive actions.

Required before recording:
- Pages/sections reviewed
- Persona or tone
- Friction points
- Stop conditions for auth, payment, or destructive actions

## Examples (for each recording type)

| User says | Mode | Type | Priority |
|---|---|---|---|
| "Record how to sign up on acme.com" | Explore | `task_tutorial` | Find signup form, valid inputs, success page |
| "Record my dashboard so I can show investors" | Connected (codebase) or Explore (hosted) | `website_tour` | 3–5 meaningful sections, purposeful scrolling |
| "Record the bug where the cart doubles when I refresh" | Connected or Explore | `bug_reproduction` | Exact steps, visible error, preserve the glitch |
| "Review stripe.com's pricing page vs ours" | Explore | `ux_review` | Friction points, no account-changing actions |
| "Show how to create a product in our Shopify app" | Explore | `task_tutorial` | Open through admin.shopify.com; full-window recording, user crops the Admin shell in the editor |


## Rules — scroll

---
name: scroll
description: When and how to use scroll actions — SPA reset trap, smooth scroll, button-reveal pattern
---

# Scroll Management

Scrolling is the most common source of "broken" recordings — the click fires but the new page opens off-screen because scroll position survived an SPA state change.

## Smooth scroll is automatic (CLI 2.21+)

The CLI now animates every `scroll` action in ~25px increments at 50fps so the camera glides instead of snapping. You don't need to do anything — just request a delta and it animates over ~400-1500ms depending on size.

## Reveal-before-click

When the next button is below the viewport (typical for Next / Submit / Generate at the bottom of long forms), add a visible `scroll` BEFORE the click so the viewer's eye follows the cursor down to the button.

```json
{ "type": "scroll", "y": 400, "pause": 600 },
{ "type": "click", "selector": "text=Generate", "pause": 1500, "primary": true }
```

Without the scroll, the cursor teleports to a button the viewer can't see, then the page jumps — looks broken.

## SPA vs real navigation — the reset trap

| Click outcome | Browser scroll behavior | What you must do |
|--------------|------------------------|------------------|
| URL changes (real navigation) | Browser auto-resets scroll to top | Nothing |
| Same URL, new content (SPA wizard / multi-step / tab swap) | Scroll position **persists** | Add a `scroll` with negative `y` AFTER the click |

The SPA case is what bites: you scroll down 500px to reveal the Next button, click it, the wizard advances to step 3 — but step 3's heading is still 500px above the viewport because scroll didn't reset.

### Fix pattern

```json
{ "type": "scroll", "y": 400,  "pause": 600 },                   // reveal Next
{ "type": "click",  "selector": "text=Next", "pause": 1500 },    // SPA advances
{ "type": "scroll", "y": -2000, "pause": 700 }                   // reset to top
```

`y: -2000` is safe — the scroll is clamped at 0, so over-scrolling up just stops at the top.

## When NOT to add a reset scroll

- The next click is also at the bottom (no reset needed, you're already there)
- The "next page" is a modal that overlays the current scroll (modal opens at top regardless)
- The URL actually changed (browser handles it)

## How to tell if a click triggers an SPA change vs real nav

During discovery, check the URL pattern:
- `/wizard/step1` → `/wizard/step2` = real nav, no reset needed
- `/wizard` for both steps = SPA, reset needed
- Modal-only flows (URL never changes) = SPA, but usually no reset (modal scrolls itself)

If you're unsure, add the reset scroll anyway — it's a no-op when scroll is already at 0.

## Scroll speed sanity

Default `y: 300` covers about a third of a 1080p viewport. Useful values:
- `y: 200-400` — reveal a button just below the fold
- `y: 600-900` — full-page-down (next section)
- `y: -2000` — reset to top after SPA state change
- `y: 1500-3000` — long page tour (use sparingly, gets boring)

Each scroll takes ~400-1500ms to complete depending on distance. Don't stack many large scrolls back-to-back unless you're doing a deliberate "tour the page" beat.


## Rules — pacing

---
name: pacing
description: How the agent calculates pause duration from narration word count — no hardcoded values
---

# Pacing

## The only rule

Every pause is calculated from the narration you wrote for that action:

```js
const pauseFor = (narration) =>
  Math.max(1500, Math.ceil(narration.split(/\s+/).filter(Boolean).length * 350) + 500);
```

- `350ms per word` = ~2.86 words/sec (measured Vorec TTS rate)
- `+500ms` = breathing buffer AFTER speech ends, so narration doesn't collide with the next click
- `1500ms` minimum — even silent transitions need a beat

**`pauseMs` = speaking time + buffer. Not just speaking time.**
Example: a 20-word line speaks in 7000ms, so its `pauseMs` is **7500ms** (speech + 500ms buffer).

## Never eyeball durations

When drafting narration for the user, **never label lines with approximate seconds** like `(6s)` or `~5s`. Always run the formula and write the exact integer `pauseMs`. Eyeballing causes freeze-sync (narration overflows the pause).

Do: `"Click Submit." → 2 words → pauseMs: 1500`
Don't: `"Click Submit." (2s)` ← no formula applied

**Agent workflow:** write narration → count words → run formula → show exact `pauseMs` integer.

## Examples

| Narration | Words | pauseFor() |
|-----------|-------|-----------|
| "Click Submit." | 2 | 1500ms (minimum) |
| "Click Save. The dialog closes." | 5 | 2250ms |
| "Now let's create a new project — click New Project in the top-right." | 12 | 4700ms |
| "This is where the real magic happens. Every action you take here updates in real time, and the preview on the right shows exactly what your customers will see." | 28 | 10300ms |

## Typing speed per style

Typing speed IS style-dependent (affects how human the typing looks):

```js
const TYPING_DELAY = {
  exact: 50, concise: 60, tutorial: 80, professional: 80,
  conversational: 100, storytelling: 100, academic: 100, persuasive: 80,
}[STYLE];
```

## General rules

- **Write narration first, pause second** — never set pauseMs before the narration exists
- **Split by visual moments** — one tracked action = one thing the viewer sees changing
- **No `fill()` for tracked actions** — always `slowType` so the typing is visible
- **Group or split** — if you need 20 words over 3 clicks in 2 seconds, either merge into one action with one long narration, or split into 3 actions each with fitting narration

See [./narration-rules.md](./narration-rules.md) for how to write narration in the chosen style. See [./context-writing.md](./context-writing.md) for context field rules.


## Rules — actions

---
name: action-reference
description: Manifest action types, tracked action fields, and how Vorec uses them for narration
---

# Action Reference

Every tracked action needs **`description`** (short timeline label), **`context`** (rich scene description), and usually **`narration`** (the spoken script for that visual moment).

## The two text fields

| Field | Length | Purpose | Example |
|-------|--------|---------|---------|
| `description` | 5-10 words | Timeline label, what the user does | `"Click the Create Project button"` |
| `context` | 1-2 sentences | Scene reference for the AI and editor. Describe what happens, what appears on screen, why it matters. | `"Clicks the blue Create Project button. A dialog slides in with title and template fields."` |
| `narration` | 1 spoken segment | Primary voice-over script for this visual moment. Must fit the explicit `pause`. | `"Click Create Project. The setup dialog opens with the first fields ready to fill in."` |

**Good descriptions:** "Open the create dialog", "Enter the project name"
**Bad descriptions:** "button:has-text('Create')", "input[type='email']"

The description is the intent, not the selector.

**Good context:** "Clicks the New Project button in the top-right corner. A creation dialog appears with fields for project title, template selection, and a color picker."
**Bad context:** "Click button" (too vague — Vorec can't write useful narration from this)

## Action Types

| Type | Extra fields | What It Does |
|------|-------------|-------------|
| `narrate` | — | Pause — describe scene. No interaction. |
| `click` | — | Click an element |
| `type` | `typed_text` | Type text into an input |
| `select` | `selected_value` | Pick from dropdown |
| `hover` | — | Hover to highlight |
| `scroll` | — | Scroll down |
| `wait` | — | Pause for animations |
| `navigate` | — | Navigate to page |

All actions also have: `description`, `context`, `target`, `timestamp`, `coordinates`. Most actions also include `narration` and `pause`.

## When to use `narrate`

Don't add to every action — use judgment:
- User asked to explain a page/feature
- Complex page would confuse viewers
- Something isn't obvious from the recording alone
- Between sections to provide overview or transition

`narrate` explains **how things work**, not what's visible.

## Document ALL actions

Not just clicks. If the user types text → `type` action with `typed_text`. Dropdown → `select` with `selected_value`. Vorec needs the full workflow to generate accurate narration.

## How Vorec uses tracked actions

1. **Timeline** — each action appears as a color-coded dot at its `timestamp`
2. **Narration** — Vorec uses `narration` as the primary voice-over script and `context` as scene reference/fallback
3. **Auto-zoom** — click `coordinates` become zoom targets (centered on the element)
4. **Cursor effects** — click ripples render at `coordinates` position
5. **Click markers** — `description` shown as tooltip, `target` as element label
6. **Primary clicks** — segments reference actions via `click_refs[]` indexes; `primary_click` gets a gold star on timeline


## Rules — end-state-verify

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


## Rules — validation

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

When an action produces a visible error during exploration or dry-run, fix it there (find the valid input, correct the selector, add the missing step) and remember the fix for when you write `vorec.json`. The final recording should replay the known-good path. Only include an error-and-fix sequence in the final video if the user explicitly asked for a troubleshooting tutorial.

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


## Rules — context-writing

---
name: context-writing
description: How to write great context fields for tracked actions — the key to quality narration
---

# Writing Context for Tracked Actions

The `context` field on each tracked action tells Vorec what is on screen and what changed. The `narration` field is the spoken script, but better context still gives the AI and editor the scene reference they need.

## CRITICAL: Narration length determines video length

Every tracked action has an explicit `pause` sized from the `narration` field. Long narration creates long pauses in the video. Context is not timed directly, but bloated context tends to produce bloated narration and weaker scene references.

Keep contexts **tight and action-sized**:

| Action type | Ideal context length |
|-------------|---------------------|
| Navigation click (page changes) | 8-15 words |
| Form submit / primary action | 10-20 words |
| Type input | 8-12 words |
| Hover/narrate (explains something) | 15-25 words |
| Repeated actions (adding items) | 5-8 words (terse) |

The agent writes the final `narration` field separately. Use `context` to give the AI and editor a compact scene reference: what is visible, what changes, and why the action matters.

## CRITICAL: For repeated actions (loops), drop context to bare minimum

When adding 5+ of the same thing (rows, items, entries):
- **First item**: full context explaining the process (20 words)
- **Middle items**: bare minimum, no repetition (3-6 words: "Adding another.", "Fifth one in.", "List grows.")
- **Last item**: brief wrap-up (8-12 words: "Last one — eight total, ready to continue.")

This cuts 8 × 20 words = 160 words (53s pause) down to ~60 words (20s pause). Same information, third the time.

## The three text fields

| Field | Length | Purpose | Example |
|-------|--------|---------|---------|
| `name` | 3-5 words | Timeline dot label | `"New Project"` |
| `description` | 5-15 words | What the user is doing | `"Click New Project to open the creation dialog"` |
| `context` | 1-3 sentences | Scene description for the AI/editor | `"Clicks the New Project button in the top-right corner. A dialog slides in with fields for name, description, and visibility settings."` |

## The 7 rules

### Rule 1 — Describe what you SEE, not just what you click

The viewer is watching a screen they've never seen before. Paint the picture.

Bad: `"Click the Settings button"`
Good: `"The Settings button is in the sidebar, below the team members list. Clicks it — the settings panel opens with tabs for General, Billing, and Notifications."`

### Rule 2 — Set the scene BEFORE the action

Tell the viewer where they are and what they're looking at before describing what you do.

Bad: `"Clicks Next to continue"`
Good: `"The form is filled out — name, email, and role are all set. Clicks Next to move to the permissions step."`

### Rule 3 — React to what CHANGED after the action

After every click, describe what happened on screen. Modals, page transitions, loading states, success messages — the viewer needs to know.

Bad: `"Clicks Save"`
Good: `"Clicks Save. A green toast notification appears confirming the changes were saved. The dialog closes and the updated value shows in the table."`

### Rule 4 — Group by intent, not by individual click

Don't narrate every micro-action. Group related actions into one meaningful step.

Bad (3 separate actions):
- `"Click the email field"`
- `"Type the email address"`
- `"Click the password field"`

Good (on the type action):
- `"Types the email address into the login form. The password field is next — it requires at least 8 characters with one uppercase letter."`

### Rule 5 — Orient the viewer on new pages

When navigation happens, the first action on the new page must describe what appeared.

Good examples:
- `"The dashboard loads showing three sections: recent projects on the left, team activity in the center, and usage stats on the right."`
- `"A modal appears with a multi-step form. The progress bar at the top shows Step 1 of 3: Basic Info."`
- `"The page redirects to the billing section. The current plan is highlighted in blue, with upgrade options below."`

### Rule 6 — Vary context for repeated actions

When adding multiple items, tell a progression story. The agent types realistic demo data (real-looking names, emails, values) but the context must frame them as examples — the viewer enters their own.

**First item — explain the PROCESS (how to add):**
`"Types a name and clicks Add. Enter each of your team members here — the list updates as you go."`

**Second item — reinforce the pattern:**
`"Adding another one. Same process — type the name, hit Add."`

**Middle item — show PROGRESS:**
`"Four added so far. The list is filling up on the right side."`

**Last item — what happens NEXT:**
`"Last one. The team is complete — ready to assign roles and set permissions."`

**Never narrate the specific demo values.** The viewer should hear "enter your team members" not the exact names you typed in as examples.

### Rule 7 — Every tracked action MUST have context

No empty context fields. If you track it, you describe it.

| Type | What to include in context |
|------|---------------------------|
| `click` | What you see → what you click → what changed after |
| `type` | What field → what you typed → what the field controls |
| `narrate` | Full description of what's currently on screen |
| `scroll` | What you're scrolling toward → what comes into view |
| `select` | What dropdown → what you picked → what it affects |
| `navigate` | Where you're going → why → what the new page shows |

## Think about the EFFECT

Every action causes a visual change. Name the effect in your context:

| Effect | How to describe it |
|--------|-------------------|
| Page navigation | `"The page navigates to the settings panel, showing..."` |
| Modal/dialog opens | `"A confirmation dialog appears asking..."` |
| Modal closes | `"The dialog closes, returning to the main view where..."` |
| Tab switch | `"Switching to the Activity tab, which shows a timeline of..."` |
| Dropdown opens | `"The dropdown expands showing options for..."` |
| Content loads | `"The results appear after a brief loading spinner, showing..."` |
| Success state | `"A green checkmark appears confirming..."` |
| Error state | `"A red warning appears saying..."` |
| Toggle change | `"Toggles dark mode on. The entire interface switches to..."` |

## Context checklist

Before moving to the next action, check:
- [ ] Did I describe what's ON SCREEN (not just what I clicked)?
- [ ] Did I mention what CHANGED after the action?
- [ ] Did I orient the viewer if this is a new page/section?
- [ ] Is the context DIFFERENT from the previous action's context?
- [ ] Would someone listening (not watching) understand what happened?
- [ ] For type actions — did I mention WHAT was typed and WHY?
- [ ] For repeated actions — does this context add new information?

## Demo data vs real choices

When recording, the agent fills forms with demo data. Vorec's narration must distinguish between data the agent made up (examples) and real choices the user would actually make.

| Signal | What it means | How to write context |
|--------|--------------|---------------------|
| Agent TYPED text with keyboard | Demo data — the value doesn't matter, the field does | `"Types a project name into the title field. You can use any name here — this is where your project appears in the dashboard."` |
| Agent CLICKED to choose from options | Real choice — the option matters | `"Selects the Pro plan. This unlocks advanced features like custom domains and team collaboration."` |
| Button or menu name clicked | Real UI element — always mention it | `"Clicks Export. A dropdown shows PDF, PNG, and SVG options."` |

**Rules:**
1. **Typed text = demo data** → narrate the PURPOSE of the field, not the specific value. Say "enter your project name" not "type 'My Project'"
2. **Clicked from a list = real choice** → mention what was selected and why it matters
3. **When in doubt → go generic** — safer to say "fill in the field" than dictate a specific value the viewer should copy

**In the context field:**

Bad: `"Types 'Q4 Marketing Site' as the project name."`
Good: `"Types a name for the project. This is how it appears in your dashboard — pick something descriptive for your team."`

Bad: `"Types 'sarah@gmail.com' into the email field."`  
Good: `"Enters an email address. This will be the account login — use your real email here."`

Good (for a real choice): `"Selects 'Monthly' billing. This charges once a month instead of annually — you can switch later in settings."`

## How Vorec uses your context

Vorec reads each action like this:

```
[0] 2.5s — narrate "Dashboard" — The dashboard shows three project cards...
[1] 8.3s — click "New Project" ★ — Clicks New Project. A creation dialog slides in...
[2] 14.1s — type "Project name" (typed: "Q4 Marketing Site") — Types the project name...
[3] 22.7s — click "Create" ★ — Clicks Create. The project is created and the editor opens...
```

The `narration` field is the primary spoken script. The AI still trusts your context as scene reference — if you say a modal appeared, it treats that as true. If your context is empty or generic, the editor and any regenerated narration will be empty and generic.

**You are the eyes. Write what you see.**


## Rules — narration-rules

---
name: narration-rules
description: The exact narration rules Vorec AI uses — agent must follow these when writing narration
---

# Narration Rules

These are the EXACT rules Vorec's AI follows when generating voice-over. When you write the `narration` field on each tracked action, follow these rules. Then Vorec's AI validates your narration matches the chosen style and uses it as the final script.

## Write like a friend, not a spec

The narration explains the CONCEPT — not the exact literal input. Specific values the user types (names, emails, titles, IDs) are just examples for the recording. Never parrot them in the script.

Don't: "Type 'Padel Night Tournament' in the name field and click Next."
Do:    "Give your session a name, then hit Next."

Don't: "Click Female to set Elena's gender, then save."
Do:    "Pick your gender, then save."

Don't: "Types sarah@gmail.com into the email field."
Do:    "Enter your email."

Don't: "Names the project Q4 Marketing."
Do:    "Give the project a name."

Rule: if the value is **something the viewer would answer with their own data** (name, email, title, gender, photo, currency), narrate the PURPOSE of the field. If the value is **a feature/plan/mode where the choice drives the tutorial** (Pro vs Free, Dark vs Light), mention the option but frame it as "pick the X that fits" not "use this one".

## Set the scene on every new page or state

When a new page, modal, wizard step, tab, or dashboard appears, the FIRST `narrate` beat on that surface must do three things:

1. **Name the surface** — "Step three: settings", "The dashboard loads", "A confirmation dialog opens"
2. **Describe what's visible** — what sections, what defaults, what choices
3. **Explain the meaningful options** — what the viewer can adjust, what each control does

Don't just narrate the next click — narrate the arrival.

Don't (only describes the click):
> "Click Generate Tournament."

Do (sets the scene + then leads to the click):
> "Step three: settings. The tool works out courts and rounds for you. Points per match default to 32, tiebreak on point difference. Pairing strategy is Top vs Top — the Mexicano signature. Hit Generate Tournament."

Apply this on:
- Settings / config pages → describe defaults and which knobs matter
- Result / dashboard pages → describe what the user is now looking at
- Modals → describe what the dialog is asking for
- Wizard steps → name the step and what this step is for
- Tab switches → name the tab, summarize what's in it

If you skip the scene-setter, the viewer hears clicks happening on screens they don't understand.

## Plan segments first, distribute actions under them

Do NOT write one narration per action. That produces a checklist feel — every click narrated separately, voice playing constantly. Instead, plan the recording as **3-8 semantic beats**, one `narrate` block per beat, with 2-5 silent actions executing underneath each.

### The pattern

```
[narrate]  carries the voice for this beat          pause = narration speaking time
[action 1]  silent — no narration field              pause = short, just UI settle
[action 2]  silent
[action 3]  silent
```

Voice plays in full on the `narrate` block, then silent actions fire under their own short pauses. The voice finishes just before or as the silent actions start → perfect lead-up sync. No overlap, no overflow.

### CRITICAL — silent actions still need `context`, they just skip `narration`

The segment-first pattern removes voice from individual clicks. It does NOT remove grounding. Every action (narrate, click, type, scroll, hover, select) MUST have a `context` field describing what's on screen and what changes. Gemini uses `context` as its scene reference when rewriting your draft narration — if silent clicks have only a one-line `description`, Gemini ends up writing narration on partial information and fills the gaps by inventing detail or copying your demo values into the script.

What each field carries:

| Field | When to write | Required on |
|-------|---------------|-------------|
| `description` | Timeline label (5-10 words) | Every action |
| `context` | Scene reference (1-3 sentences, what's visible + what changed) | Every action |
| `narration` | Spoken script | Only `narrate` blocks (and rare ≤5-word inline callouts) |
| `pause` | Hold time in ms | Every action |

Do (silent type action still has `context`):
```json
{
  "type": "type",
  "selector": "[placeholder^='Player']",
  "text": "Carlos",
  "description": "Type player name",
  "context": "Adding the fifth player. The gender toggle flipped to male one step ago and stays there — each subsequent add reuses the current toggle state.",
  "pause": 1500
}
```

Don't (silent action with no context, Gemini writes narration blind):
```json
{
  "type": "type",
  "selector": "[placeholder^='Player']",
  "text": "Carlos",
  "description": "First male player",
  "pause": 1500
}
```

The context on silent actions is what keeps Gemini's rewrites anchored to the real UI instead of drifting to the demo values.

### What counts as a new segment

Start a new `narrate` block when:
- Page / route changes
- Modal or dialog opens
- A new cluster of related fields or steps begins
- The "why" of the next beat differs from the current one

Don't break segments arbitrarily — follow the flow's natural joints.

### Segment pacing budget

For each segment:
- `narrate.pause` = `words × 350ms + 200ms` (voice finishes 200ms before silent actions start)
- Silent actions get short pauses (500-1500ms) — just enough for UI to settle
- Total segment duration = narrate pause + sum(silent action pauses)

### Concrete example — signup flow in Tutorial style

```json
[
  { "type": "narrate",
    "narration": "Alright, let's get you set up — it's just four fields and a button, about ten seconds.",
    "context": "We're on the home page. The Sign up button is in the top-right. Clicking it opens the signup form inline.",
    "pause": 6500 },
  { "type": "click",
    "description": "Open signup",
    "context": "The signup form slides in with four fields: email, password, an agree-to-terms checkbox, and a Create account button.",
    "pause": 1200 },

  { "type": "narrate",
    "narration": "Pop in your email and password, then tick the box to accept the terms.",
    "context": "The form is now ready for input. Email field is focused.",
    "pause": 5600 },
  { "type": "type",
    "description": "Email",
    "context": "Typing a valid email into the first field. The field turns green once a valid format is detected.",
    "pause": 1500 },
  { "type": "type",
    "description": "Password",
    "context": "Typing a password. A strength meter appears under the field and fills green as the password grows.",
    "pause": 1500 },
  { "type": "click",
    "description": "Agree",
    "context": "Checks the terms checkbox. The Create account button enables once all required fields and the checkbox are satisfied.",
    "pause": 800 },

  { "type": "narrate",
    "narration": "Hit Create account — your dashboard loads in a couple seconds.",
    "context": "All fields valid; the Create account button is now the only remaining step.",
    "pause": 4500 },
  { "type": "click",
    "description": "Create account",
    "context": "Submits the signup. A brief loading state, then the URL changes and the dashboard loads.",
    "pause": 2000, "primary": true },

  { "type": "narrate",
    "narration": "And there you go — you're in.",
    "context": "Dashboard is now visible: left sidebar with navigation, main area with an empty-state prompting to create the first project.",
    "pause": 2500 }
]
```

Three `narrate` beats, six silent actions. 16 words of lecture → zero. 4 beats of narration that land in sync with the visuals → perfect.

### The same flow in other styles (structure identical, words change)

**Conversational:** *"Okay so signing up is pretty quick — four fields, hit the button, you're done."* → *"Just your email, a password, and tick the terms box."* → *"Smash Create — should be instant."* → *"Boom. That's the dashboard."*

**Persuasive:** *"Watch this — full account in under ten seconds."* → *"Email. Password. Agree. That's it."* → *"One click."* → *"You're already inside."*

**Professional:** *"In this walkthrough, we'll create an account — a four-field form plus submission."* → *"Provide a valid email and password, then acknowledge the terms."* → *"Submit the form to proceed."* → *"The dashboard loads, confirming the account is active."*

Structure stays constant: 3 `narrate` blocks + silent actions underneath. Style picks the words.

### When inline narration on an action is OK

Skip the `narrate` block when the beat is ≤5 words and purely reactive:

```json
{ "type": "click", "description": "Undo", "narration": "Undo.", "pause": 1200 }
```

Use inline for short callouts BETWEEN segments, not as a replacement for segment planning.

## Time sentences to action timestamps

Narration is spoken over a timeline anchored by `timestamp` values on each action. If your narration is longer than the gap to the next action, it overflows and either freezes the video (freeze-sync) or runs over the next visual event.

Before writing narration for an action:

1. Estimate the gap until the next action fires (or until the recording ends).
2. Compute max words that fit: `max_words = floor((gap_ms - 500) / 350)`.
3. Write narration ≤ that word count for this action.

Speaking rate: **350ms per word** (~2.86 words/sec, Vorec TTS measured). 500ms trailing buffer so narration doesn't collide with the next click.

### Example

Action A fires at `timestamp: 2.4s`, next action B fires at `timestamp: 5.0s`.
Gap = 2600ms. Subtract 500ms buffer = 2100ms of speech.
Max words = 2100 / 350 = **6 words**.

Narration options:
- Do: *"Click Submit — the form processes."* (5 words, fits)
- Don't: *"Click Submit — the form processes and will show a success banner once done."* (12 words, overflows by 1.5s into the next action)

### When you need more words than the gap allows

- Option A: shorten the narration (preferred)
- Option B: delay the next action by increasing the current action's `pause`
- Option C: move the long explanation into a preceding `narrate` action (no click) with its own dedicated pause

A sentence describing an action should BEGIN just before that action's timestamp — not after it (sounds confused), and not 5 seconds before (sounds disconnected). If a segment has 10 seconds of actions and you write 30 seconds of narration, it will run into the next segment.

## Universal rules (apply to EVERY style)

### Perception
- You are writing what will be SPOKEN over a screen recording. Describe what's on screen, not just what was clicked.
- Before narrating an action, briefly set the scene: what's on screen, what area we're in, what the goal is.
- When something visual changes (modal opens, data loads, page transitions), REACT to it — describe what appeared.
- Group actions by INTENT, not by individual click. "Let's export this as a PNG" instead of "Click File, click Export, choose PNG".
- Use natural transitions between steps. Each segment should flow into the next like a real person talking.

### Pacing
- Narration speed: **~3 words per second** when spoken.
- Each narration must fit BEFORE the next action starts.
- If the gap is short, write fewer words. Never sacrifice timing for detail.

### Demo data vs real instructions
This is a tutorial recording. You typed values into forms as EXAMPLES. The viewer will use their own data.

**Rule 1 — User-typed text is always demo data**
Anything typed into an input, text area, search box, or form is demo data. Narrate what the field IS FOR, not the specific value. "Enter your project name" not "Type 'Q4 Site'".

**Rule 2 — Fixed choices are real instructions**
When you SELECTED from options (dropdown, radio, toggle, tab, plan/template/format), the choice matters. Reference what was selected so the viewer makes the same choice.

**Rule 3 — How to tell:**
- Did you TYPE it with keyboard? → Demo data. Narrate the purpose.
- Did you CLICK to choose from options? → Real choice. Mention it.
- Is it a button/menu/UI name? → Real. Reference by name.

**Rule 4 — When in doubt:**
Go generic. "Fill in the required field" is safer than dictating a specific value.

---

## Narration structure

Every action narration must add value. If the action is self-explanatory, keep narration short. If something new appears (dialog, page change), describe what appeared.

If you have nothing meaningful to say over an action, don't write narration for it — just track the action with context only and let Vorec handle it.

### What makes narration "no sense"
- Narrating what the user can obviously see ("The button says Submit" — they can read)
- Repeating the same idea across multiple actions ("Adding another item" × 7)
- Generic filler ("Now we'll move on to the next step")
- Describing the UI element instead of the intent ("This is a blue button with rounded corners")

### What makes narration valuable
- Explaining WHY ("We pick this option because it gives the best balance")
- Describing what CHANGED ("The dashboard now shows the new project at the top")
- Orienting on new pages ("This is the settings panel — the key options are on the left")
- Giving context the viewer needs ("This field accepts any email — use yours here")

### Hard cap: 15 words per single action

No single action's narration may exceed **15 words**. This is not a soft guideline — it's a hard cap. At 15 words × 350ms = 5250ms speaking time, the video is already holding still for over 5 seconds on one action. Longer than that, the viewer feels lectured to.

If you need more than 15 words to cover a moment, SPLIT into multiple actions:
- Move scene-setting / explainer content into a preceding `narrate` action (no click)
- Keep the narration on the actual interaction short and focused

Do (11 words): "Click Submit — the order processes for a moment before confirming."
Don't (22 words): "Click Submit — the order now processes. You'll see a spinner for about two seconds, then a confirmation dialog appears with the order number."

Fix by splitting:
```
[click] → "Click Submit — the order processes."                     (5 words)
[narrate] → "A confirmation dialog appears with the order number." (8 words)
```

### When to use inline narration vs a separate `narrate` action

Two valid patterns. Pick based on **what the narration is DOING**:

**Inline narration** — attach `narration` to a click / type / scroll action. Use when:
- The narration is SHORT (≤5 words): *"Click Save."* / *"Add."* / *"Now we're in."*
- It's a direct confirmation of the interaction itself
- The viewer's eye is already on the element being clicked

**Separate `narrate` action** — zero-click, just pause + speech. Use when:
- The narration is >8 words (scene-setting, explaining, teaching)
- You need to describe something that just APPEARED (dialog, toast, loaded page)
- You're orienting the viewer on a new page before they interact with it
- The narration is about MEANING, not about the click

**Rule of thumb**: if the narration is about *"here's what I'm clicking"*, inline. If it's about *"here's what this screen means"* or *"here's what just happened"*, use `narrate`.

Be consistent WITHIN a recording. Don't mix patterns randomly — pick one and use it for similar-type moments throughout.

### Transitions between actions

Narration should FLOW like a real person talking. Adjacent actions shouldn't feel like disconnected sentences.

Don't (abrupt) (each narration is an isolated sentence):
```
[click option]  → "Click the option — it highlights."
[click confirm] → "Confirm. Row added."
```

Do (bridged) (second narration picks up from the first):
```
[click option]   → "Pick the option and confirm below."
[click confirm]  → (no narration — the previous one covered it)
```

Do (group into one longer beat when clicks are ≤2s apart):
```
[click option + click confirm as ONE grouped action]
  → "Pick the option and confirm — the row is added in one beat."  (12 words, fits within grouped pause)
```

### Style-specific transition notes

- **Tutorial** — use soft bridges ("*Great, now...*", "*Perfect — next...*")
- **Conversational** — casual transitions ("*Alright, so...*", "*Next up...*")
- **Concise / Exact** — NO transitions, treat each line as standalone
- **Storytelling** — causal transitions ("*Because we did X, now...*")

---

## Style-specific rules

> **All quoted phrases below are examples, not scripts.** They show the TONE and APPROACH of each style. Write your own narration that matches the feel — don't copy these exact words. The examples are there to inspire, not to prescribe.



### Tutorial (default)
- **Tone**: Friendly instructor who genuinely wants the viewer to succeed.
- **Structure**: 3-8 high-level workflow steps. Group related clicks.
- **Approach**:
  - Open: set context — what app, what we're doing, why it matters.
  - Each step: orient the viewer ("We're in the settings panel now"), then guide the action.
  - When something appears (dialog, page, results), describe it before moving on.
  - Use encouraging language: "Perfect, now you can see...", "Great, that's exactly what we need..."
  - End: summarize what was accomplished.
  - Assume viewer sees this for the first time. Patient but not patronizing.

### Professional
- **Tone**: Senior professional delivering structured workplace training.
- **Structure**: 4-10 steps covering the complete workflow.
- **Approach**:
  - Open with a clear objective (e.g. *"In this walkthrough, we'll configure X to achieve Y."* — write your own).
  - Precise but not robotic — explain context, not just clicks.
  - Reference best practices: "It's recommended to...", "The standard approach is..."
  - Explain configuration options and which ones matter.
  - Note gotchas: "Make sure to save before navigating away."
  - Close: confirm what was accomplished and next steps.

### Conversational
- **Tone**: Showing a friend. Relaxed, natural, real.
- **Structure**: 3-7 steps. Merge small actions freely.
- **Approach**:
  - Start naturally in a casual tone (e.g. *"Alright, so here's the deal..."*, *"Okay so I want to show you..."* — write your own opener).
  - React like a real person: "See this panel on the left? That's where all the magic happens."
  - Contractions and filler words OK. "So basically what we're gonna do is..."
  - Share opinions: "I usually go with this option, it just works better."
  - Wrap up casually: "And that's pretty much it!"

### Storytelling
- **Tone**: Narrator telling the story of building something.
- **Structure**: 3-6 narrative beats that build on each other.
- **Approach**:
  - Open with the mission (e.g. *"We're about to transform this raw design into..."* — frame your own mission for this flow).
  - Every step answers WHY, not just what.
  - Build momentum: "Now that the foundation is set, this is where it gets interesting..."
  - Connect steps causally: "Because we set that flag earlier, the system now shows..."
  - End with accomplishment: "And just like that, what started as a blank canvas is now..."
  - **KEEP CONCISE** — prioritize pacing over detail.

### Persuasive
- **Tone**: Confident product demo presenter showing off something impressive.
- **Structure**: 3-7 steps emphasizing ease and power.
- **Approach**:
  - Open with excitement about what's possible (e.g. *"Let me show you how you can go from idea to published in under two minutes."* — match the pattern to this flow).
  - Emphasize speed: "With just a couple of clicks...", "Notice how it handles that automatically."
  - React enthusiastically: "And look at that — a fully formatted report, ready to share."
  - Compare to the old way: "What used to take an hour now happens instantly."
  - End with call-to-action: "Imagine what you could build. Try it free."

### Academic
- **Tone**: Knowledgeable educator explaining the thinking behind tools.
- **Structure**: 3-8 steps grouped by conceptual topic.
- **Approach**:
  - Frame the learning objective upfront (e.g. *"Today we'll explore how X works, and why it matters."* — state the objective for this specific flow).
  - Explain what UI elements ARE and what concepts they represent.
  - Define technical terms naturally.
  - Explain WHY things are designed this way.
  - Connect to broader concepts.
  - Summarize key takeaways.

### Concise
- **Tone**: Direct and minimal. Quick reference for someone who mostly knows.
- **Structure**: 4-10 steps. One per distinct action.
- **Approach**:
  - Imperative form: "Open Settings", "Select the Pro template", "Save and publish".
  - No intro, no conclusion, no transitions.
  - Still describe when it matters: "The export dialog appears — choose MP4."

### Exact
- **Tone**: Pure click detection — no narration style, just facts.
- **Verbosity**: 1 short sentence (3-8 words) per click.
- **Approach**:
  - Detect EVERY click. One click = one segment. No grouping.
  - NO introduction, NO conclusion, NO transitions.
  - Just: "Click Online Store", "Select Themes", "Click Customize button".

---

## How this connects to tracked actions

Each tracked action has:
- `narration` — what's spoken during this visual moment
- `pause` — explicit duration in ms for how long to hold on screen

### Rule: One visual moment = one tracked action

The narration should match what the viewer SEES in that exact moment. Don't write a long narration that spans multiple visual events. Split into multiple tracked actions, one per visual moment.

**Visual moments that deserve their own tracked action:**
- Cursor moves to an element (focus shifts)
- Button clicked (state change)
- Dialog/modal opens (new UI appears)
- Page navigates (new content loads)
- Field gets focus (cursor enters input)
- Dropdown opens (options visible)
- Item selected from a list (selection highlights)
- Result appears on screen (content updates)

**Bad — one long narration covering multiple visual events:**
```js
track('click', 'Create', 'Click Create to open project setup', 'create-btn', coords, {
  context: 'The dashboard is visible with the Create button ready to open the project setup dialog.',
  narration: "Let's create a new project. Click Create — the dialog appears with a name field. Now enter the project name, then pick a template, and finally set the visibility.",
  pause: 12000,
});
// The viewer is looking at a button being clicked but hearing about typing and selecting
```

**Good — split by visual moment:**
```js
// Moment 1: cursor on button, about to click
track('click', 'Create', 'Click Create to open project setup', 'create-btn', coords, {
  context: 'The dashboard is visible with the Create button ready to open the project setup dialog.',
  narration: "Let's make our first project — click Create.",
  pause: 2500,
});

// Moment 2: dialog appears
track('narrate', 'Dialog opens', 'Explain the project setup dialog', null, coords, {
  context: 'The project setup dialog is now open, showing fields for the project name and setup choices.',
  narration: "The project dialog slides in with a few fields to fill out.",
  pause: 3000,
});

// Moment 3: typing the name
track('type', 'Project name', 'Type the project name', 'name-input', coords, {
  context: 'The project name field is focused. The typed value is example data; viewers should enter their own name.',
  narration: "Start with a name — this is how it appears in your dashboard.",
  pause: 3000,
  typed_text: 'Q4 Marketing Site',
});
```

### CRITICAL: Narration must FIT in the pause (no freeze sync)

Narration is spoken at ~3 words/second. If the narration is too long for the pause, it overflows into the next action → **FREEZE SYNC** (the video freezes while narration catches up — looks broken).

**Math:**
- `narration_duration_ms = wordCount × 350` (measured Vorec TTS rate ~2.86 words/sec)
- `pauseMs = narration_duration_ms + 500` (breathing buffer so narration doesn't collide with next action)
- Rule: `pauseMs ≥ wordCount × 350 + 500`
- Example: 10-word narration → `pauseMs ≥ 4000` (3500 speech + 500 buffer)
- Example: `pauseMs: 3000` allows max 7 words of narration (2450 + 500 = 2950 ≤ 3000)

**When narration is too long:**
- Option A: increase `pauseMs` (if the visual moment supports a longer hold)
- Option B: shorten the narration
- Option C: split into multiple tracked actions with separate narrations and pauses

### Group nearby actions when narration spans them

If several clicks happen within 2-3 seconds (rapid navigation, multi-step clicks on the same screen), **DON'T split into multiple tracked actions with tiny pauses**. Either:

**Option A — One tracked action for the group:**
```js
// 3 clicks in 2 seconds, all part of "configure settings"
// → ONE tracked action covering all 3, with combined narration
await btn1.click();
await btn2.click();
await glideClick(btn3, 'Configure', 'Save grouped settings', 'save', context,
  "We're setting up the defaults — courts, rounds, and scoring all in one pass.",
  4500  // long enough for the combined narration
);
```

**Option B — Separate actions with fitting narration:**
```js
// If each click deserves its own narration beat
await glideClick(btn1, 'Courts', 'Choose court count', 'courts', context1, "Set the number of courts.", 2500);  // 5 words, 1.7s ✓
await glideClick(btn2, 'Rounds', 'Choose round count', 'rounds', context2, "Then pick rounds.", 2000);          // 3 words, 1s ✓
await glideClick(btn3, 'Save', 'Save settings', 'save', context3, "Save the configuration.", 2500);             // 3 words, 1s ✓
```

### Pause is explicit, not calculated

The agent sets `pause` directly in milliseconds. The narration word count is a reference (roughly 3 words/second) but the agent picks the pause based on:
- **Narration fit** — pause must hold long enough to speak the narration (`words × 350ms + 500ms buffer`)
- How long the visual moment lasts on screen
- The narration style (Conversational = longer holds, Exact = short)
- What happens next

```js
track('click', 'Submit', 'Click Submit to process the form', 'submit-btn', coords, {
  context: 'The form is complete and ready to submit. The button starts processing the entered details.',
  narration: "Click Submit. The form processes for a moment.",
  pause: 4000, // explicit — long enough for narration + brief wait for processing
});
```

### Fields summary

| Field | What it's for |
|-------|--------------|
| `context` | Scene reference (what's on screen) |
| `narration` | Spoken words over this moment (follows style rules) |
| `pause` | Hold time in ms (agent-chosen, matches visual event) |
| `typed_text` | Exact text typed (for type actions) |
| `primary` | Gold star marker |

Write narration per visual moment. Set pause explicitly. Vorec uses your narration as the final script.


## Rules — narration-styles

---
name: narration-styles
description: Quick reference for helping the user pick a narration style
---

# Narration Styles

Use this table to help the user choose. Default: `tutorial`.

| Style | Best for | Tone |
|-------|----------|------|
| Tutorial | How-to guides, onboarding, docs | Friendly instructor |
| Professional | Workplace training, SOPs | Structured, precise |
| Conversational | Team walkthroughs, casual demos | Relaxed, like showing a friend |
| Storytelling | Marketing, feature launches | Narrative arc, builds momentum |
| Persuasive | Sales demos, investor pitches | Confident, "look how easy" |
| Academic | Courses, learning platforms | Educator, explains concepts |
| Concise | Quick reference, power users | Direct, imperative |
| Exact | Technical docs, API walkthroughs | One sentence per click |

## How to help the user choose

> **Who's watching?**
> - New users → **Tutorial**
> - Team members → **Professional**
> - Friends/colleagues → **Conversational**
> - Marketing audience → **Storytelling** or **Persuasive**
> - Developers → **Concise**
> - Documentation → **Exact**
> - Students → **Academic**

## Full style rules

For the detailed tone, structure, approach, and writing rules for each style, see [./narration-rules.md](./narration-rules.md) — that's the source of truth for how to write narration in each style.

## Recording pacing

Each style affects typing speed. See [./pacing.md](./pacing.md) for TYPING_DELAY per style.


## Rules — explore

---
name: explore-mode
description: Explore mode — discovering a live page without source code access
---

# Explore Mode

Use this mode when you **don't have the source code**. The agent has to discover the page at runtime using `playwright-cli snapshot` and semantic locators. It's slower than Connected mode because exploration costs tokens, but it works on any URL.

## MANDATORY: Full dry-run BEFORE writing any script

**Walk the entire flow end-to-end using playwright-cli FIRST.** Every page, every form, every click — manually verify each step works before writing `vorec.json`.

**Why:** If you discover validation rules, required fields, hidden dialogs, or unexpected page transitions during recording, the recording is already broken. Discover them during exploration when you can test freely.

During the dry-run, document for each step:
- **Selectors that work** — `getByRole`, `getByLabel`, `getByPlaceholder` (not CSS)
- **Valid input data** — what formats pass validation (emails, phone numbers, passwords)
- **Required fields** — what triggers "required" errors
- **Unexpected dialogs/modals** — welcome popups, cookie banners, profile setup
- **Success states** — what text/element appears after each successful action
- **Gotchas** — disabled buttons, rate limits, rapid-click blocks, timing issues
- **State carryover** — what gets saved to session/local storage between steps

**Keep these findings in your conversation context** — you'll reference them when writing `vorec.json` in the same session. Do NOT write them to disk: nothing automated reads them and serializing costs tokens without benefit.

**If you hit a validation error during the dry-run, fix it THERE** — find the valid input, find the missing step, find the required field. Don't leave it for the recording.

**Don't skip the dry-run** even if the flow seems obvious. "Obvious" flows still have surprises: hidden tooltips that block clicks, toggle buttons that need a second click, validation on blur, dialogs that appear only on first visit.

### Test stateful controls before writing the manifest

If the site has toggle buttons, checkboxes, pickers, or radio groups, verify whether they RESET after each submit/add action — or whether they persist between rows.

Run this quick test during dry-run:
1. Set the control to state A (e.g. toggle to Female)
2. Submit / add / save whatever row the control is part of
3. Check the control's state AGAIN after submit

If the control did NOT reset:
- The manifest must ONLY click the toggle when the state actually needs to change
- Clicking a toggle that's already in the right state flips it to the wrong one
- Map the full state machine: "starts as ♂, click once for ♀, stays ♀ for next row, click again to switch back to ♂"

If the control DID reset:
- Every row needs its own state-set click before the value input
- Default state is whatever the site resets to (usually the "male" / first option)

Without this test, you'll get bugs where the toggle persists across rows but your manifest clicks it for every row — flipping it to the wrong state. Common on any UI with a stateful picker used in a repeated "add row" context (form builders, bulk-entry UIs, filtered lists).

For live external websites, also load [./live-site-discovery.md](./live-site-discovery.md) for the safety checklist (blockers, sensitive actions). The `vorec.json` you produce must be based on verified discovery, not guesses.


## When to use Explore mode

- Third-party sites (signing up on vorec.ai, buying on Amazon, using Stripe dashboard)
- Competitor demos or public how-to videos
- Recording a SaaS tool where you have no code access
- Deployed versions of your own site if you don't want to bring up the dev server

## The exploration workflow

### Step 1 — Open the target URL directly

**Never `about:blank`** — it creates a white start frame. Open the target URL so the recording starts with real content.

```bash
playwright-cli close-all
playwright-cli open https://target-site.com/the-page
playwright-cli resize 1920 1080
```

### Step 2 — Take a snapshot to find refs

```bash
playwright-cli --raw snapshot | grep -E "relevant|keywords|here"
```

The snapshot is an accessibility tree. Each interactive element has a `ref=eXX` you can use with other `playwright-cli` commands. Or — better — use the `name` attribute with Playwright's semantic locators in your vorec script.

**Filter the snapshot aggressively.** The full snapshot is huge. Always grep for what you need:
```bash
# Looking for a signup form
playwright-cli --raw snapshot | grep -iE "email|password|sign ?up|create.*account"

# Looking for a product price/button
playwright-cli --raw snapshot | grep -iE "add.*cart|buy|price|\$|€"
```

### Step 3 — Prefer semantic locators over refs

Refs change per page state. Semantic locators are stable:

```js
// BEST — semantic, works across page states
page.getByRole('button', { name: 'Create account' })
page.getByPlaceholder('you@gmail.com')
page.getByLabel('Email')
page.getByText('Sign up for free')

// OK — refs from the snapshot (but can change)
// Only use if semantic locators don't disambiguate
```

### Step 4 — Handle ambiguous matches

If `getByRole('link', { name: 'Premium Plan' })` matches BOTH the product option AND a cart sidebar line, disambiguate:

```js
// Use exact match
page.getByRole('link', { name: 'Premium Plan', exact: true })

// Or scope to a container
page.locator('.product-variations').getByRole('link', { name: 'Premium Plan' })

// Or use .first()
page.getByRole('link', { name: 'Premium Plan' }).first()
```

### Step 5 — E-commerce gotcha: empty-state hides elements

Some buttons only appear after user action. Example: "Checkout" button is hidden when the cart is empty. If you try to snapshot before adding an item, the ref won't exist.

**Fix:** do a manual exploration pass first — add an item, then snapshot the populated page:
```bash
# Add an item by clicking through
playwright-cli open https://shop.example.com/product/x
playwright-cli click e42   # add to cart button
# Now snapshot the cart to find checkout ref
playwright-cli --raw snapshot | grep -iE "checkout|valider"
```

### Step 6 — Success state detection

Without source code, you have to observe what the success state looks like. Do a dry run first:
1. Manually click through the flow via playwright-cli commands
2. Watch what element appears on success (heading text, URL change, toast message)
3. Use that element as your `waitFor` in the vorec script

**Examples:**
```js
// URL-based detection
await page.waitForURL('**/success', { timeout: 15000 });

// Heading-based detection
await page.getByRole('heading', { name: 'Order confirmed' }).waitFor({ timeout: 15000 });

// Toast/notification
await page.getByText(/added to cart|added successfully/i).waitFor({ timeout: 5000 });
```

### Step 7 — Ask the user when stuck

The user knows the flow. If you're unsure about a step, ask:

> *"I see a 'Continue' button and a 'Next' button on this page. Which one proceeds to payment?"*

> *"After clicking submit, the page shows a success message. What's the exact text so I can wait for it?"*

> *"The cart has 3 items from a previous session. Should I clear them before recording, or leave them?"*

## Semantic locator cheat sheet for common flows

| Flow | Locator pattern |
|---|---|
| Signup email | `getByPlaceholder(/email|you@|example\.com/i)` or `getByLabel('Email')` |
| Signup password | `getByPlaceholder(/password|8 characters/i)` or `getByLabel('Password')` |
| Submit button | `getByRole('button', { name: /create|sign ?up|continue|submit/i })` |
| Login button | `getByRole('button', { name: /log ?in|sign ?in/i })` |
| Add to cart | `getByRole('button', { name: /add to cart|ajouter au panier|agregar|in den warenkorb/i })` |
| Checkout button | `getByRole('link', { name: /checkout|valider|proceed to pay|purchase/i })` |
| Search box | `getByRole('searchbox')` or `getByPlaceholder(/search/i)` |
| Close modal/popup | `getByRole('button', { name: /close|×|dismiss/i })` |
| Cookie accept | `getByRole('button', { name: /accept|agree|got it|ok/i })` |

## Dismissing cookie banners + popups

Most sites have cookie banners that intercept clicks. Check for them early:

```js
// In your vorec script
const cookieBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"]');
if (await cookieBanner.count() > 0) {
  const accept = cookieBanner.getByRole('button', { name: /accept|agree|ok|got it/i });
  if (await accept.count() > 0) await accept.first().click();
  await page.waitForTimeout(500);
}
```

## Unique test data per run

For signup flows, use a unique email per run so you don't hit "email already registered" errors. Since you don't know the validation rules (no code), use a timestamp-based unique suffix:

```js
// Timestamp digits (most sites accept this even if they normalize dots/+)
const unique = Date.now().toString().slice(-6);
const testEmail = `tutorial.${unique}@gmail.com`;

// Or for Gmail: dots don't count, so use digits
const gmailEmail = `tutorial${unique}@gmail.com`;
```

## After exploration → write the vorec script

Once you have:
- The list of elements you need to click/type into
- Semantic locators for each
- The success state to wait for
- Any overlays/popups to dismiss first

You're ready to write the vorec script. See the manifest section in [../SKILL.md](../SKILL.md) for the schema and action types.

## Both modes converge

Explore mode ends at the same place as Connected mode: write `vorec.json`, run `npx @vorec/cli@latest run vorec.json`, the Vorec Recorder app captures + uploads. Return to the main `SKILL.md` when you're done exploring.


## Rules — live-site-discovery

---
name: live-site-discovery
description: Safety + thoroughness checklist for discovering an unknown live website before recording
---

# Live Site Discovery

Use this for Explore mode on external websites. The agent has no source code, so it must discover the page at runtime before recording — but it must do so **safely** (no real-world side effects) and **thoroughly** (no surprises during recording).

**All discovery findings stay in your conversation context.** Do NOT write `live-site-map.json`, `flow-notes.md`, or any other discovery file. The CLI, backend, and app never read them — serializing wastes tokens.

## Core Rule

Do not write `vorec.json` for a live website task until you can truthfully answer YES to every readiness question in the "Pre-Recording Gate" below. You don't write the checklist to a file — you mentally satisfy each item, then include the summary in the discovery report you show the user.

The agent should not "understand" an unknown site from memory. It must inspect the page tree, DOM, validation attributes, and dry-run results.

## What the Agent Can Inspect

### Accessibility Tree

Use first. It reveals the semantic page tree: headings, buttons, links, inputs, labels, dialogs, tabs, and disabled states.

```bash
playwright-cli --raw snapshot
playwright-cli --raw snapshot | grep -iE "<keywords relevant to the flow>"
```

Pipe to `grep` when you're looking for specific elements — don't save the whole snapshot to disk.

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
        required: el.hasAttribute('required'),
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        pattern: el.getAttribute('pattern'),
      };
    })
  );
}"
```

Read the output inline. Don't save the JSON.

### Always use the most specific selector available

Never use a partial text selector that could match multiple elements on the page. A short prefix like `button:has-text("<word>")` can match several buttons whose labels start with or contain that word — and Playwright picks the first one, not necessarily the right one.

Test every selector for uniqueness before using it in the manifest:

```js
const matches = await page.$$('<your selector>');
// If matches.length > 1 → make it more specific:
//   - use the full button label, not a prefix
//   - prefer role=X[name='Y'] over :has-text()
```

**When in doubt, prefer `role=X[name='Y']` over `:has-text()`.** Role+name selectors are unambiguous by ARIA spec; text matches are fuzzy by nature.

If a click doesn't produce the expected result (navigation didn't happen, modal didn't open, form didn't submit) → the WRONG element was matched. Add a URL check or visible-element check after the action to confirm it hit the right target:

```js
await page.getByRole('button', { name: '<exact label>' }).click();
await page.waitForURL('**/<expected-path>/**', { timeout: 10000 });
```

Document every ambiguous selector you found during discovery — it's the most common cause of "agent clicked something but nothing happened" failures.

### Validation Discovery

During dry-run, learn rules safely:
- Click Next/Create with empty fields only if it does not submit a destructive/sensitive action
- Fill one field at a time and watch disabled buttons become enabled
- Blur fields to reveal validation messages
- Try safe invalid values for obvious constraints, such as `1` for a player count
- Capture visible validation text in your conversation — *"the email field shows 'invalid format' on blur when empty"*

**Never spam backend submissions.** Stop before payment, booking, publishing, email sends, invitations, deletes, or billing changes unless the user explicitly approves.

### Network and Storage

Use only when needed:
- Inspect API errors if a safe dry-run submit fails
- Check local/session storage for language, draft state, onboarding flags, or auth state
- Do not record secrets (tokens, cookies) in your notes

## What to track (mentally, not on disk)

For every meaningful page or modal you walk through, note:
- URL or route
- Purpose of the page
- The key headings + visible text you'd reference in narration
- Candidate actions (their selectors + what they did when clicked)
- Fields, labels, required state, valid demo values you found that passed validation
- Primary buttons
- Enabled/disabled conditions
- Success state or transition (URL pattern, visible element, success banner)
- Risks (sensitive actions, blockers, state carryover)

Mark unknowns explicitly in your conversation. Unknown is better than invented.

## Pre-Recording Gate — mental checklist

Before writing `vorec.json`, verify you can answer YES to all of these. If any answer is NO, continue discovery or ask the user ONE targeted question to resolve it.

- **Entry action known** — you can name the first click / field / URL the recording will start from
- **Required fields known** — for every field the script will fill, you know whether it's required
- **Valid demo values known** — you know what to type that passes validation for every scripted field
- **Primary buttons known** — you've identified the hero action per page and what it looks/feels like
- **Success state known** — you can describe exactly how the flow ends (URL pattern + visible evidence)
- **Blockers reviewed** — cookie banners, onboarding popups, rate limits, locale / region gates, sticky headers all noted and handled
- **Sensitive actions reviewed** — payments, deletes, emails, invitations, publishes all either avoided or explicitly approved by the user

## Selector uniqueness check

Before using any text-based selector (`text=X`, `a:has-text("X")`, `role=link[name='X']`), verify the text is UNIQUE on the page. Nav bars, sidebars, and footers often repeat the same label — Playwright will silently pick the first match, which may not be the visible one.

Run this in the Playwright dry-run to count matches:

```js
const all = await page.$$('a, button');
let hits = [];
for (const el of all) {
  const text = (await el.textContent() || '').trim();
  if (text === 'TARGET_TEXT') {
    hits.push({ href: await el.getAttribute('href'), classes: await el.getAttribute('class'), visible: await el.isVisible() });
  }
}
console.log(hits);
```

**Decision rule:**
- 1 match → safe to use `text=TARGET_TEXT`
- 2+ matches → switch to `a[href='/exact/path']` or `role=X[name='Y']` scoped to a container (e.g. `main >> text=TARGET_TEXT`)
- 0 matches → wrong text or page not loaded — re-snapshot

**Symptom of skipping this check:** click reports success but URL doesn't change, or wrong content loads. Playwright matched a hidden sidebar/footer link with the same label.

## Include in the discovery report to the user

The report you print before writing the manifest MUST include this one-line summary:

> **Blockers reviewed: yes. Sensitive actions reviewed: yes. Valid demo values ready for N fields. Success state verified.**

If you cannot truthfully say this, do not write the manifest.


## Rules — connected

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
1. Run `npx @vorec/cli@latest run vorec.json`
2. The Vorec Recorder app captures + uploads automatically
3. CLI triggers analysis and prints the editor URL


## Rules — shopify-admin

---
name: shopify-admin-mode
description: Recording Shopify Admin embedded apps — open from admin.shopify.com, never automate Google login, use a dedicated browser profile
---

# Shopify Admin App Mode

Load this file when you detect a Shopify Admin embedded app. The rules below override the generic Explore/Connected flow because Shopify and Google auth behaves very differently from a normal web page.

## How to detect Shopify Admin mode

Any one of these triggers Shopify Admin mode:

- URL starts with `https://admin.shopify.com/...`
- The project contains a `shopify.app.toml` file
- The user's recent command was `shopify app dev`
- The user says "Shopify admin app", "embedded Shopify app", or names a store like `my-store.myshopify.com`

## Rule 1 — Always start from Shopify Admin, not the raw app URL

Shopify embedded apps only work when loaded through the Admin shell, because they depend on:
- Shopify Admin iframe context
- `host` and `shop` query parameters
- App Bridge session tokens (short-lived JWTs)
- Backend session-token validation

**Correct recording URL:**
```
https://admin.shopify.com/store/<store-handle>/apps/<app-handle>
```

**Never record from:**
- `http://localhost:3000`
- the ngrok / Cloudflare tunnel URL
- the app's raw `application_url`

Starting from the raw URL means no iframe, no `host` param, no App Bridge, and likely a blank page or CSP violation.

If you don't know the store handle, ask the user **once**:
> "What's your Shopify dev store? (for example: `my-shop.myshopify.com`)"

## Rule 2 — Never automate Google login

Google blocks OAuth in browsers it considers "embedded", "unsafe", or "automated" (`disallowed_useragent` error). Do not fight it.

- **Do not** fill Google email/password with Playwright
- **Do not** spoof the user agent
- **Do not** inject Google cookies
- **Do not** use an embedded WebView for Google OAuth

**If a Google login appears:**
1. Stop automation
2. Tell the user, in one sentence: *"Google login appeared — please log in manually in this browser window. Type 'done' when you're back on Shopify Admin."*
3. Wait for the user to authenticate
4. Resume only after the Shopify Admin page is visible again

This is the official Google-supported path — see Google's [WebView OAuth remediation](https://support.google.com/faqs/answer/12284343).

## Rule 3 — Use a dedicated Vorec Chrome profile

Do not try to reuse the user's default Chrome cookies. Chrome OS-encrypts them, and copying them is fragile + breaks Shopify's auth assumptions. Use a persistent profile the user logs into **once**.

The CLI supports this directly via `--profile`:

```bash
# First run — user logs into Shopify (and Google if needed) in the opened window
npx @vorec/cli@latest run vorec.json --profile ~/Library/Application\ Support/Vorec/Profiles/shopify-dev

# Subsequent runs — profile is reused, no login needed
npx @vorec/cli@latest run vorec.json --profile ~/Library/Application\ Support/Vorec/Profiles/shopify-dev
```

When `--profile` is passed, the CLI switches to `launchPersistentContext` with `channel: 'chrome'` (real Chrome, friendlier to Google OAuth than bundled Chromium).

This preserves:
- Shopify session cookies
- `localStorage`, `IndexedDB`, `sessionStorage`
- Site permissions
- OAuth tokens
- App Bridge state

**First recording of the session:** user logs in once, manually.
**Every recording after:** agent launches the same profile, already authenticated.

If the profile dir doesn't exist yet, create it and let the user log in. Don't skip the login step silently.

## Rule 4 — Recording captures the full window; user crops in the editor

The Shopify Admin shell (sidebar, top nav, tabs, browser chrome) is visible during recording and **stays in the recorded MP4** — there is no record-time crop flag. The Vorec editor has a crop tool; if the user wants a clean app-only frame in the final video, they crop there. Do not put `recordFrame`, `chromeless`, or any other layout/crop field in the manifest — the CLI ignores them.

**Typical Shopify manifest skeleton (placeholders in angle brackets):**
```json
{
  "title": "<what the user is recording>",
  "url": "https://admin.shopify.com/store/<store>/apps/<app-handle>",
  "actions": [
    { "type": "narrate", "delay": 3000, "description": "<scene label>", "context": "<scene description>" },
    { "type": "click", "selector": "<selector>", "frame": "iframe[src*='myshopify']", "description": "<what this does>" }
  ]
}
```

The `frame` field on an individual action still works — it scopes selector resolution into the iframe so clicks land on the embedded app's elements. That's separate from cropping the video.

## Rule 5 — Interact with the embedded app via the iframe

Every manifest action accepts an optional `"frame"` field:

```json
{
  "type": "click",
  "selector": "text=Create product",
  "frame": "iframe[src*='myshopify']",
  "description": "Open product creation form"
}
```

The `frame` hint is matched against:
1. Any iframe whose URL contains the string
2. Any iframe whose `name` attribute equals the string
3. Any element matching it as a CSS selector on the parent page (e.g. `iframe[name='app-iframe']`)

If you **omit** `frame`, the CLI auto-falls-back: main frame first (2.5s timeout), then every sub-frame. That covers most simple pages, but embedded apps are reliably faster with an explicit hint.

Under the hood the CLI uses Playwright's frame API directly (the template below is for reference if you need Playwright outside the CLI):

```js
// Most Shopify embedded apps expose a frame whose URL contains the app's tunnel host
const appFrame = page.frameLocator('iframe[name="app-iframe"], iframe[src*="cloudflare"], iframe[src*="ngrok"], iframe[src*="<your-tunnel-host>"]').first();

// All clicks/types inside the app go through appFrame, not page
await appFrame.getByRole('button', { name: 'Create product' }).click();
await appFrame.getByLabel('Title').fill('Summer Collection');
```

In a Vorec manifest, this translates to scoped selectors — you'll often need to express the iframe path in the selector string. If the manifest selector doesn't reach into the iframe, fall back to clicking by visible text + adding a `wait` action to let the frame render.

Coordinate math for click markers: when the manifest runs, the CLI gets the element's bounding box via Playwright — it's relative to the page. For elements inside the frame you need the frame's offset added. The CLI handles the outer-frame case automatically; deeply nested iframes may produce slightly off click coordinates.

## Rule 5 — Verify the embedded app loaded before recording

After navigating to `admin.shopify.com/store/<store>/apps/<app-handle>`, confirm the embedded app is actually rendering:

```bash
# in exploration
playwright-cli --raw snapshot | grep -i "<app-specific-heading-or-button>"
```

If you see only the Shopify chrome (top nav, sidebar) but not your app's content, one of these is wrong:
- The tunnel URL is stale — restart `shopify app dev`
- `shopify.app.toml → application_url` doesn't match the running tunnel
- CSP `frame-ancestors` doesn't allow `https://admin.shopify.com`
- App Bridge isn't initialized — check the app's client code

**Do not start recording until the app's content is visible inside the iframe.** A recording of the Shopify shell with a blank iframe is useless.

## The two-step Shopify Admin flow

Shopify + Google auth is fragile. **Do the login in a separate step from the recording**, reusing the same profile directory for both.

### Step 1 — One-time login (no recording)

```bash
# Open headed real Chrome against the Shopify Admin app URL, pointed at our dedicated profile
playwright-cli open \
  --headed \
  --browser=chrome \
  --profile=~/Library/Application\ Support/Vorec/Profiles/shopify-dev \
  "https://admin.shopify.com/store/<store>/apps/<app-handle>"

# User logs into Shopify (and Google SSO if asked) manually in that window.
# When they're on the embedded app page, release the profile lock:
playwright-cli close-all
```

### Step 2 — Record (uses the authenticated profile)

```bash
npx @vorec/cli@latest run vorec.json \
  --profile ~/Library/Application\ Support/Vorec/Profiles/shopify-dev
```

The CLI auto-runs a pre-flight on the profile (patches `Default/Preferences` to mark the last exit clean, removes session/lock files, kills any lingering Chrome processes) — so the next launch doesn't show the "Restore pages?" dialog that would otherwise hijack the recording window.

Default channel when `--profile` is set is `chrome` (real Chrome, friendlier to Google OAuth). If the login in Step 1 used `--browser=chromium` instead, pass `--channel chromium` in Step 2 so the same bundled browser is reused.

### What happens under the hood

1. **Detect** — any trigger from "How to detect" above
2. **Start dev server** (once) — user runs `shopify app dev` in their terminal
3. **Login step** — Step 1 above, manual by the user
4. **Recording step** — `vorec run --profile ...`
5. **Wait for the embedded app to render** — `frameLocator` based (see Rule 4 / manifest `frame` field)
6. **Stop + upload** — the app handles capture and upload like any other recording

## What the skill rules boil down to

| Situation | Do | Don't |
|---|---|---|
| Shopify Admin app | Start from `admin.shopify.com/store/.../apps/...` | Start from `localhost:3000` or the tunnel URL |
| Google login appears | Stop + ask user to log in | Fill email/password with Playwright |
| User auth | Dedicated Vorec profile + manual first login | Copy the user's default Chrome cookies |
| App interaction | Target the iframe via `frameLocator` | Assume DOM is on `page` |
| OAuth / cookies | Trust the real browser | Spoof UA, inject cookies, decrypt local store |

## First run vs later runs — what to tell the user

**First run:**
> "Shopify Admin detected. Opening a dedicated Vorec browser window — please log in to Shopify (and Google if asked). Type 'done' when you see the app inside Shopify Admin."

**Later runs:**
> "Shopify session found — recording now."


## Rules — article-guide-parsing

---
name: article-guide-parsing
description: How to extract flow steps and screenshots from a user-provided article or help guide link before writing the manifest
---

# Parsing a User-Provided Article or Guide

When the user shares a link to a help article, documentation page, or any guide that describes the flow they want to record, treat it as the source of truth for what the video must show. Don't rely only on the text summary — the screenshots in the article define the exact UI states the video must match.

## When to load this file

Load this file when:
- The user pastes a URL before asking you to record
- The user says "record this", "follow this guide", "same as this article"
- The user shares a help center, docs, or tutorial link alongside a recording request

## Step 1 — Fetch the article

Use `WebFetch` on the URL with this prompt:

> "List every image URL in this article and describe what each image shows. Also list every step shown with its exact UI label or button name."

This gives you:
- All image CDN URLs (usually from storage.crisp.chat, cdn.intercom.com, etc.)
- The ordered list of steps and button labels from the article text

## Step 2 — Fetch the screenshots

Launch a single subagent (Agent with subagent_type=Explore) and pass it all image URLs at once. Ask it to:

> "For each image URL, open it in the browser using browser_navigate, take a screenshot with
> browser_take_screenshot, and describe exactly what UI is shown — what buttons, fields,
> checkboxes, labels, and states are visible. Note what is highlighted or focused and what
> step this represents."

The subagent uses Playwright to open each URL in a real browser window, renders the image at full resolution, captures a screenshot, and the vision model returns a detailed description of the screen state.

**Why Playwright and not WebFetch?**
WebFetch is built for HTML pages — it converts HTML to markdown and loses image content. Image URLs (JPG, PNG, WebP) have no HTML to parse. Playwright opens the image directly in a browser tab where it renders at full size, so the vision model sees the actual pixels.

**Why a subagent?**
All images can be opened in parallel and the descriptions can be large — offloading to a subagent keeps the main context clean.

## Step 3 — Map article images to manifest actions

Go through the image descriptions in order. For each screenshot, identify:

| Screenshot shows | Manifest action |
|---|---|
| A button being clicked | `click` action targeting that button |
| A field being filled | `type` action with the value shown |
| A modal/dialog open | Preceding `click` that opens it + `narrate` for overview |
| A checkbox checked | `click` on that checkbox |
| A result/success state | Trailing `narrate` describing what changed |
| A panel or section overview | `narrate` with `delay` to let user observe |

Screenshots with red circles, numbered labels, or highlight boxes are the article author's emphasis — treat those as the primary actions for that step.

## Step 4 — Use article demo values

When the article shows example values in fields (rate names, prices, country selections, product names), use the same values in your manifest. This ensures the recorded video visually matches the article.

If the article shows a condition like "India" selected as a country or specific products added — replicate that in the manifest actions. Do not invent different demo values.

## Step 5 — Check for steps the text misses

Article text often summarizes; screenshots are exhaustive. Common gaps:

- **Save button** — articles frequently show an "Unsaved changes" banner and a Save click that the text summary skips. If a screenshot shows it, include it.
- **Tab switches** — the article may say "go to Form Builder" without showing the click. If a screenshot shows the tab selected, include the `click` on that tab.
- **Intermediate dialogs** — a screenshot might show a modal open mid-flow that the text never mentions. Include a `narrate` to orient the viewer.
- **Empty vs filled states** — if a screenshot shows a search field that appeared after a checkbox was clicked, include the checkbox click AND the resulting search interaction as separate actions.

## Step 6 — Flag selectors that need discovery

After mapping all screenshots to actions, note which ones you have not verified live:

- Any modal or dialog that only appears after an earlier action
- Any dynamic field that appears conditionally (search inputs, expanded sections)
- Any picker (country picker, product picker) that requires typing + selecting from a dropdown

Keep a mental list of "needs live verification" selectors and confirm them during the dry-run before writing the manifest. Do not write this list to a file — keep it in conversation only.

## Example

User shares: `https://help.example.com/en/article/add-shipping-rates`

WebFetch(url, "List every image URL and step label")
→ Returns 8 image URLs + 16 step labels

Agent(Explore, "Open each image URL in browser, screenshot, describe the UI")
→ Returns descriptions of each screenshot

Map each description to manifest actions:
  Screenshot 1 (Shipping rates tab active) → click tab
  Screenshot 2 (Add rate dialog open)      → click "Add rate" button
  Screenshot 3 (conditions expanded)       → click "Add conditions"
  Screenshot 4 (country checked + India)   → click checkbox + type "India"
  Screenshot 5 (product selected)          → click checkbox + select product
  Screenshot 6 (Unsaved changes + Save)    → narrate banner + click "Save"
  Screenshot 7 (Import button highlighted) → narrate tip about Import
  Screenshot 8 (Form Builder + field)      → click tab + click "Add new fields"

## What not to do

- **Don't rely only on the article text** — the text is a summary. Screenshots are the ground truth.
- **Don't skip screenshots that show "optional" steps** — if the article author included a screenshot for it, the user expects to see it in the video.
- **Don't invent demo values** — use whatever the article shows in the fields. Users will compare the video to the article.
- **Don't use WebFetch to fetch image URLs** — WebFetch is for HTML pages. Use Playwright browser_navigate + browser_take_screenshot for image files.
- **Don't batch all images into one WebFetch call** — fetch the article page first to get the URLs, then open the images separately via the Playwright subagent.


## Rules — auth

---
name: authentication
description: How to handle login flows and save browser sessions for local, hosted, and live sites
---

# Authentication

Load this file when the target site requires login.

**If the login flow uses Google, stop automation and hand off to the user.** Google blocks OAuth in browsers it considers embedded/unsafe/automated, and fighting that is both unreliable and against Google's policy. Open a headed real-Chrome window, ask the user to log in manually, and resume once they're authenticated. Never fill Google email/password with Playwright, never spoof the user agent, never inject Google cookies.

**If the site is Shopify Admin, read [./shopify-admin.md](./shopify-admin.md) first.** Embedded Shopify apps require a dedicated Chrome profile and must be opened through `admin.shopify.com`, not the raw tunnel URL.

## Check if auth is needed

- **Connected mode**: read the router/auth guard in the codebase. Look for auth guards wrapping routes, redirect to `/login`, protected route middleware.
- **Explore mode**: navigate to the target URL — if redirected to a login page or you see "Sign in" as the first visible element, auth is needed.

## Canonical login capture subroutine

**Use this whenever you need a fresh session.** Do NOT ask permission first — open the browser immediately and tell the user what to do in ONE sentence.

### Step 1 — Check for an existing valid session first

```bash
# Does the session file exist AND cover the target origin?
TARGET="https://vorec.ai"
if [ -f .vorec/storageState.json ]; then
  HOST=$(python3 -c "from urllib.parse import urlparse; print(urlparse('$TARGET').netloc)")
  VALID=$(cat .vorec/storageState.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
origins = [o.get('origin', '') for o in d.get('origins', [])]
print('yes' if any('$HOST' in o for o in origins) else 'no')
")
  echo "Session valid for $HOST: $VALID"
fi
```

If `valid=yes` → skip to Step 4 (use the existing session).
If `valid=no` OR file missing → continue to Step 2.

### Step 2 — Open the browser in HEADED mode (act first, no asking)

```bash
playwright-cli close-all
playwright-cli open --headed https://SITE/login
playwright-cli resize 1600 1000
```

**CRITICAL: `playwright-cli open` defaults to HEADLESS.** You MUST use `--headed` for user login — otherwise the user can't see the window and won't know what to do.

### Step 3 — Tell the user ONE thing to do

Status update to the user (one sentence, no questions):

> "Chromium is open at `<SITE>/login`. Log in however you prefer (email, Google, GitHub). When you land on the dashboard, type 'done'."

**Don't ask anything else right now.** The user is focused on logging in. Any other question will be ignored and confuse them.

### Step 4 — On "done", save the session and close

```bash
playwright-cli state-save .vorec/storageState.json
playwright-cli close-all
```

The saved file has cookies + localStorage + sessionStorage for the origin, reusable across recordings until the session expires (usually weeks).

### Step 5 — NOW ask follow-up questions

After the session is saved, continue with the rest of the workflow. If there are still decisions to make, ask them now:

> "Session saved. Ready to record — English narration in tutorial style, or something different?"

## Don't — bad behavior to avoid

```
Agent: I see we need to log in. Let me walk you through the options:
       1. I can launch a Playwright browser in headed mode
       2. You'll need to log in manually
       3. I'll save the session
       4. Then we can record
       Do you want me to proceed? Also, what scope?
       What's the test file path? What style of narration?
```

## Do: Good behavior

```
Agent: Opening browser for login.
       (runs: playwright-cli open --headed https://vorec.ai/login)
       Log in and type 'done' when you're on the dashboard.

(user logs in)

User: done

Agent: Session saved. Recording now.
       (runs the vorec script — already has sensible defaults)
```

## Capture session with a vorec script (alternative)

If you want to do it inside a Playwright script instead of CLI commands (for example, to wait on a specific redirect URL):

```javascript
// save-session.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });  // ← must be headed!
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('<LOGIN_URL_FROM_ROUTER>');
console.log('Please log in manually in the browser...');
await page.waitForURL('**/<POST_LOGIN_ROUTE>**', { timeout: 120000 });
await context.storageState({ path: '.vorec/storageState.json' });
console.log('Session saved to .vorec/storageState.json');
await browser.close();
```

Use this pattern when:
- The login has multiple steps (OAuth redirects, 2FA, email link)
- You want to auto-detect completion via a specific redirect URL
- You're in Connected mode and know the exact post-login route

## Capture session for hosted/embedded apps

For apps inside a host platform (Shopify Admin, Salesforce, HubSpot, etc.):

1. Open the **host platform URL** — NOT the embedded app URL
2. User logs into the host, navigates to the app
3. Wait for the app's iframe URL (use a broad `waitForURL` pattern)
4. Save storageState

```javascript
const browser = await chromium.launch({ headless: false });  // MUST be headed
const context = await browser.newContext();
const page = await context.newPage();

// Navigate to the host platform
await page.goto('https://admin.shopify.com');
console.log('Log in and navigate to the app...');

// Wait until the user reaches the embedded app
await page.waitForURL('**/apps/**', { timeout: 180000 });  // 3-min timeout for OAuth/2FA
await page.waitForTimeout(3000);

await context.storageState({ path: '.vorec/storageState.json' });
await browser.close();
```

### URL patterns for common platforms
- Shopify: `**/admin/apps/**` or `**/store/*/apps/**`
- Salesforce: `**lightning/n/**`
- HubSpot: `**/integrations-beta/**`
- Generic OAuth: `**/auth/callback**` or `**/dashboard**`

## Detecting a stale session

A storageState file can exist but be useless — for example, if it was captured for `localhost:3000` and you need to record on `vorec.ai`. Always check before reusing:

```bash
cat .vorec/storageState.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
origins = [o.get('origin', '') for o in d.get('origins', [])]
cookies = d.get('cookies', [])
print(f'origins: {origins}')
print(f'cookies: {len(cookies)}')
"
```

If:
- `cookies: 0` → session is empty, re-capture
- `origins` doesn't contain the target domain → session is for a different site, re-capture
- `origins` contains the target domain AND `cookies > 0` → session is good to use

## Key rules

- **Never ask for passwords** — the user types in the browser
- **Always use `--headed`** for login capture — headless is invisible to the user
- **Always check for an existing valid session first** — don't re-capture unnecessarily
- **Use `waitForURL`** to detect login completion — no stdin/interactive prompts
- **Save session to `.vorec/storageState.json`** — reusable across recordings
- If no auth needed, omit `storageState` from the manifest
- For hosted apps, the session includes the host platform's cookies — this is expected
- **Act first, explain in one sentence.** See [./agent-behavior.md](./agent-behavior.md) for the full rules.


## Rules — cli-commands

---
name: playwright-cli-commands
description: playwright-cli core commands — open, click, snapshot, resize, etc.
---

# playwright-cli — Core Commands

`playwright-cli` is the CLI front-end for Playwright. It runs a persistent browser session you can drive command-by-command, and it supports page exploration via snapshots, clicks, and inline scripts.

> This file is adapted from Microsoft's official [playwright-cli skill](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/SKILL.md) (Apache 2.0). Bundled for reference inside the Vorec record-tutorial plugin. See [../LICENSE_playwright-cli.txt](../LICENSE_playwright-cli.txt).

## Headed vs headless — read this before opening a browser

**`playwright-cli open` defaults to HEADLESS.** The browser window is invisible — the user will not see it and cannot interact.

| Use case | Flag |
|---|---|
| User needs to see or interact (login, session capture, visual validation) | **`--headed`** (REQUIRED) |
| Automated reconnaissance (snapshot + grep) | default (headless) is fine |
| When in doubt during setup | **`--headed`** |

```bash
# WRONG — user can't see the browser to log in
playwright-cli open https://vorec.ai/login

# RIGHT — browser window is visible
playwright-cli open --headed https://vorec.ai/login
```

If you open for a user-interactive flow without `--headed`, the user will ask "I don't see anything". Don't make them.

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
playwright-cli resize 1600 1000     # Use 1600x1000 for Vorec manifest exploration
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

### Element targeting (in vorec scripts)

By default, use refs from the snapshot. But in vorec scripts, prefer semantic Playwright locators:

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

- [./cli-running-code.md](./cli-running-code.md) — Running inline scripts for page exploration

> `playwright-cli` is only used for **exploration** (discovering selectors on a page before writing the manifest). Actual recording is always done by the Vorec Recorder app via `npx @vorec/cli@latest run vorec.json`.


## Rules — cli-running-code

---
name: playwright-cli-running-code
description: Running inline scripts via playwright-cli run-code for page exploration
---

# playwright-cli — Running Code

`playwright-cli run-code` executes JavaScript inside the current browser session. Use it in **Explore mode** to inspect pages, test selectors, and discover elements before writing `vorec.json`.

**Note:** Recording is done by the Vorec Recorder app via `npx @vorec/cli@latest run vorec.json`. You do not write a recording script — you write a `vorec.json` manifest. See [../SKILL.md](../SKILL.md).

## Basic usage

```bash
# Open a browser first
playwright-cli open https://example.com

# Run inline code
playwright-cli run-code "async page => { return await page.title(); }"

# Run a .js file
playwright-cli run-code --filename=./inspect.js
```

## Common exploration tasks

### Check if an element exists
```bash
playwright-cli run-code "async page => {
  const btn = page.getByRole('button', { name: 'Sign Up' });
  return await btn.count();
}"
```

### Get all form fields
```bash
playwright-cli run-code "async page => {
  const inputs = await page.locator('input, select, textarea').all();
  const fields = [];
  for (const el of inputs) {
    fields.push({
      tag: await el.evaluate(e => e.tagName),
      type: await el.getAttribute('type'),
      placeholder: await el.getAttribute('placeholder'),
      name: await el.getAttribute('name'),
    });
  }
  return JSON.stringify(fields, null, 2);
}"
```

### Check if page requires login
```bash
playwright-cli run-code "async page => {
  const loginForm = await page.locator('form[action*=login], input[type=password]').count();
  return loginForm > 0 ? 'LOGIN REQUIRED' : 'PUBLIC PAGE';
}"
```

## Script shape

Must be a single async arrow function with `page` argument:

```js
// Do: CORRECT
async page => {
  return await page.title();
}

// WRONG — no imports, no top-level code
import { chromium } from 'playwright';
```

## Limitations

- No `require()`, `import`, `fs`, `process` — browser sandbox only
- `console.log` does NOT appear in stdout — use `return` for output
- For anything needing Node APIs, write a standalone `.mjs` script instead

## Related files

- [./cli-commands.md](./cli-commands.md) — Core commands (open, click, snapshot)
- [../SKILL.md](../SKILL.md) — Manifest format + full recording workflow


## Rules — playwright

---
name: playwright-best-practices
description: Playwright techniques for reliable browser automation and recording
---

# Playwright Best Practices

> **Vorec does not record with Playwright.** Recording is always done by the Vorec Recorder macOS app, driven by `npx @vorec/cli@latest run vorec.json`. Playwright is used only for:
> 1. **Exploration** — finding selectors on a page before writing the manifest (`playwright-cli`, see [./cli-commands.md](./cli-commands.md)).
> 2. **Automation during `vorec run`** — the CLI internally launches Chromium with Playwright and drives the manifest actions. You don't write Playwright scripts yourself.
>
> The patterns below are best practices for writing **selectors in your `vorec.json` manifest** — they're the same locators Playwright uses.

## Semantic Locators — NOT CSS selectors

```javascript
// BEST: role-based (survives refactors)
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter password')
page.getByText('Sign up')
page.getByTestId('submit-btn')

// OK: CSS selectors (when semantic not possible)
page.locator('button[type="submit"]')

// AVOID: fragile
page.locator('.btn-primary')           // class can change
page.locator('#submit')                // id can change
page.locator('div > form > button')    // structure can change
```

## Chain and filter for precision

```javascript
page.getByRole('row').filter({ hasText: 'My Project' }).getByRole('button', { name: 'Edit' })
page.getByRole('listitem').nth(2)
```

## Wait for API responses, not just DOM

```javascript
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/projects') && resp.status() === 200),
  page.getByRole('button', { name: 'Save' }).click(),
]);
```

## Wait for loading states to clear

```javascript
await page.locator('.skeleton, .loading, [aria-busy="true"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
```

## Scroll elements into view

```javascript
const element = page.getByRole('button', { name: 'Submit' });
await element.scrollIntoViewIfNeeded();
await element.click();
```

## Handle cookie banners and overlays

```javascript
const cookieBanner = page.locator('[class*="cookie"], [class*="consent"], [id*="cookie"]');
if (await cookieBanner.count() > 0) {
  const acceptBtn = cookieBanner.getByRole('button', { name: /accept|agree|ok|got it/i });
  if (await acceptBtn.count() > 0) await acceptBtn.first().click();
}
```

## Handle new tabs/popups

```javascript
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.getByText('Open in new tab').click(),
]);
await newPage.waitForLoadState();
```

## Handle iframes

```javascript
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: 'Submit' }).click();
```

## Handle embedded/hosted apps (Shopify, Salesforce, etc.)

Apps that run inside a host platform render in an iframe. ALL interactions must go through `frameLocator`.

```javascript
// Shopify apps — the app renders inside an iframe in the admin
const appFrame = page.frameLocator('iframe#app-iframe, iframe[src*="extensions"]');

// All selectors target the frame, not the page
await appFrame.getByRole('button', { name: 'Create product' }).click();
await appFrame.getByLabel('Title').fill('Summer Collection');

// Getting boundingBox from iframe elements — need the frame's element handle
const frameElement = await page.locator('iframe#app-iframe').elementHandle();
const frameBox = await frameElement.boundingBox();
const innerEl = await appFrame.getByRole('button', { name: 'Save' }).elementHandle();
const innerBox = await innerEl.boundingBox();
// Offset inner coordinates by frame position for accurate tracking
const absBox = {
  x: frameBox.x + innerBox.x,
  y: frameBox.y + innerBox.y,
  width: innerBox.width,
  height: innerBox.height,
};
```

**Key points for embedded apps:**
- The host page (e.g. Shopify admin sidebar) is on `page` — the app content is in the `frame`
- Read the app's source code locally for selectors — they work the same inside the iframe
- `waitForURL` still works on `page` for host navigation
- Use `frame.locator()` for app-specific waiting: `await appFrame.locator('.loading').waitFor({ state: 'hidden' })`
- If the iframe `src` changes dynamically, re-acquire the frameLocator after navigation

## Handle file uploads

```javascript
await page.getByLabel('Upload file').setInputFiles('path/to/file.pdf');
```

## Use slowMo for visible actions

```javascript
const browser = await chromium.launch({ headless: false, slowMo: 50 });
```

## Capture JS errors during recording

```javascript
const jsErrors = [];
page.on('pageerror', error => jsErrors.push(error.message));
page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
if (jsErrors.length > 0) console.warn('JS errors during recording:', jsErrors);
```

## Enable tracing for debugging failed recordings

```javascript
await context.tracing.start({ screenshots: true, snapshots: true });
// ... run actions ...
// If something fails:
await context.tracing.stop({ path: '.vorec/trace.zip' });
// Debug with: npx playwright show-trace .vorec/trace.zip
```

## Retry flaky interactions

```javascript
for (let i = 0; i < 3; i++) {
  try { await element.click({ timeout: 5000 }); break; }
  catch { await page.waitForTimeout(1000 * (i + 1)); }
}
```

## Auto-detect dev servers

```javascript
import { exec } from 'node:child_process';
const ports = [3000, 3001, 4200, 5173, 8080];
// lsof -i :PORT to find which one is running
```


## Rules — troubleshooting

---
name: troubleshooting
description: Common errors and fixes for recording tutorials
---

# Troubleshooting

Run `npx @vorec/cli@latest check` first — it surfaces most issues in one command.

## App / CLI prerequisites

| Error | Fix |
|-------|-----|
| `Vorec Recorder app is not running` | Install from https://vorec.ai/download, open the app (it's a menubar icon) |
| `Vorec Recorder is not signed in` | Click the Vorec icon in the macOS menubar → sign in with magic link or password |
| `Screen Recording permission not granted` | Open the app → Settings → Permissions → Grant Screen Recording |
| `cliclick not found` | `brew install cliclick` — without it the mouse cursor won't be visible in recordings |
| `Vorec API key missing` | `npx @vorec/cli@latest login` (or `npx @vorec/cli@latest init`) |
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

## Resolution drops mid-session

**Symptom:** previous recording was full retina (e.g. 3456×2158), the next one is sub-retina (1306×810 or smaller).

**Cause:** Chrome process from the previous recording didn't fully exit. The new launch reused a leftover smaller window.

**Fix before every recording in a session that already had one:**
```bash
playwright-cli close-all 2>/dev/null
pkill -9 -f "Google Chrome for Testing"
sleep 3
```

Then run `vorec run` again. If the file still comes out at 0 bytes, the Vorec Recorder app is in a stuck state — quit it from the menubar and reopen.

## Click fires but URL doesn't change

**Symptom:** Playwright reports the click succeeded, but the page didn't navigate or the wrong content loaded.

**Cause:** the text-based selector (e.g. `text=Classic Mexicano`) matched MORE THAN ONE element on the page — typically a hidden sidebar/footer link with the same label. Playwright picked the wrong one.

**Fix:** before clicking, run a uniqueness check (see [./live-site-discovery.md](./live-site-discovery.md) → "Selector uniqueness check"). If >1 match, switch to a URL-based selector: `"a[href='/exact/path']"`.

## Validation issues

If `vorec run` succeeds but the resulting video shows validation errors / disabled buttons / failure states, the manifest used bad test data. Load [./validation.md](./validation.md) for how to read validators and produce good data.
