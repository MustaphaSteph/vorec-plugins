---
name: record-tutorial
description: >
  Record narrated tutorial videos via the Vorec Recorder macOS app.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration. Also use when the user wants to update
  narration or translations on an existing Vorec project.
---

# Record Tutorial with Vorec

## What is Vorec?

Vorec (vorec.ai) turns screen recordings into narrated tutorial videos. You record a flow — Vorec adds AI voice-over, zoom effects, cursor animations, subtitles, and a full video editor.

## How recording works

Recording is done by the **Vorec Recorder desktop app** (macOS only). The app captures the browser window natively (ScreenCaptureKit, 2× retina, H.264), uploads to Vorec, and returns an editor URL. The CLI (`@vorec/cli`) is a driver: it automates the browser and tells the app what to capture.

**You do not record with Playwright, FFmpeg, or any other tool. Only the app records. If the app is not installed, stop and tell the user to install it — do not suggest alternatives.**

## Your role as the AI agent

1. Verify the app is ready (installed, signed in, permission granted).
2. Write a `vorec.json` manifest describing the flow (url, viewport, actions).
3. Run `npx @vorec/cli run vorec.json`. The CLI launches Chromium, tells the app to record that window, drives the actions, stops, uploads, and starts analysis.
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

Before anything else, load [./rules/agent-behavior.md](./rules/agent-behavior.md). It's short and teaches you:
- Act first, ask later
- Never batch 3+ questions
- Prefer sensible defaults
- Fix silently, retry without reporting small failures
- End with a link/path, not an essay

**These rules override everything else.**

## Step 0: Detect the mode

**Auto-detect — don't ask the user unless you're unsure:**

- Project has `shopify.app.toml` OR URL is `admin.shopify.com/...` → **Shopify Admin mode** (load [./rules/shopify-admin.md](./rules/shopify-admin.md))
- User mentions an external URL (any third-party site — SaaS dashboards, landing pages, competitor products) → **Explore mode**
- User mentions their own project and you can see the codebase → **Connected mode**
- Not sure → ask ONE question.

**Shopify Admin:** embedded apps require special handling — never record from the raw tunnel URL, never automate Google login, use a dedicated browser profile.
**Connected:** you have the source code — read components for selectors, validation, success states.
**Explore:** you don't have the code — discover the page via Playwright snapshots. Load [./rules/explore.md](./rules/explore.md).

## Step 0.5: Detect the recording type

Load [./rules/recording-types.md](./rules/recording-types.md), then classify: task tutorial / website tour / bug reproduction / UX review.

For external URLs in Explore mode, also load [./rules/live-site-discovery.md](./rules/live-site-discovery.md).

## Prerequisites — ALL must pass

Run this single command and read the output:

```bash
npx @vorec/cli check
```

It verifies:
- **Vorec Recorder app** is running (macOS only)
- **User is signed in** to the app
- **Screen Recording permission** is granted
- **cliclick** is installed (so the cursor is visible in recordings)
- **Vorec account** has credits and project slots available

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

The CLI needs a Vorec API key for analysis steps. Save once: `npx @vorec/cli init` (the skill's rule files cover this — see [./rules/auth.md](./rules/auth.md)).

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

When the request includes a link to a help article, documentation page, or any step-by-step guide (Crisp help, Intercom, Notion docs, blog tutorial, etc.) — **load [./rules/article-guide-parsing.md](./rules/article-guide-parsing.md) now**. That article is the source of truth for what the video must show: its screenshots define the UI states, its demo values define what to type. Parse them before writing anything.

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
- **Login page / redirect to auth** → login required. Open in headed mode so the user can sign in, capture the session. Load [./rules/auth.md](./rules/auth.md).
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

Rule files: [./rules/explore.md](./rules/explore.md) for Explore flows, [./rules/connected.md](./rules/connected.md) for Connected flows, [./rules/live-site-discovery.md](./rules/live-site-discovery.md) for extra guidance on safe discovery on third-party sites.

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

**Optional top-level fields that matter for specific surfaces:**

- `"chromeless": true` — **use this by default for single-URL tutorials on regular websites** (acme.com, google.com, any SaaS dashboard, any landing page). Launches Chromium in `--app=<url>` mode: no tab bar, no address bar, no bookmarks bar — the entire window is the webpage. Clean, tutorial-ready video with no browser UI bleed-through.
- `"recordFrame": "<iframe css selector>"` — auto-crops the MP4 to just that iframe's pixels. For **embedded apps** where the target UI lives inside a cross-origin `<iframe>` and the host chrome shouldn't end up in the tutorial: Shopify Admin (`iframe[src*='myshopify']`), Stripe Checkout, Salesforce Lightning, Intercom, YouTube embeds. Do **not** set `chromeless` together with `recordFrame` — the iframe crop already removes host chrome.
- `"viewport": "full"` — maximize the browser window instead of a fixed size.

### Decision tree for "do I want browser chrome in my recording?"

| Situation | Field to set |
|---|---|
| Recording a regular website (google.com, stripe.com, your SaaS dashboard) | `"chromeless": true` |
| Recording an embedded app inside another host (Shopify Admin, Salesforce, etc.) | `"recordFrame": "<iframe selector>"` |
| Recording a tutorial about the browser itself (extensions, DevTools, etc.) | neither — leave the full window visible |

**Default behavior (CLI 2.24+):** `chromeless: true` is the default — you do NOT need to set it. Browser chrome is hidden automatically. Only set `"chromeless": false` if you specifically want the URL bar / tabs visible (e.g. recording a tutorial about Chrome itself or browser extensions).

**Action types:** `click` · `type` · `select` · `hover` · `scroll` · `wait` · `navigate` · `narrate`.

For scroll mechanics (reveal-before-click, SPA reset trap, smooth scroll), load [./rules/scroll.md](./rules/scroll.md).

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

### How narration actually works

Vorec **always** receives the full JSON — including your `narration` and `pause`. The `--skip-narration` flag on `vorec run` only controls whether Vorec polishes your draft or uses it verbatim. **Ask the user upfront which mode they want** (see the third preference in [./rules/agent-behavior.md](./rules/agent-behavior.md)):

| `--skip-narration` | When to pass it | Result |
|---|---|---|
| omitted (default) | User picked "Vorec polishes" | Vorec regenerates narration using your draft + context as grounding. Polished for pacing/tone, semantically faithful to what you wrote. |
| passed | User picked "verbatim" (legal copy, brand voice, exact wording) | Your `narration` becomes the final spoken script verbatim. One segment per action, no merging, no intro. |

**Write narration drafts for every action regardless of mode.** They're never wasted — they ground Vorec even when being rewritten. The mode flag only decides how Vorec treats the drafts.

Full action reference: [./rules/actions.md](./rules/actions.md).
Narration guidance: [./rules/narration-rules.md](./rules/narration-rules.md) and [./rules/narration-styles.md](./rules/narration-styles.md).
Writing good `context`: [./rules/context-writing.md](./rules/context-writing.md).

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
npx @vorec/cli run .vorec/<slug>-<timestamp>/vorec.json
```

### ❌ Do NOT substitute MCP Playwright for the recording

You have MCP Playwright tools available (`mcp__playwright__browser_click`, `browser_type`, `browser_navigate`, etc.) — those are for **Phase 3a/3b discovery only**. Never try to run the actual tutorial flow through them. Concretely:

| Behavior | `@vorec/cli` (Phase 7) | MCP Playwright |
|---|---|---|
| Typing | 50ms per character → looks like a real human typing | 0ms default → text appears instantly (looks like paste) |
| Scroll | Split into 25px chunks at ~50fps → smooth glide | Single wheel event → snap |
| Cursor between targets | `glideCursor` ease-in-out animation, samples written to cursor_track sidecar | Cursor teleports, no track recorded |
| Click feedback in final video | Coordinate emitted → editor overlays synthetic cursor + ripple at export | No track, editor has nothing to overlay |

If you drove the recording with MCP Playwright instead of `@vorec/cli run`, the final tutorial would: (a) text-paste instead of type, (b) snap-scroll instead of glide, (c) have no visible cursor or click ripples on the exported video. Discovery tools are not playback tools.

**Rule:** MCP Playwright + agent-browser + playwright-cli for discovery (Phase 3a/3b). `@vorec/cli` for the recording (Phase 7). Never swap them.

### What happens during `vorec run`

1. CLI confirms the app is ready (otherwise aborts with a clear error).
2. Chromium launches at a fixed position so page coords map to screen coords.
3. CLI tells the app to record the Chromium window (native 2× retina H.264).
4. For each action: Playwright fires the action with humanlike pacing (50ms-per-char typing, 25px-step smooth scroll), cursor path is tracked between targets via `glideCursor`.
5. On stop: the app finalizes the MP4 at `~/Movies/Vorec/recording-<ts>.mp4`.
6. CLI writes a session sidecar `recording-<ts>.vorec.json` next to the MP4 with the manifest meta + tracked actions + cursor track.
7. **No upload. No credits spent.** CLI prints the local MP4 path and exits.

**Recording quality is fixed: 2× retina, 30 fps, H.264. Do not ask the user about quality, dpr, codec, or cursor styling — those aren't configurable.**

### Where the visible click effect comes from

The raw recorded MP4 has **no cursor by default** — Playwright clicks happen inside the page DOM, not via the OS cursor. **You don't need to fix this.** Vorec's editor overlays a synthetic cursor + click ripples + shape switching (arrow / pointing hand / I-beam / open / closed hand) on the final exported video, driven by the click coordinates and cursor_track in your manifest's sidecar. Both come from `@vorec/cli`'s output — which is the second reason MCP Playwright can't substitute for it.

Optional: set `"moveCursor": true` in the manifest if you want the OS cursor visible in the raw recording too. Requires `brew install cliclick`. Skip unless the user specifically asks — the synthetic cursor on export looks better and doesn't hijack their real mouse.

### Verbatim narration mode

If you want your `narration` drafts used word-for-word (no Gemini rewrite), pass `--skip-narration` during `vorec run`. It's recorded in the sidecar and honored by the later `vorec analyze` call:

```bash
npx @vorec/cli run vorec.json --skip-narration
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
npx @vorec/cli analyze "/Users/you/Movies/Vorec/recording-1776774835.mp4"
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
npx @vorec/cli segments --project <id> --json > segments.json

# Edit segments.json — update the "script" field on any row
npx @vorec/cli update-narration segments.json --project <id>
```

Details: [./rules/agent-behavior.md](./rules/agent-behavior.md) covers when to do this automatically.

## Translating narration

```bash
# List what exists
npx @vorec/cli languages --project <id>

# Pull English segments as the source of truth
npx @vorec/cli segments --project <id> --json > en.json

# Write a translations file
cat > es.json <<'EOF'
[
  { "id": "<segment-id>", "script": "Spanish text…" }
]
EOF

# Push
npx @vorec/cli update-translations es.json --language es --project <id>
```

Translations cost 0 credits — you (the agent) write them directly. Don't mention Vorec's internal AI models.

## When things go wrong

Load [./rules/troubleshooting.md](./rules/troubleshooting.md). Common issues:
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
