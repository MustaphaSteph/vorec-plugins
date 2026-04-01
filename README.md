# Vorec — Claude Code Plugin for Screen Recording & AI Narration

> **Turn your app into a narrated tutorial video with one command.** Just describe the flow you want to record — Vorec handles the rest.

[![npm](https://img.shields.io/npm/v/@vorec/cli)](https://www.npmjs.com/package/@vorec/cli)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-blueviolet)](https://vorec.ai)

## Why Vorec?

Building an app is hard enough. Making tutorial videos for it shouldn't be.

Vorec records your app and generates professional narrated videos — right from your terminal. No screen recording software, no microphone, no video editing skills needed.

- **Just say what to record** — "show how to sign up", "demo the billing page"
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
"record a product demo for investors"
"show how the onboarding experience works"
"demo the checkout flow for the team"
```

## How It Works

```
You: "record a tutorial showing how to sign up"
  ↓
Vorec records your app in 1080p
  ↓
You review the video
  ↓
Vorec generates AI narration + voice-over
  ↓
You add zoom, callouts, subtitles → export
```

No screen recording software. No microphone. No video editor. Just one command.

## What You Get

### The Recording
- **1080p screen recording** — smooth, professional-looking
- **Every action tracked** — clicks, keystrokes, navigation
- **MP4 video** — ready to use anywhere, even without Vorec

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
| Professional | Enterprise demos, investor pitches |
| Conversational | Team walkthroughs, internal demos |
| Storytelling | Marketing videos, feature launches, Product Hunt |
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

## Prerequisites

```bash
# Playwright + Chromium (screen recording)
npm install playwright && npx playwright install chromium

# FFmpeg (video conversion)
brew install ffmpeg          # macOS
# apt install ffmpeg         # Ubuntu/Debian

# Vorec CLI
npx @vorec/cli@latest login
```

## CLI Commands

```bash
vorec login          # Connect your Vorec account
vorec check          # Verify credits and project limits
vorec run <manifest> # Record, upload, and generate narration
vorec status         # Check processing status
```

## Links

- **[vorec.ai](https://vorec.ai)** — AI-narrated tutorial videos
- **[@vorec/cli on npm](https://www.npmjs.com/package/@vorec/cli)** — CLI tool
- **[Plugin Marketplace](https://github.com/MustaphaSteph/vorec-plugins)** — This repo

## Related

- [Claude Code](https://github.com/anthropics/claude-code) — AI coding agent by Anthropic
- [Best Claude Code Skills & Plugins (2026)](https://dev.to/raxxostudios/best-claude-code-skills-plugins-2026-guide-4ak4)

---

**Keywords:** claude code plugin, claude code skill, screen recording, AI narration, tutorial video generator, product demo recorder, investor demo, screencast tool, automated documentation, voice-over generator, video tutorial maker, SaaS demo, developer onboarding, vibe coding, solo developer tools, startup demo video, Claude Code screen recorder, AI tutorial maker, product walkthrough, open source documentation, customer onboarding video, changelog demo, training video maker
