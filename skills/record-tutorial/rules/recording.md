---
name: recording-workflow
description: How to record a tutorial using playwright-cli with coordinate tracking
---

# Recording Workflow

## Overview

Use `playwright-cli` commands sequentially for the recording. After each action, get element coordinates via `run-code` and build the tracked actions JSON.

## Step-by-Step Recording

### 1. Open browser with video

```bash
npx playwright-cli open <APP_URL> --headed
npx playwright-cli resize 1920 1080
npx playwright-cli video-start
```

If auth is needed:
```bash
npx playwright-cli state-load .vorec/auth.json
npx playwright-cli goto <APP_URL>
```

### 2. For each action

Take a snapshot to see elements:
```bash
npx playwright-cli snapshot
```

Interact using element refs:
```bash
npx playwright-cli click e5
```

Get coordinates for Vorec tracking:
```bash
npx playwright-cli run-code "async page => {
  const el = page.locator('<ELEMENT_SELECTOR_OR_REF>');
  const box = await el.boundingBox();
  const vp = page.viewportSize();
  return box ? {
    x: Math.round(((box.x + box.width / 2) / vp.width) * 1000),
    y: Math.round(((box.y + box.height / 2) / vp.height) * 1000)
  } : { x: 500, y: 500 };
}"
```

Verify the action worked:
```bash
npx playwright-cli snapshot
```

If an error appeared on screen, record it as a narrate action — load [./validation.md](./validation.md) for the error recovery pattern.

### 3. Stop video

```bash
npx playwright-cli video-stop .vorec/recordings/recording.webm
npx playwright-cli close
```

### 4. Convert to MP4

```bash
ffmpeg -y -i .vorec/recordings/recording.webm -c:v libx264 -preset fast -crf 23 -c:a aac .vorec/recordings/recording.mp4
```

### 5. Extract thumbnail

```bash
ffmpeg -y -i .vorec/recordings/recording.mp4 -ss 00:00:02 -frames:v 1 -q:v 2 .vorec/recordings/thumb.jpg
```

### 6. Build tracked actions JSON

Save to `.vorec/tracked-actions.json`:

```json
[
  {
    "type": "narrate",
    "timestamp": 2.0,
    "coordinates": { "x": 500, "y": 500 },
    "target": "",
    "interaction_type": "narrate",
    "description": "Page overview",
    "context": "The dashboard shows projects organized by status..."
  },
  {
    "type": "click",
    "timestamp": 5.2,
    "coordinates": { "x": 450, "y": 320 },
    "target": "e5",
    "interaction_type": "click",
    "description": "Click New Project button",
    "context": "Clicks the blue New Project button in the top-right. A creation dialog appears."
  },
  {
    "type": "type",
    "timestamp": 7.8,
    "coordinates": { "x": 500, "y": 400 },
    "target": "e8",
    "interaction_type": "type",
    "description": "Enter project name",
    "context": "Types 'My First Project' into the title field.",
    "typed_text": "My First Project"
  }
]
```

Track timestamps from elapsed time since video started. Get coordinates from `run-code` boundingBox calls.

## Alternative: Script-Based Recording

If `playwright-cli` is not available or you need more control, write a standalone Playwright script. Load [./playwright.md](./playwright.md) for best practices on locators, waiting, and error handling.

## After Recording

1. Ask user to validate the video
2. Upload via `npx @vorec/cli@latest run vorec.json --skip-record --video <mp4> --tracked-actions .vorec/tracked-actions.json`
3. Clean up temp files
4. Share editor URL
