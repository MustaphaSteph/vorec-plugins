# record-tutorial

Record narrated tutorial videos from any codebase using the Vorec CLI and Playwright. Your AI coding agent records the screen, tracks actions with coordinates, and Vorec generates narration and voice-over automatically.

## Install

```
/plugin
```

Then select `record-tutorial` from the Vorec marketplace.

## Usage

Just tell Claude Code what you want to record:

- "record a tutorial showing how to create a project"
- "make a demo video of the settings page"
- "create a screencast of the signup flow"

The agent will research your codebase for selectors, ask your preferences, record with Playwright, and upload to Vorec.

## Prerequisites

- [Playwright](https://playwright.dev/) — `npm install playwright && npx playwright install chromium`
- [FFmpeg](https://ffmpeg.org/) — `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)
- Vorec API key — create one at [vorec.ai](https://vorec.ai) → Settings → API Keys
