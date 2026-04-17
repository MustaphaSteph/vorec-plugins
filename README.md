# Vorec — Claude Code Plugin for Screen Recording & AI Narration

> **Turn any web app into a narrated tutorial video with one command.** Your own project or any site on the web — Vorec handles the recording, narration, and editing.

[![npm](https://img.shields.io/npm/v/@vorec/cli)](https://www.npmjs.com/package/@vorec/cli)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://vorec.ai)
[![Plugin Version](https://img.shields.io/badge/plugin-v13.4.0-success)](https://github.com/MustaphaSteph/vorec-plugins)

## ✨ What's new in v13.4.0

- **4K recording quality** — Playwright `recordVideo` at 1080p with DPR 2, then FFmpeg lanczos upscaling for 2K/4K output
- **Smart action tracking** — every click, type, and scroll is tracked with real coordinates, context, and timestamps. Vorec skips video analysis entirely
- **8 narration styles** — Tutorial, Professional, Conversational, Storytelling, Persuasive, Academic, Concise, Exact
- **Primary actions** — mark key steps that get gold stars on the Vorec timeline
- **Scroll to element** — auto-scrolls just enough to bring the target into view, never past it
- **API key first** — agent verifies your Vorec API key before doing anything else

## Why Vorec?

Building an app is hard enough. Making tutorial videos for it shouldn't be.

Vorec records any web app and generates professional narrated videos — right from your terminal. No screen recording software, no microphone, no video editing skills needed.

- **Just say what to record** — "show how to sign up", "demo the billing page", "record how to buy X on some-site.com"
- **Works on your code or any live site** — the plugin picks the right approach automatically
- **Smart automation** — forms filled correctly, buttons clicked at the right time, natural timing
- **AI narration** — professional voice-over generated automatically
- **Full video editor** — zoom, callouts, subtitles, background music, 4K export

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
Write tutorials about ANY tool — your own or someone else's. Vorec records the flow, generates narration, and turns it into a polished video you can embed in blog posts, YouTube, or social.

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
"create a screencast of the signup flow on vorec.ai"
"record how to buy a product on stripe checkout"
"show how the onboarding experience works"
"demo the checkout flow for the team"
```

The plugin automatically picks the right approach:
- **Your own project?** — reads your components for exact selectors and validation rules
- **A live site on the web?** — discovers the page at runtime using semantic locators

Either way, you get the same polished result.

## How It Works

```
You: "record a tutorial showing how to sign up on vorec.ai"
  ↓
Vorec opens the site, walks through the flow naturally
  ↓
You review the video
  ↓
Vorec generates AI narration + voice-over
  ↓
You add zoom, callouts, subtitles → export
```

No screen recording software. No microphone. No video editor. Just one command.

## Compatibility

This repository is packaged as a Claude Code plugin marketplace entry. The `record-tutorial` skill itself is written as agent-readable instructions, so the workflow can be adapted by other coding agents that support local skills, Playwright automation, FFmpeg, and the Vorec CLI.

## What You Get

### The Recording
- **1080p by default, 2K/4K optional** — sharp browser recording with DPR 2 rendering and FFmpeg MP4 output
- **Every action tracked** — clicks, keystrokes, navigation, timing
- **MP4 file** — ready to use anywhere, even without Vorec
- **Optional visible cursor** — big animated arrow/hand/text cursor with click feedback, baked into the recording

### The Vorec Editor
- **AI voice-over** — natural narration that explains each step
- **Zoom & spotlight** — highlight important elements, blur backgrounds
- **Cursor effects** — click ripples, tap rings, pointer arrows
- **Callouts & shapes** — arrows, circles, boxes, number badges
- **Backgrounds** — gradients, wallpapers, rounded corners, shadows
- **Intro slides** — title cards with professional themes
- **Background music** — with volume and fade controls
- **Subtitles** — auto-generated, customizable
- **Multi-language** — translate narration to any language
- **Timeline editor** — adjust timing, re-record segments, trim
- **Export** — up to 4K, 60fps

## Features

### One Command, Done
No scripts to write, no buttons to click, no recordings to manage. Describe what you want and get a video.

### Works Anywhere
Record your own project AND any live website. Same command, same quality, same Vorec editor.

### Smart Automation
Forms are filled with valid data, navigation follows real user paths, and interactions look natural. Not a clumsy bot — a smooth demo.

### Error Recovery
If something goes wrong during recording, Vorec shows the error and the fix. Viewers learn from real mistakes — making tutorials more valuable.

### Works with Login-Protected Apps
Log in once, Vorec reuses your session. No passwords stored.

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
Record once, narrate in any language. Perfect for global products.

### Works with Any Web App
**React**, **Next.js**, **Vue**, **Nuxt**, **Svelte**, **SvelteKit**, **Angular**, **Remix**, **Astro**, **plain HTML** — if it runs in a browser, Vorec can record it.

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
| Tool comparison video | "record signup on competitor.com to compare UX" |
| Blog post screencast | "record how to use tool-X from landing to first result" |

## Prerequisites

```bash
# Playwright CLI (drives the recording)
npm install -g @playwright/cli@latest
npx playwright install chromium

# FFmpeg (video conversion)
brew install ffmpeg          # macOS
# apt install ffmpeg         # Ubuntu/Debian

# Vorec CLI
npx @vorec/cli@latest --version
```

When recording, the skill checks `~/.vorec/config.json`. If no API key is configured, Claude asks for a Vorec API key and writes the config directly so the non-interactive agent workflow can continue safely.

## CLI Commands

```bash
npx @vorec/cli@latest check          # Verify API key, credits, and project limits
npx @vorec/cli@latest run <manifest> # Upload/record and generate narration
npx @vorec/cli@latest status         # Check processing status
```

## Maintainer Checks

```bash
node scripts/validate-plugin.mjs
```

This verifies plugin JSON, tracked-action sample data, internal markdown links, stale setup claims, script syntax, root licensing, and accidental `.DS_Store` tracking.

See [docs/release-checklist.md](docs/release-checklist.md) for the full release checklist and [examples/common-flows.md](examples/common-flows.md) for common recording patterns.

For unknown live websites, the skill builds a structured `.vorec/<slug>/live-site-map.json` before recording. See [examples/live-site-map.sample.json](examples/live-site-map.sample.json) for the expected discovery output.

## Links

- **[vorec.ai](https://vorec.ai)** — AI-narrated tutorial videos
- **[@vorec/cli on npm](https://www.npmjs.com/package/@vorec/cli)** — CLI tool
- **[Plugin Marketplace](https://github.com/MustaphaSteph/vorec-plugins)** — This repo

## Related

- [Claude Code](https://github.com/anthropics/claude-code) — AI coding agent by Anthropic
- [Best Claude Code Skills & Plugins (2026)](https://dev.to/raxxostudios/best-claude-code-skills-plugins-2026-guide-4ak4)

---

**Keywords:** claude code plugin, claude code skill, screen recording, AI narration, tutorial video generator, product demo recorder, investor demo, screencast tool, automated documentation, voice-over generator, video tutorial maker, SaaS demo, developer onboarding, vibe coding, solo developer tools, startup demo video, Claude Code screen recorder, AI tutorial maker, product walkthrough, open source documentation, customer onboarding video, changelog demo, training video maker, website recorder, live website tutorial, competitor demo recorder, content creator tools
