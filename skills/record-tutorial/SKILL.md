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

### 5. Ask recording preferences

**ALWAYS ask these questions before recording. Do NOT skip them.**

Ask in one message:
> Before I start, a few quick options:
> 1. **Language?** (default: English)
> 2. **Narration style?** Tutorial / Professional / Conversational / Storytelling / Persuasive / Academic / Concise / Exact (default: Tutorial)
> 3. **Quality?** 4K / 2K / 1080p (default: 4K)
> 4. **Visible cursor?** Yes / No (default: No)
>
> Or say "defaults" for English, Tutorial, 4K, no cursor.

See [./rules/narration-styles.md](./rules/narration-styles.md) for style descriptions.

**Wait for the user to answer before continuing.** These choices affect the recording script timing (from [./rules/pacing.md](./rules/pacing.md)) and context writing style.

### 6. Create the project folder

Each recording gets its own folder under `.vorec/`. Use a short slug from the title:

```bash
# Example: "How to Create a Tournament" → padelmake-tournament
mkdir -p .vorec/<project-slug>
```

All files for this recording go inside:
```
.vorec/<project-slug>/
├── vorec-script.mjs      # the recording script
├── output.mp4             # the recorded video
├── tracked-actions.json   # action data for Vorec
└── vorec.json             # manifest for upload
```

This way multiple recordings don't overwrite each other.

### 7. Show the recording plan

**Before writing any code, present the full plan to the user.** List every step with what you'll do, how long it will take, and the timing from [./rules/pacing.md](./rules/pacing.md).

Format:

> Here's the recording plan ([style] style, [quality]):
>
> **Step 1 — [Page/section name] ([Xs])**
> - [What you'll do: hover, click, type, narrate]
> - [What you'll do next]
>
> **Step 2 — [Page/section name] ([Xs])**
> - [What you'll do]
>
> ...
>
> **Total: ~[X] seconds (~[M:SS])**
>
> Want me to adjust anything before I start recording?

**Wait for the user to confirm or adjust.** They might say:
- "Skip step 2" → remove it
- "Step 5 is too long" → reduce actions
- "Add a step showing the settings" → add it
- "Looks good, go" → proceed

This is the user's last chance to change the flow before recording. Don't skip this step.

### 8. Build the recording script

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
For error recovery: [./rules/validation.md](./rules/validation.md)

Tell the user:
> Writing the recording script now...

### 9. Record the video

```bash
node .vorec/<project-slug>/vorec-script.mjs
```

**Tell the user what's happening while it runs:**
> Recording in progress... The script is walking through the flow now.

When it finishes:
> Recording done! Saved to `.vorec/<project-slug>/output.mp4` ([count] actions tracked).
> Please review the video to make sure it looks good.

Ask user to validate the video before uploading.

### 10. Upload to Vorec

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

2. **Video** (`./recordings/output.mp4`) → uploaded to Vorec storage via presigned URL.

3. **Generate narration** → Vorec AI reads the tracked actions (`description` + `context` fields) and writes voice-over scripts. **Because the agent sent tracked actions, Vorec skips video-based click detection** — it already knows what was clicked, when, and where.

4. **CLI polls** until narration is ready → shows the editor URL.

**Without tracked actions**, Vorec would have to watch the video and guess where clicks happened (slower, less accurate, same cost). The agent's tracked actions are what make the narration precise.

### 11. Clean up

After successful upload, remove the script and manifest (keep the video):
```bash
rm -f .vorec/<project-slug>/vorec-script.mjs .vorec/<project-slug>/vorec.json .vorec/<project-slug>/tracked-actions.json
```

Keep `output.mp4` — the user may want it. If the user declined upload, keep everything.

### 12. Share the result

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
7. **Use `playwright-cli` for exploration**, standalone vorec script (`node vorec-script.mjs`) for recording
8. **4K quality by default** — ask user for preferred quality (4K / 2K / 1080p)
9. **Scroll to the element, not past it** — use `scrollToElement`, never blind pixel scrolling
10. **Use semantic locators** — `getByRole`, `getByLabel`, `getByPlaceholder`
11. **Track every action** — `click`, `type`, `narrate`, `hover`, `scroll`, `select`, `wait`, `navigate` with `description`, `context`, and `primary` markers
12. **User validates video before upload** — show the path, ask them to review
13. **Always offer Vorec upload** after recording
14. **End with a link** — editor URL or video path, not a summary essay
15. Never ask for passwords — use `storageState` for app auth
16. Clean up temp files (keep video if user declined upload)

## Reference Files

### Agent behavior (load this FIRST)
- [./rules/agent-behavior.md](./rules/agent-behavior.md) — Act first, ask later, prefer defaults, fix silently

### Workflow rules
- [./rules/connected.md](./rules/connected.md) — Connected mode (codebase-driven)
- [./rules/explore.md](./rules/explore.md) — Explore mode (page-driven)
- [./rules/vorec-script.md](./rules/vorec-script.md) — Recording script template + action types
- [./rules/narration-styles.md](./rules/narration-styles.md) — All 8 narration styles with examples
- [./rules/pacing.md](./rules/pacing.md) — Timing rules per narration style
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
