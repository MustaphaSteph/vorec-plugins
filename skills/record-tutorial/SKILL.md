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

Once the user provides the key, save it:
```bash
npx @vorec/cli@latest init
```
Then enter the key when prompted.

**���️ DO NOT proceed with ANY recording steps until you have a valid API key.** No key = no upload = wasted recording. Check credits to verify:
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

### 4. Explore the page

**Connected mode:** Deep-scan the codebase. Load [./rules/connected.md](./rules/connected.md).

**Explore mode:** Use snapshots to discover the page structure:
```bash
playwright-cli snapshot
```
Load [./rules/explore.md](./rules/explore.md) for semantic locators and page discovery.

Find: selectors for elements to interact with, valid test data, expected results, wait conditions.

### 5. Map the flow

Plan the sequence of steps you'll record. For each step, note:
- What page/section we're on
- What interactions will happen (clicks, types, hovers)
- Approximately how long it will take

Don't write narration yet — just the plan. This becomes the outline you'll show the user in Step 7.

See [./rules/narration-styles.md](./rules/narration-styles.md) for style descriptions (ready for when the user picks a style in Step 7).

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

### 7. Show the recording plan + ask preferences

**Before writing any code, present the full plan AND ask the 4 preference questions in ONE message.** The user approves both at once.

Format:

> I've mapped the flow. Here's the plan:
>
> **Tutorial: [Title] ([estimated total time])**
>
> **Step 1 — [Section name] ([Xs])**
> — [What you'll do: hover this, click that, narrate over X]
>
> **Step 2 — [Section name] ([Xs])**
> — [What you'll do]
>
> ...
>
> Before I start, four quick choices:
> 1. **Language?** (default: English)
> 2. **Narration style?** Tutorial / Professional / Conversational / Storytelling / Persuasive / Academic / Concise / Exact (default: Tutorial)
> 3. **Quality?** 1080p / 2K / 4K (default: 1080p)
> 4. **Visible cursor?** Yes / No (default: No)
>
> Reply with adjustments or say "go" to use these defaults.

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
  { "step": 1, "action": "hover", "name": "Mixed Americano card",
    "narration": "Let's start by building a gender-balanced tournament. Mixed Americano pairs one male and one female player per team, rotating every round." },
  { "step": 2, "action": "click", "name": "Mixed Americano",
    "narration": "Click Mixed Americano to jump into the setup wizard." },
  ...
]
```

This way you see the full narration script as a document. Check:
- Does it flow naturally from step to step?
- Does each narration match the chosen style?
- Are there any freeze-sync risks (narration too long for the visual moment)?

Fix it here before writing the script.

### 9. Build the recording script

Now that the narration is written, build `vorec-script.mjs` using those narrations:

```js
const n1 = "Let's start by building a gender-balanced tournament...";
await hoverTour(card, 'Mixed Americano card', '...', n1, pauseFor(n1));

const n2 = "Click Mixed Americano to jump into the setup wizard.";
await glideClick(link, 'Mixed Americano', '...', 'mixed-link', '...', n2, pauseFor(n2));
```

Each `pauseMs` is calculated from the narration you already wrote. No guessing.

Load [./rules/vorec-script.md](./rules/vorec-script.md) for the template.

Load [./rules/vorec-script.md](./rules/vorec-script.md) for the template. Write the script to `.vorec/<project-slug>/vorec-script.mjs`.

What to include:
- Quality preset based on user's choice (4K / 2K / 1080p)
- `scrollToElement`, `glideClick`, `slowType`, `hoverTour` helpers
- A `track()` call for every action — with `name`, `description`, `context`, and `primary` markers
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

Tell the user:
> Writing the recording script now...

### 10. Record the video

```bash
node .vorec/<project-slug>/vorec-script.mjs
```

**Tell the user what's happening while it runs:**
> Recording in progress... The script is walking through the flow now.

When it finishes:
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

1. **Tracked actions** (`.vorec/tracked-actions.json`) → sent to `create-project` API → saved as `project_clicks` in Vorec DB. Each action has: `type`, `timestamp`, `coordinates` (0-1000), `description`, `context`, `target`, `typed_text`, `primary`.

2. **Video** (`.vorec/<project-slug>/output.mp4`) → uploaded to Vorec storage via presigned URL.

3. **Generate narration** → Vorec AI reads the tracked actions (`description` + `context` fields) and writes voice-over scripts. **Because the agent sent tracked actions, Vorec skips video-based click detection** — it already knows what was clicked, when, and where.

4. **CLI polls** until narration is ready → shows the editor URL.

**Without tracked actions**, Vorec would have to watch the video and guess where clicks happened (slower, less accurate, same cost). The agent's tracked actions are what make the narration precise.

### 12. Clean up

After successful upload, remove the script and manifest (keep the video):
```bash
rm -f .vorec/<project-slug>/vorec-script.mjs .vorec/<project-slug>/vorec.json .vorec/<project-slug>/tracked-actions.json
```

Keep `output.mp4` — the user may want it. If the user declined upload, keep everything.

### 13. Share the result

If uploaded:
> Your tutorial is ready! Open the editor here: [EDITOR_URL]

If not uploaded:
> Video saved at: [VIDEO_PATH]

## Key Rules

1. **Tell the user what you're doing** — before every step, explain in plain language what's about to happen. Show the recording plan before starting. Never leave the user wondering.
2. **API key first** — do NOT start anything without a valid API key. Ask user to get one from vorec.ai/settings → API Keys.
3. **Act first, ask later** — do blocking actions (install tools, open browser) then announce. Don't ask permission.
4. **Never batch 3+ questions** — max 2 at a time, prefer defaults
5. **Always use `--headed`** for `playwright-cli open` when the user needs to see/interact (login, session capture)
6. **Auto-detect mode** — external URL = Explore, own project = Connected. Don't ask unless genuinely unsure.
7. **Never assume login** — check the page first with a snapshot. Only handle auth if you SEE a login wall.
8. **Use `playwright-cli` for exploration**, standalone vorec script (`node vorec-script.mjs`) for recording
9. **1080p by default** — record 1080p DPR 2 via recordVideo. For 2K/4K, FFmpeg upscales with lanczos
10. **Scroll to the element, not past it** — use `scrollToElement`, never blind pixel scrolling
11. **Use semantic locators** — `getByRole`, `getByLabel`, `getByPlaceholder`
12. **Track every action** — with `name`, `description`, `context`, and `primary` markers
13. **User validates video before upload** — show the path, ask them to review
14. **Always offer Vorec upload** after recording
15. **End with a link** — editor URL or video path, not a summary essay
16. Never ask for passwords — use `storageState` for app auth
17. Clean up temp files (keep video if user declined upload)

## Reference Files

### Agent behavior (load this FIRST)
- [./rules/agent-behavior.md](./rules/agent-behavior.md) — Act first, ask later, prefer defaults, fix silently

### Workflow rules
- [./rules/connected.md](./rules/connected.md) — Connected mode (codebase-driven)
- [./rules/explore.md](./rules/explore.md) — Explore mode (page-driven)
- [./rules/vorec-script.md](./rules/vorec-script.md) — Recording script template + action types
- [./rules/narration-styles.md](./rules/narration-styles.md) — All 8 narration styles with examples
- [./rules/pacing.md](./rules/pacing.md) — Timing rules per narration style
- [./rules/context-writing.md](./rules/context-writing.md) — How to write context
- [./rules/narration-rules.md](./rules/narration-rules.md) — The exact rules Vorec AI follows — agent writes narration matching these rules
- [./rules/cursor-pack.md](./rules/cursor-pack.md) — Visible cursor injection (opt-in)

### playwright-cli reference
- [./rules/cli-commands.md](./rules/cli-commands.md) — Core commands
- [./rules/cli-video.md](./rules/cli-video.md) — Video recording API
- [./rules/cli-running-code.md](./rules/cli-running-code.md) — Running vorec scripts
- [./rules/cli-session.md](./rules/cli-session.md) — Session management

### Existing references
- [./rules/playwright.md](./rules/playwright.md) — Playwright best practices
- [./rules/validation.md](./rules/validation.md) — Test data, error recovery
- [./rules/auth.md](./rules/auth.md) — Session capture
- [./rules/actions.md](./rules/actions.md) — Action types
- [./rules/troubleshooting.md](./rules/troubleshooting.md) — Common errors
