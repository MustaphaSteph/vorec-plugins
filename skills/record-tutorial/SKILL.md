---
name: record-tutorial
description: >
  Record screen and generate narrated tutorial videos with AI voice-over.
  Use when the user wants to record a tutorial, demo video, screencast, walkthrough,
  or any screen recording with narration.
---

# Record Tutorial with Vorec

## What is Vorec?

Vorec (vorec.ai) turns screen recordings into narrated tutorial videos. You record a flow — Vorec adds AI voice-over, zoom effects, cursor animations, subtitles, and a full video editor.

## Your role as the AI agent

You are the **recorder**. You:
1. Open a browser (headless, user never sees it)
2. Walk through the flow the user asked for (click buttons, fill forms, navigate pages)
3. Capture a high-quality video with every action tracked (what was clicked, when, where, and why)
4. Upload the video + tracked actions to Vorec

Vorec then:
1. Reads your tracked actions (descriptions, context, coordinates)
2. Writes narration scripts that explain each step
3. Places click markers, zoom targets, and cursor effects using your coordinates
4. Gives the user an editor URL where they can preview, edit, and export

**The better your action tracking (name, description, context), the better Vorec's narration will be.** You are the eyes — Vorec is the voice.

**Recording benchmarks:**
- Short tutorial: 5–15 tracked actions
- Deep walkthrough: 15–30 tracked actions
- Final video sweet spot: 1–3 minutes
- More than 30 actions or 4 minutes → consider splitting into multiple recordings

**Work cleanly:** Temp files created fresh, deleted after upload. User sees only the editor URL.

## 🎯 FIRST: Load agent-behavior rules

Before anything else, load [./rules/agent-behavior.md](./rules/agent-behavior.md). It's short and teaches you:
- Act first, ask later
- Never batch 3+ questions
- Prefer sensible defaults
- Default to headed mode when the user needs to interact
- Fix silently, retry without reporting small failures
- End with a link/path, not an essay

**These rules override everything else.** If a step below tells you to ask a question, first check agent-behavior.md to see if you can answer it with a default.

## Step 0: Detect the mode

**Auto-detect — don't ask the user unless you're unsure:**

- User mentions an external URL (padelmake.com, stripe.com, etc.) → **Explore mode**
- User mentions their own project and you can see the codebase → **Connected mode**
- User says "record my app" while you're in a project directory → **Connected mode**
- Not sure → ask ONE question: "Is this your project (I can read the code) or an external site?"

**Connected:** you have the source code — read components for selectors, validation, success states.
**Explore:** you don't have the code — discover the page via snapshots and semantic locators. Load [./rules/explore.md](./rules/explore.md).

Both modes follow the same workflow below and end with the same upload pipeline.

## Prerequisites

**Run ALL checks. Fix before continuing.**

```bash
# 1. Playwright CLI (used by both Connected and Explore modes)
npx @playwright/cli@latest --version 2>/dev/null || npm install -g @playwright/cli@latest
npx playwright install chromium 2>/dev/null

# 2. FFmpeg
ffmpeg -version 2>/dev/null || echo "MISSING: brew install ffmpeg"

# 3. Vorec CLI
npx @vorec/cli@latest --version
```

**4. Vorec API key — REQUIRED before anything else:**
```bash
cat ~/.vorec/config.json 2>/dev/null
```
If no API key is configured, ask the user:

> **I need your Vorec API key to continue.**
> Go to [vorec.ai/settings](https://vorec.ai/settings) → API Keys → Create Key → copy it and paste it here.

Once the user provides the key, save it directly:
```bash
mkdir -p ~/.vorec && echo '{"apiKey":"USER_KEY_HERE","apiBase":"api.vorec.ai/agent"}' > ~/.vorec/config.json
```
Replace `USER_KEY_HERE` with the key the user pasted. Do NOT use `vorec init` for the agent workflow — it can hang because it waits for interactive input.

Verify the key works:
```bash
npx @vorec/cli@latest check
```
If `check` fails → the key is invalid. Ask the user again. Do not continue.

## Workflow

### 1. Verify API key + credits
```bash
npx @vorec/cli@latest check
```
If this fails, stop and ask for a valid API key. Do not proceed.

### 2. Understand what to record

The user already told you what to record. Confirm it back to them in plain language:

> "Got it — I'll record a step-by-step guide of [what they asked for] on [site/app]."

If anything is unclear, ask **one** specific question:
> "Should I include [specific part] in the recording, or just [other part]?"

Do NOT ask generic questions like "What's the goal?" or "Who's watching?" — just start.

### 3. Check the page first — don't assume login

**Everything runs in the background — no visible browser.** The user never sees a browser window unless they need to log in. Recording, exploration, and uploading all happen headless.

Check if the page is publicly accessible:

```bash
playwright-cli open <URL>
playwright-cli snapshot
```

Look at the snapshot:
- **Public page with content visible?** → No login needed. Continue to Step 4.
- **Login page or redirect to auth?** → Login required. Open browser in **headed mode** (`--headed`) so user can log in. Load [./rules/auth.md](./rules/auth.md).
- **Some content visible but action requires auth?** → Ask the user: "Do I need to log in for [specific action]?"

**NEVER assume login is needed.** Most public websites (marketing sites, docs, tools) don't require auth. Only handle auth when you SEE a login wall or the user tells you it's needed.

### 4. Explore the page (full dry-run)

**Walk the entire flow end-to-end BEFORE writing any script.** This is where you discover validation rules, required fields, unexpected dialogs, and success states. Fix all surprises HERE, not during recording.

**Connected mode:** Deep-scan the codebase. Load [./rules/connected.md](./rules/connected.md).

**Explore mode:** Dry-run the flow using `playwright-cli`:
```bash
playwright-cli open <URL>
playwright-cli snapshot
playwright-cli click e15    # test each interaction
playwright-cli fill e8 "test value"
playwright-cli snapshot     # verify result
# ... walk the whole flow to the success state
```
Load [./rules/explore.md](./rules/explore.md) for the full dry-run workflow.

Save findings to `.vorec/<slug>/flow-notes.md`:
- Selectors that work
- Valid input data (what passes validation)
- Required fields + error messages
- Hidden dialogs/modals that appear
- Success states at each step
- Gotchas (disabled buttons, timing issues, state carryover)

The recording script just replays this known-working flow. No surprises.

### 5. Map the flow

Plan the sequence of steps you'll record. For each step, note:
- What page/section we're on
- What interactions will happen (clicks, types, hovers)

Don't write narration yet. Don't estimate durations. Just the structure of visual steps. This becomes the outline you'll show the user when asking preferences and showing the plan. Real timing comes from the narration draft.

See [./rules/narration-styles.md](./rules/narration-styles.md) for style descriptions (ready for when the user picks a style).

### 6. Create the project folder

Each recording gets its own unique folder under `.vorec/`. Use a slug + timestamp so different sessions never collide:

```bash
# Format: <slug>-<YYYYMMDD-HHMMSS>
# Example: padelmake-tournament-20260413-153022
mkdir -p .vorec/<slug>-<timestamp>
```

All files for this recording go inside:
```
.vorec/padelmake-tournament-20260413-153022/
├── vorec-script.mjs      # the recording script
├── output.mp4             # the recorded video
├── tracked-actions.json   # action data for Vorec
└── vorec.json             # manifest for upload
```

This way:
- Multiple recordings of the same flow don't overwrite each other
- Different sessions working in the same project stay separate
- The user can see which recording is which by the timestamp

### 7. Ask preferences, then show the plan

Ask preferences FIRST — style affects how narration is written and how the plan reads.

If the user already said "defaults", "record with defaults", or "quick record", use English, Tutorial, 1080p, no visible cursor and continue without asking this preference block.

> Before I start recording, four quick choices:
> 1. **Language?** (default: English)
> 2. **Narration style?** Tutorial / Professional / Conversational / Storytelling / Persuasive / Academic / Concise / Exact (default: Tutorial)
> 3. **Quality?** 1080p / 2K / 4K (default: 1080p)
> 4. **Visible cursor?** Yes / No (default: No)
>
> Or say "defaults" for English, Tutorial, 1080p, no cursor.

After the user answers (or after applying explicit defaults), show the plan:

> Here's the recording plan:
>
> **[Title]**
>
> **Step 1 — [Section name]**
> — [What you'll do: hover this, click that, narrate over X]
>
> **Step 2 — [Section name]**
> — [What you'll do]
>
> ...
>
> Adjust anything or say "go" to start.

Real durations are calculated from narration word count.

**Wait for the user.** They might:
- Adjust steps: "Skip step 2", "Step 5 is too long", "Add settings step"
- Pick preferences: "Conversational style, 4K quality"
- Just say "go" → use defaults

This is the user's last checkpoint before recording.

### 8. Write narration drafts (BEFORE writing the script)

**Generate the narration text for every tracked action FIRST, before any code.**

For each step in the approved plan, write:
- One narration per visual moment (see [./rules/narration-rules.md](./rules/narration-rules.md))
- In the chosen style's tone
- Sized to fit the visual moment (if 3 clicks happen in 2 seconds, ONE combined narration — don't split)
- Demo data vs real choices rules apply (typed = demo, clicked = real)

Save as `.vorec/<project-slug>/narration-drafts.json`:
```json
[
  { "step": 1, "action": "hover", "name": "Dashboard overview",
    "narration": "Here's the dashboard — this is where everything starts. The main actions are on the right panel." },
  { "step": 2, "action": "click", "name": "New item",
    "narration": "Click the primary button to open the creation dialog." },
  ...
]
```

**Show the narration drafts to the user before building the script:**

> Here's what I'll say over each step:
>
> **1. [name]** (pauseMs: [N]) — "[narration text]"
> **2. [name]** (pauseMs: [N]) — "[narration text]"
> ...
>
> Total: ~[X]s ([M:SS]). Adjust any line or say "go".

**Wait for user confirmation.** They might:
- Reword a narration line
- Say a step needs more/less explanation
- Cut steps that feel redundant

Fix narration here before writing the script. This is the cheapest place to iterate — no video to re-record.

### 9. Build the recording script

Now that the narration is written, build `vorec-script.mjs` using those narrations:

```js
const n1 = "Let's start by building a gender-balanced tournament...";
await hoverTour(card, 'Mixed Americano card', 'Explain the tournament type card', n1, pauseFor(n1));

const n2 = "Click Mixed Americano to jump into the setup wizard.";
await glideClick(
  link,
  'Mixed Americano',
  'Open the Mixed Americano setup',
  'mixed-link',
  'The tournament type cards are visible. Mixed Americano is the option for gender-balanced rotation.',
  n2,
  pauseFor(n2),
);
```

Each `pauseMs` is calculated from the narration you already wrote. No guessing.

Load [./rules/vorec-script.md](./rules/vorec-script.md) for the template. Write the script to `.vorec/<project-slug>/vorec-script.mjs`.

What to include:
- Quality preset based on user's choice (4K / 2K / 1080p)
- `scrollToElement`, `glideClick`, `slowType`, `hoverTour` helpers
- A `track()` call for every action — with `name`, `description`, `context`, `narration`, `pause`, and `primary` markers
- Storage-state loading when `.vorec/storageState.json` exists, so authenticated recordings reuse captured sessions
- `scrollToElement` before every interaction (never scroll blindly)
- Timing from [./rules/pacing.md](./rules/pacing.md) matched to the narration style
- Output paths pointing to the project folder

If **visible cursors = Yes**, also load [./rules/cursor-pack.md](./rules/cursor-pack.md).

For **Explore mode** page discovery (before writing the script), use `playwright-cli`:
- [./rules/cli-commands.md](./rules/cli-commands.md) — `open`, `click`, `snapshot`, `resize`, etc.
- [./rules/cli-session.md](./rules/cli-session.md) — `close-all`, session management

For action types: [./rules/actions.md](./rules/actions.md)
For writing context: [./rules/context-writing.md](./rules/context-writing.md)
For writing narration: [./rules/narration-rules.md](./rules/narration-rules.md) — **the agent writes narration following these rules; word count sizes the pause**
For error recovery: [./rules/validation.md](./rules/validation.md)
For end-state verification + asking user for help when stuck: [./rules/end-state-verify.md](./rules/end-state-verify.md)

Tell the user:
> Writing the recording script now...

### 10. Record the video

```bash
node .vorec/<project-slug>/vorec-script.mjs
```

**Tell the user what's happening while it runs:**
> Recording in progress... The script is walking through the flow now.

**If the script fails or hits an error:** Load [./rules/end-state-verify.md](./rules/end-state-verify.md). Read the current screen, diagnose the issue, fix the script, or ask the user for help. Never continue past a broken state silently.

**Before ending the recording, verify end state** — no validation errors, no disabled buttons, no failure messages. If the flow broke, fix it and re-record. Don't ship a broken video.

When it finishes clean:
> Recording done! Saved to `.vorec/<project-slug>/output.mp4` ([count] actions tracked).
> Please review the video to make sure it looks good.

Ask user to validate the video before uploading.

### 11. Upload to Vorec

After the user validates the recording, ask:

> Want me to upload it to Vorec? You'll get:
> - **AI voice-over** — natural narration explaining each step
> - **Zoom & spotlight** — auto-zoom into clicked elements
> - **Cursor effects** — click ripples, pointer animations
> - **Callouts & shapes** — arrows, circles, text overlays
> - **Background & intro** — gradients, title cards, music
> - **Subtitles** — auto-generated in any language
> - **Timeline editor** — adjust timing, trim, re-record
> - **Export** — up to 4K, 60fps

If yes, write the manifest to `.vorec/<project-slug>/vorec.json`:

```json
{
  "title": "How to Create a Padel Tournament on PadelMake",
  "url": "https://padelmake.com",
  "language": "en",
  "narrationStyle": "tutorial"
}
```

**Manifest fields:**
| Field | Required | What it does |
|-------|----------|-------------|
| `title` | Yes | Project name in Vorec |
| `url` | Yes | The URL that was recorded |
| `language` | No | Narration language (default: `en`) |
| `narrationStyle` | No | Narration tone (default: `tutorial`) |
| `videoContext` | No | Extra context for AI narration (e.g. "This is a padel tournament generator app") |

No need for `actions` in the manifest — the real action data comes from `--tracked-actions`.

Then upload:
```bash
npx @vorec/cli@latest run .vorec/<project-slug>/vorec.json --skip-record \
  --video .vorec/<project-slug>/output.mp4 \
  --tracked-actions .vorec/<project-slug>/tracked-actions.json
```

Tell the user:
> Uploading video and action data to Vorec now...

**How data flows to Vorec:**

1. **Tracked actions** (`.vorec/<project-slug>/tracked-actions.json`) → sent to `create-project` API → saved as `project_clicks` in Vorec DB. Each action has: `type`, `timestamp`, `coordinates` (0-1000), `description`, `context`, `narration`, `pause`, `target`, `typed_text`, `primary`.

2. **Video** (`.vorec/<project-slug>/output.mp4`) → uploaded to Vorec storage via presigned URL.

3. **Generate narration** → Vorec uses the tracked action `narration` as the proposed script, with `description` and `context` as scene reference/fallback. **Because the agent sent tracked actions, Vorec skips video-based click detection** — it already knows what was clicked, when, and where.

4. **CLI polls** until narration is ready → shows the editor URL.

**Without tracked actions**, Vorec would have to watch the video and guess where clicks happened (slower, less accurate, same cost). The agent's tracked actions are what make the narration precise.

### 12. Clean up + share the result

After successful upload, delete only known temporary files inside the specific project folder. Do not use globs, do not delete `.vorec/` itself, and keep `output.mp4`.

```bash
rm -f .vorec/<project-slug>/vorec-script.mjs .vorec/<project-slug>/vorec.json .vorec/<project-slug>/tracked-actions.json .vorec/<project-slug>/narration-drafts.json .vorec/<project-slug>/flow-notes.md
```

> Your tutorial is ready! Open the editor here: [EDITOR_URL]

If the user declined upload:
> Video saved at: `.vorec/<project-slug>/output.mp4`

## Reference Files

### CORE — load always
- [./rules/agent-behavior.md](./rules/agent-behavior.md) — Communication rules, defaults, preferences
- [./rules/vorec-script.md](./rules/vorec-script.md) — Recording script template + action types
- [./rules/narration-rules.md](./rules/narration-rules.md) — How to write narration (per-style rules)
- [./rules/pacing.md](./rules/pacing.md) — pauseFor() formula + typing delays

### CONDITIONAL — load when needed
- [./rules/connected.md](./rules/connected.md) — Only in Connected mode
- [./rules/explore.md](./rules/explore.md) — Only in Explore mode
- [./rules/cursor-pack.md](./rules/cursor-pack.md) — Only if user wants visible cursors
- [./rules/auth.md](./rules/auth.md) — Only if login wall detected
- [./rules/end-state-verify.md](./rules/end-state-verify.md) — Only if recording fails or needs debugging
- [./rules/context-writing.md](./rules/context-writing.md) — Reference for writing context fields
- [./rules/narration-styles.md](./rules/narration-styles.md) — Reference for helping user pick a style
- [./rules/validation.md](./rules/validation.md) — Test data + error recovery
- [./rules/cli-commands.md](./rules/cli-commands.md) — playwright-cli commands (Explore mode)
- [./rules/cli-session.md](./rules/cli-session.md) — Session management
- [./rules/cli-video.md](./rules/cli-video.md) — Video quality settings
- [./rules/playwright.md](./rules/playwright.md) — Playwright best practices
- [./rules/actions.md](./rules/actions.md) — Action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors
