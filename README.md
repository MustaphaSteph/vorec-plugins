# Vorec Plugins for Claude Code

**Turn any codebase into narrated tutorial videos — directly from your AI coding agent.**

Your AI agent already knows every button, route, and UI flow in your app. Vorec lets it record the screen, track actions, and generate professional narrated tutorials automatically.

## Available Plugins

### record-tutorial

Record narrated tutorial videos, product demos, and onboarding walkthroughs from any codebase using Playwright screen recording and AI-generated voice-over.

**What it does:**
- AI agent reads your codebase to find real UI selectors
- Records the screen with Playwright in 1080p
- Tracks every click, keystroke, and navigation with precise coordinates
- Uploads to Vorec for automatic AI narration and voice-over
- Returns an editor URL to preview, adjust, and export

**Perfect for:**
- Product demos and feature walkthroughs
- Developer onboarding tutorials
- Customer-facing how-to guides
- Internal team documentation
- SaaS product tours
- QA workflow documentation
- Changelog and release demo videos

## Installation

1. In Claude Code, run `/plugin`
2. Go to **Marketplaces** → **Add Marketplace**
3. Enter: `MustaphaSteph/vorec-plugins`
4. Select **record-tutorial** and install it
5. Go back to **Marketplaces** → select **vorec-plugins** → **Enable auto-update**

Auto-update keeps the plugin current — you'll always have the latest version.

## Prerequisites

Before using the skill, install these on your machine:

```bash
# Playwright — screen recording engine
npm install playwright && npx playwright install chromium

# FFmpeg — video conversion (webm to mp4)
brew install ffmpeg          # macOS
# apt install ffmpeg         # Ubuntu/Debian
# choco install ffmpeg       # Windows

# Vorec CLI — uploads recordings to Vorec
npx @vorec/cli@latest init
# Enter your API key from vorec.ai → Settings → API Keys
```

## Usage

Just tell Claude Code what you want to record:

```
"record a tutorial showing how to create a project"
"make a demo video of the settings page"
"create a screencast of the signup flow"
"show how the billing page works"
"record a walkthrough of the onboarding experience"
```

The agent will:
1. Ask you about language and narration style preferences
2. Research your codebase for accurate selectors
3. Handle authentication (opens browser for you to log in)
4. Record the screen in 1080p with Playwright
5. Upload to Vorec for AI narration
6. Return an editor URL to preview and export

## Narration Styles

| Style | Best for |
|-------|----------|
| Tutorial | How-to guides, onboarding, product docs |
| Professional | Enterprise demos, investor presentations |
| Conversational | Team walkthroughs, internal demos |
| Storytelling | Marketing videos, feature launches |
| Concise | Quick reference, power-user guides |
| Exact | Technical documentation, API walkthroughs |

## How It Works

```
You say: "record a tutorial"
     ↓
Agent reads your codebase → finds real selectors
     ↓
Asks: language? narration style? anything to focus on?
     ↓
Records screen with Playwright (1080p, mp4)
     ↓
You validate the recording
     ↓
Uploads to Vorec → AI generates narration + voice-over
     ↓
Editor URL → preview, adjust, export
```

## Supported Frameworks

Works with any web app — React, Next.js, Vue, Svelte, Angular, plain HTML. If it runs in a browser, Vorec can record it.

## Links

- [Vorec](https://vorec.ai) — Turn screen recordings into narrated tutorials
- [@vorec/cli on npm](https://www.npmjs.com/package/@vorec/cli) — CLI tool for recording and uploading
- [Documentation](https://vorec.ai/docs) — Full API and CLI documentation

## Keywords

claude code plugin, screen recording, tutorial video, AI narration, voice-over, product demo, screencast, walkthrough, onboarding video, automated documentation, playwright recording, video tutorial generator, AI voice over, screen capture narration, product tour, demo video creator, SaaS tutorial, developer documentation, how-to video, training video
