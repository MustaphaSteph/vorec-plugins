# Vorec — Claude Code Plugin for Screen Recording & AI Narration

> **Tell Claude what to record. The Vorec Recorder for macOS captures it. AI writes the narration.** From terminal to polished tutorial video in one command.

[![npm](https://img.shields.io/npm/v/@vorec/cli)](https://www.npmjs.com/package/@vorec/cli)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://vorec.ai)
[![Plugin Version](https://img.shields.io/badge/plugin-v14.44.0-success)](https://github.com/MustaphaSteph/vorec-plugins)
[![macOS Recorder](https://img.shields.io/badge/macOS-Recorder_App-blue)](https://vorec.ai/download)

## How it works

```
You: "record a tutorial showing how to sign up on vorec.ai"
  ↓
Claude writes a vorec.json manifest
  ↓
The Vorec Recorder for macOS captures the screen + clicks + cursor
  ↓
You review the MP4 locally
  ↓
Vorec uploads + generates AI narration + voice-over
  ↓
You polish in the Vorec editor (zoom, callouts, subtitles, music)
  ↓
Export HD video
```

No screen recording software to learn. No microphone. No video editor. Just one command in Claude Code.

## Quick Start

### 1. Install the Vorec Recorder for macOS

Download the desktop app from **[vorec.ai/download](https://vorec.ai/download)**.

After installing:
1. Open Vorec Recorder, sign in with your Vorec account
2. Grant **Screen Recording** and **Accessibility** permissions when prompted
3. Keep the app running (it lives in the menu bar)

> macOS only. The recorder uses native ScreenCaptureKit for high-fidelity capture and synthesizes a cursor overlay during export.

### 2. Install the Claude Code Plugin

```
1. In Claude Code, run /plugin
2. Go to Marketplaces → Add Marketplace
3. Enter: MustaphaSteph/vorec-plugins
4. Select record-tutorial and install it
5. Enable auto-update for the marketplace
```

### 3. Configure your API key

Get your API key from **[vorec.ai](https://vorec.ai)** → Settings → API Keys, then:

```bash
npx @vorec/cli@latest init
```

### 4. Record a Tutorial

Just tell Claude Code what to record:

```
"record a tutorial showing how to create a project"
"make a demo video of the settings page"
"create a screencast of the signup flow on vorec.ai"
"show how the onboarding experience works"
"demo the checkout flow for the team"
```

Claude writes a `vorec.json` manifest, the Vorec Recorder captures the screen, you review the MP4, and Vorec generates the narration. End-to-end in minutes.

## Why Vorec?

Building an app is hard enough. Making tutorial videos for it shouldn't be.

Vorec records your screen and generates professional narrated videos — right from your terminal. No screen recording software to learn, no microphone, no video editing skills needed.

- **Just say what to record** — "show how to sign up", "demo the billing page", "walk through the dashboard"
- **Native macOS capture** — high-fidelity ScreenCaptureKit recording with click + cursor tracking
- **AI narration** — professional voice-over generated automatically from the action timeline
- **Local-first review** — see the raw MP4 before anything uploads, approve only what's worth narrating
- **Full video editor** — synthetic cursor with ripples, zoom + chain pan, callouts, subtitles, background music, HD export

## Who It's For

### 🧑‍💻 Vibe Coders & Solo Developers
You're building fast with AI. Your app works, but you need tutorials for users and docs for your README. Vorec creates them in minutes — right inside Claude Code where you're already working. No context switching.

### 🚀 Founders Raising Funding
Investors want to see the product, not slides. Record a polished product demo in minutes — with AI voice-over that explains every feature clearly. Ship your pitch deck with a video that sells.

### 👤 Solo Entrepreneurs
You're doing everything yourself — building, marketing, support. You don't have time to record, narrate, and edit tutorial videos. Tell Vorec what to show, review the recording, get a finished video with narration.

### 🏢 Product Teams
Your product updates faster than your docs. Every feature release needs a walkthrough, every changelog needs a demo. Vorec turns "record the new dashboard" into a narrated video your support team can share.

### 📚 Developer Advocates & Educators
Create onboarding tutorials, API walkthroughs, and getting-started guides without recording yourself. Vorec generates natural narration that explains each step — in multiple languages.

### 🎯 SaaS Companies
Customer onboarding is where you lose users. Turn your onboarding flow into a professional tutorial video — with zoom effects highlighting important buttons, callouts explaining features, and subtitles for accessibility.

### 🛠️ Open Source Maintainers
Your project needs a "Getting Started" video but you hate being on camera. Vorec records the setup flow and narrates it for you. Embed it in your README and watch contributions grow.

### 💼 Agencies & Freelancers
Delivering a project? Include a narrated walkthrough video for your client. Takes 5 minutes. Looks like you spent hours. Clients love it.

### ✍️ Content Creators & Tech Bloggers
Write tutorials about tools you use. Vorec records the flow, generates narration, and turns it into a polished video you can embed in blog posts, YouTube, or social.

## What You Get

### The Recording
- **Native macOS capture** via ScreenCaptureKit (high-fidelity, no browser sandbox)
- **Every action tracked** — clicks, keystrokes, scrolls, cursor path, timing
- **Local MP4** — review before anything uploads, keep or discard
- **Cursor track sidecar** — feeds the synthetic-cursor renderer for perfect frame parity in editor + export

### The Vorec Editor
- **AI voice-over** — natural narration that explains each step
- **Synthetic cursor + click ripples** — animated cursor with shape-aware sprites (arrow, pointing, text, resize, etc.) and click ripples on every interaction
- **Zoom & spotlight** — auto-zoom from cursor dwell + clicks, chain-pan between zoom regions, manual zoom clips
- **Callouts & shapes** — arrows, circles, boxes, number badges
- **Backgrounds** — gradients, wallpapers, rounded corners, shadows
- **Intro slides** — title cards with professional themes
- **Background music** — built-in library + your own uploads, volume + fade controls
- **Subtitles** — auto-generated, customizable, per-language
- **Multi-language** — translate narration to any language
- **Timeline editor** — adjust timing, re-record segments, trim, ripple-edit
- **Export** — HD MP4 via the Cloud Run export worker

## Features

### One Command, Done
Describe what you want and get a video. No scripts to write, no buttons to click, no clips to manage.

### Local-First, Privacy-First
The Vorec Recorder writes the MP4 to your disk. You review it before anything uploads. Approve only the recordings you want narrated.

### Smart Action Tracking
Every click, keystroke, scroll, and cursor pause is timestamped and tracked. The narration AI gets a full action timeline — no guessing from frames.

### Multiple Narration Styles

| Style | Best for |
|-------|----------|
| Tutorial | How-to guides, onboarding, product docs |
| Professional | Enterprise demos, workplace training, SOPs |
| Conversational | Team walkthroughs, internal demos |
| Storytelling | Marketing videos, feature launches, Product Hunt |
| Persuasive | Sales demos, investor pitches, product showcases |
| Academic | Educational content, courses, learning platforms |
| Concise | Quick reference, power-user guides |
| Exact | Technical documentation, API docs |

### Multi-Language
Record once, narrate in any language. Translations are stored per-segment and overlaid by the export worker at render time.

## Use Cases

| What you need | What you say |
|---------------|-------------|
| Onboarding tutorial | "record how a new user signs up and creates their first project" |
| Product demo for investors | "demo the full product — dashboard, settings, billing" |
| Feature walkthrough | "show how the new export feature works" |
| Bug report video | "record the checkout flow — it breaks on the payment step" |
| Client deliverable | "create a walkthrough of the admin panel for the client" |
| Open source getting started | "record the setup flow from git clone to running app" |
| Changelog demo | "show the 3 new features we shipped this week" |
| Support documentation | "record how to reset a password and update billing" |
| Training video | "demo the CRM workflow from lead to close" |
| Marketing content | "record a 60-second product tour for the landing page" |

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Vorec Recorder** — [download from vorec.ai/download](https://vorec.ai/download), sign in, grant Screen Recording + Accessibility
- **Node.js 18+** for the CLI
- **cliclick** (for action injection during automated recording):
  ```bash
  brew install cliclick
  ```
- **Vorec API key** — get from [vorec.ai](https://vorec.ai) → Settings → API Keys

The plugin runs `npx @vorec/cli check` before recording to verify all four are in place.

## CLI Commands

```bash
npx @vorec/cli@latest init                    # Save API key to ~/.vorec/config.json
npx @vorec/cli@latest check                   # Verify app + sign-in + permissions + cliclick
npx @vorec/cli@latest run <vorec.json>        # Record locally — writes MP4 + sidecar, no upload
npx @vorec/cli@latest analyze <video.mp4>     # Upload + generate narration
npx @vorec/cli@latest projects list --json    # List accessible projects
npx @vorec/cli@latest status                  # Check processing status
npx @vorec/cli@latest editor inspect --project <id> --json
npx @vorec/cli@latest editor snapshot --project <id> --at 42.5 --output frame.png
npx @vorec/cli@latest editor filmstrip --project <id> --every 2 --output-dir frames
npx @vorec/cli@latest editor describe --project <id>
npx @vorec/cli@latest actions list --project <id> --json
npx @vorec/cli@latest actions move --project <id> --click-index 7 --at 46.4
npx @vorec/cli@latest actions update --project <id> --click-index 7 --x 386 --y 381
npx @vorec/cli@latest actions set-primary --project <id> --segment <segment-id> --click-index 7
npx @vorec/cli@latest actions verify --project <id> --click-index 7 --output action-7.png
npx @vorec/cli@latest narration move --project <id> --segment <segment-id> --at 46.4
npx @vorec/cli@latest narration update --project <id> --segment <segment-id> --text "Now save the settings."
npx @vorec/cli@latest narration attach-action --project <id> --segment <segment-id> --click-index 7 --primary
npx @vorec/cli@latest overlays list --project <id> --json
npx @vorec/cli@latest overlays add --project <id> --type zoom --at 12 --duration 3 --x 430 --y 360
npx @vorec/cli@latest overlays add --project <id> --type follow-zoom --at 18 --duration 4
npx @vorec/cli@latest overlays add --project <id> --type blur --at 22 --duration 2 --x 700 --y 180 --width 220 --height 90
npx @vorec/cli@latest overlays add-image logo.png --project <id> --at 0 --duration 4
npx @vorec/cli@latest overlays move --project <id> --clip <clip-id> --at 14.2 --x 480 --y 340
npx @vorec/cli@latest overlays resize --project <id> --clip <clip-id> --duration 4 --width 280 --height 160
npx @vorec/cli@latest overlays update --project <id> --clip <clip-id> --data '{"compositionState":{"keyframes":[{"property":"destination.x","clock":"story","keyframes":[{"id":"kf-1","offsetSeconds":0,"value":400},{"id":"kf-2","offsetSeconds":1.5,"value":600}]}]}}'
npx @vorec/cli@latest overlays delete --project <id> --clip <clip-id>
npx @vorec/cli@latest cursor hide --project <id>
npx @vorec/cli@latest cursor show --project <id>
npx @vorec/cli@latest background get --project <id> --json
npx @vorec/cli@latest background set --project <id> --type gradient --gradient-start "#0f172a" --gradient-end "#4f46e5" --angle 135 --padding 8 --shadow large
npx @vorec/cli@latest background set --project <id> --type wallpaper --wallpaper ocean
npx @vorec/cli@latest background disable --project <id>
npx @vorec/cli@latest segments --project <id> # Read narration segments (JSON)
npx @vorec/cli@latest media upload intro.mp4 --project <id> --wait
npx @vorec/cli@latest media list --project <id>
npx @vorec/cli@latest timeline list --project <id>
npx @vorec/cli@latest timeline split --project <id> --at 42.5
npx @vorec/cli@latest timeline add-video intro.mp4 --project <id> --position intro --muted
npx @vorec/cli@latest timeline add-video broll.mp4 --project <id> --after-segment <video-segment-id> --muted
npx @vorec/cli@latest export start --project <id> --wait --download-url
npx @vorec/cli@latest export status <export-id> --download-url
npx @vorec/cli@latest export cancel <export-id>
```

The `run` and `analyze` split lets you review the raw MP4 before paying credits to analyze it. The agent always shows you the recording first.

Editor media/timeline/action/overlay/export commands are optional post-analysis controls. Use them only when the user asks to inspect, edit, or export an existing Vorec project. Use `editor snapshot` / `editor filmstrip` for visual readback. Use `editor describe` only when Vorec AI should analyze the source video; it spends analysis credits. For exact mid-segment insertion, split first, then add the media at the split timestamp.

Narration segments reference actions by index. In `editor inspect --json`, `narrationSegments[].primaryClickIndex` and `clickRefs[]` match `clicks[].clickIndex`. The `clicks[]` entries are the source of truth for action `timestampSeconds`, `x`, `y`, and `interactionType`; segment coordinates are not the source of truth. Use `narration move/update/attach-action` for voice segment edits, and `actions verify` to render the frame at an action timestamp.

Overlay clips are normal editor timeline clips. Agents can add/update/delete zoom, follow-zoom, blur, spotlight, callout, text, shape, image, slide, and cursor clips, upload local image overlays with `overlays add-image`, then move/resize them with normalized `0..1000` video coordinates. Cursor visibility is controlled separately with `cursor show|hide`. Video background is a project setting controlled with `background get/set/disable`; inspect it structurally before changing it. Cursor visibility and background changes now create undoable timeline revisions.

Advanced `overlays add/update --data` payloads can author canonical keyframes and animation applications. Vorec validates animation payloads before writing them. If the CLI reports `(field=...)`, fix that exact field; do not remove animation data or retry the same malformed payload. Inspect the overlay again after the mutation so unrelated clip data and authored animation remain intact.

Every `export start` is pinned to one immutable canonical composition revision. The CLI prints the pinned revision and content hash (and returns `compositionRevision` / `compositionContentHash` with `--json`), so later edits cannot change an in-flight render. Only the project owner can start an export. If no canonical revision is available, inspect and save the project instead of falling back to stale state.

Video track segments are visible through `timeline list --json` and `editor inspect --json`. Agents should use `videoSegments[].id` as insertion anchors when possible: after splitting a source segment, insert with `timeline add-video --after-segment <firstSegment.id>` or `--before-segment <secondSegment.id>` instead of retyping the split timestamp.

## Compatibility

This plugin records on **macOS only** via the Vorec Recorder desktop app. The recorder uses Apple's ScreenCaptureKit framework, which has no equivalent on Windows or Linux.

The narration and editing side (vorec.ai web app) works in any modern browser.

## Maintainer Checks

```bash
node scripts/validate-plugin.mjs
```

This verifies plugin JSON, tracked-action sample data, internal markdown links, stale setup claims, script syntax, root licensing, and accidental `.DS_Store` tracking.

See [docs/release-checklist.md](docs/release-checklist.md) for the full release checklist and [examples/common-flows.md](examples/common-flows.md) for common recording patterns.

## Links

- **[vorec.ai](https://vorec.ai)** — AI-narrated tutorial videos
- **[vorec.ai/download](https://vorec.ai/download)** — Vorec Recorder for macOS
- **[@vorec/cli on npm](https://www.npmjs.com/package/@vorec/cli)** — CLI tool
- **[Plugin Marketplace](https://github.com/MustaphaSteph/vorec-plugins)** — This repo

## Related

- [Claude Code](https://github.com/anthropics/claude-code) — AI coding agent by Anthropic
- [Best Claude Code Skills & Plugins (2026)](https://dev.to/raxxostudios/best-claude-code-skills-plugins-2026-guide-4ak4)

---

**Keywords:** claude code plugin, claude code skill, screen recording, AI narration, tutorial video generator, product demo recorder, investor demo, screencast tool, automated documentation, voice-over generator, video tutorial maker, SaaS demo, developer onboarding, vibe coding, solo developer tools, startup demo video, Claude Code screen recorder, AI tutorial maker, product walkthrough, open source documentation, customer onboarding video, changelog demo, training video maker, macOS screen recorder, ScreenCaptureKit recorder, Vorec Recorder, content creator tools
