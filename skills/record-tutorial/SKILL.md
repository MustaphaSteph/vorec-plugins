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

## 🎯 FIRST: Load agent-behavior rules

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

### API key

The CLI needs a Vorec API key for analysis steps. Save once: `npx @vorec/cli init` (the skill's rule files cover this — see [./rules/auth.md](./rules/auth.md)).

## Step 1: Create a project folder + write the manifest

Every recording gets its own folder under `.vorec/` so multiple recordings in the same repo don't overwrite each other. Pick a short slug from the tutorial title.

```bash
# Example: "How to Create a Tournament" → tournament
mkdir -p .vorec/<project-slug>
```

Write `.vorec/<project-slug>/vorec.json`. Structure:

```
.vorec/
├── storageState.json                  # shared session (one per origin)
└── <project-slug>/
    └── vorec.json                     # manifest for this recording
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

**Default recommendation:** always set `"chromeless": true` unless you have a reason not to. Nobody wants Chrome's tab bar and address bar in their tutorial video.

**Action types:** `click` · `type` · `select` · `hover` · `scroll` · `wait` · `navigate` · `narrate`.

**Every action carries these four text-ish fields — always write all four:**

| Field | Purpose | Length |
|---|---|---|
| `description` | Timeline label shown in the editor | 5–10 words |
| `context` | Rich scene description (what's on screen, why it matters) — used by Vorec to ground narration generation | 1–3 sentences |
| `narration` | Draft of the spoken script for this moment — always included in the JSON Vorec receives; becomes final verbatim if `skipNarration: true`, otherwise Vorec polishes it | 1 spoken line |
| `pause` | Hold time in ms the narration has to be spoken in. Formula: `wordCount × 350 + 500` | integer |

- `narrate` = no interaction, just a pause with a scene description.
- `primary: true` on exactly ONE action per page = "this is the key click, zoom on it, gold-star it in the timeline".

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

## Step 1.5: Show the recording plan to the user

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

## Step 2: Record (no upload yet)

```bash
npx @vorec/cli run .vorec/<project-slug>/vorec.json
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

### Verbatim narration mode

If you want your `narration` drafts used word-for-word (no Gemini rewrite), pass `--skip-narration` during `vorec run`. It's recorded in the sidecar and honored by the later `vorec analyze` call:

```bash
npx @vorec/cli run vorec.json --skip-narration
```

## Step 3: Show the MP4 to the user and wait for approval

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

**Do not proceed until the user explicitly approves.** If they reject, discard the recording from the Vorec Recorder app → Library and re-run from Step 2.

## Step 4: On approval, upload + analyze

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

## Step 5: Report

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
