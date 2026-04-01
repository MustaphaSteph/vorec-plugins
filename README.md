# Vorec — Claude Code Plugin for Screen Recording & AI Narration

> **Turn any codebase into a narrated tutorial video with one command.** Claude Code reads your app's source code, records the screen with Playwright, and Vorec generates professional AI voice-over automatically.

[![npm](https://img.shields.io/npm/v/@vorec/cli)](https://www.npmjs.com/package/@vorec/cli)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://vorec.ai)

## Why Vorec?

Other tools record blindly — they don't understand your app. **Vorec understands your codebase.** It knows your UI flows, forms, and navigation. That means:

- **Accurate recordings** — Vorec interacts with your app the way a real user would
- **Valid data** — forms are filled with data that actually works
- **Smart timing** — waits for loading states and animations naturally
- **Error recovery** — if something goes wrong, the recording shows the fix

## Quick Start

### Install the Plugin

```
1. In Claude Code, run /plugin
2. Go to Marketplaces → Add Marketplace
3. Enter: MustaphaSteph/vorec-plugins
4. Select record-tutorial and install it
5. Enable auto-update for the marketplace
```

### Record a Tutorial

Just tell Claude Code what to record:

```
"record a tutorial showing how to create a project"
"make a demo video of the settings page"
"create a screencast of the signup flow"
```

Claude Code will analyze your codebase, record the screen, and offer to upload to Vorec for AI narration.

## What You Get

### From the Recording
- **1080p screen recording** with smooth Playwright automation
- **Action tracking** — every click, keystroke, and navigation with precise coordinates
- **MP4 video** ready to use anywhere

### From Vorec (optional upload)
- **AI voice-over** — natural narration written from analyzing the video
- **Zoom & focus effects** — highlight elements, spotlight areas, blur backgrounds
- **Cursor animations** — click ripples, tap rings, arrow pointers
- **Text & shape overlays** — arrows, circles, callout boxes, number badges
- **Background styling** — gradients, wallpapers, rounded corners, shadows
- **Intro slides** — title cards with professional themes
- **Background music** — volume control, fade in/out
- **Subtitles** — auto-generated, customizable style
- **Multi-language** — translate narration to any language
- **Timeline editor** — adjust timing, re-record segments, trim
- **Export** — up to 4K resolution, 60fps

## How It Works

```
You: "record a tutorial showing how to sign up"
  ↓
Vorec analyzes your codebase
  ↓
Vorec records your app in 1080p
  ↓
You review the video
  ↓
Vorec generates AI narration + voice-over
  ↓
You add zoom, callouts, subtitles → export
```

## Features

### Codebase-Aware Recording
Vorec understands your app — it knows your routes, forms, and UI flows. Recordings use real data and accurate interactions, not blind clicking.

### Smart Error Recovery
If something goes wrong during recording, Vorec keeps going — showing the error and the fix. Tutorials become more useful because viewers learn to handle real mistakes.

### Authentication Support
For apps behind login walls, Vorec handles the session automatically. You log in once, and recordings reuse your session.

### Multiple Narration Styles

| Style | Best for |
|-------|----------|
| Tutorial | How-to guides, onboarding, product docs |
| Professional | Enterprise demos, investor presentations |
| Conversational | Team walkthroughs, internal demos |
| Storytelling | Marketing videos, feature launches |
| Concise | Quick reference, power-user guides |
| Exact | Technical documentation |

### Framework Support
Works with any web app: **React**, **Next.js**, **Vue**, **Nuxt**, **Svelte**, **SvelteKit**, **Angular**, **Remix**, **Astro**, **plain HTML**. If it runs in a browser, Vorec can record it.

## Prerequisites

```bash
# Playwright + Chromium (screen recording)
npm install playwright && npx playwright install chromium

# FFmpeg (video conversion)
brew install ffmpeg          # macOS
# apt install ffmpeg         # Ubuntu/Debian

# Vorec CLI (upload to Vorec)
npx @vorec/cli@latest login
```

## CLI Commands

```bash
vorec login          # Connect to your Vorec account
vorec check          # Verify credits and project limits
vorec run <manifest> # Record, upload, and generate narration
vorec status         # Check project processing status
```

## Links

- **[vorec.ai](https://vorec.ai)** — AI-narrated tutorial videos
- **[@vorec/cli on npm](https://www.npmjs.com/package/@vorec/cli)** — CLI tool
- **[Plugin Marketplace](https://github.com/MustaphaSteph/vorec-plugins)** — This repo

## Related

- [Claude Code Plugins](https://github.com/anthropics/claude-code) — Official Claude Code by Anthropic
- [Playwright](https://playwright.dev) — Browser automation by Microsoft
- [Best Claude Code Skills & Plugins (2026)](https://dev.to/raxxostudios/best-claude-code-skills-plugins-2026-guide-4ak4)

---

**Keywords:** claude code plugin, claude code skill, screen recording plugin, AI narration, tutorial video generator, product demo recorder, screencast tool, Playwright screen recording, automated documentation, voice-over generator, video tutorial maker, SaaS demo creator, developer onboarding, how-to video generator, Claude Code screen recorder, Claude Code video, coding agent video, AI tutorial maker, Claude Code Playwright, codebase video recorder
