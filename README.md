# Vorec — Claude Code Plugin for Screen Recording & AI Narration

> **Turn your app into a narrated tutorial video with one command.** Just describe the flow you want to record — Vorec handles the rest.

[![npm](https://img.shields.io/npm/v/@vorec/cli)](https://www.npmjs.com/package/@vorec/cli)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://vorec.ai)

## Why Vorec?

Vorec records your app like a real user would — filling forms with valid data, waiting for loading states, and handling errors gracefully. No manual scripting, no guesswork.

- **Just describe what to record** — "show how to sign up", "demo the billing page"
- **Smart automation** — forms are filled correctly, buttons clicked at the right time
- **Natural timing** — waits for animations and loading states automatically
- **Error recovery** — if something goes wrong, it shows the fix in the recording

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

### Intelligent Recording
Vorec records your app accurately — forms are filled with valid data, navigation follows real user paths, and interactions look natural.

### Smart Error Recovery
If something goes wrong during recording, Vorec keeps going — showing the error and the fix. Tutorials become more useful because viewers learn to handle real mistakes.

### Works with Login-Protected Apps
You log in once, and Vorec reuses your session for all recordings. No passwords stored or shared.

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
