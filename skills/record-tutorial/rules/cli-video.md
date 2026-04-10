---
name: playwright-cli-video
description: Video recording API — page.screencast, video-start, video-stop, chapters, overlays
---

# playwright-cli — Video Recording

Playwright has a built-in `page.screencast` API that records the browser window to WebM. It runs entirely inside the browser process — no external recording tool needed. This is what powers Vorec's recording pipeline.

> Adapted from Microsoft's [playwright-cli video-recording reference](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/references/video-recording.md) (Apache 2.0).

## Two ways to record

### Way 1 — CLI commands (simple)

```bash
playwright-cli open https://example.com
playwright-cli video-start ./recordings/demo.webm --size 1920x1080
playwright-cli click e42
playwright-cli type "hello"
playwright-cli video-stop
```

Output: `./recordings/demo.webm`

### Way 2 — Hero script (recommended for Vorec)

```bash
playwright-cli open https://example.com
playwright-cli run-code --filename=./hero-script.js
```

Where `hero-script.js` uses the `page.screencast` API directly — much more control, cleaner timing, supports overlays and chapters.

## The `page.screencast` API

### Start/stop
```js
await page.screencast.start({
  path: './recordings/demo.webm',
  size: { width: 1920, height: 1080 },
  fps: 60,  // silently capped at ~25 by the browser, but doesn't hurt to ask
});

// ... record actions ...

await page.screencast.stop();
```

**Critical:** the `size` MUST match the viewport size set via `page.setViewportSize()`. Mismatched sizes cause the content-in-top-left-quadrant bug.

### Chapter cards (post-production feature — usually skip)

```js
await page.screencast.showChapter('Step 1: Sign up', {
  description: 'Enter your email and password to create an account',
  duration: 2000,  // auto-hides after 2s
});
```

Shows a full-screen card with blurred backdrop + title + description, overlaid on the recording.

**For Vorec recordings:** typically skip this. Vorec adds branded intro slides and section markers in post-production. Only use chapters if the user explicitly asks.

### Custom overlays (post-production feature — usually skip)

```js
const hl = await page.screencast.showOverlay(`
  <div style="position: absolute;
    top: 100px; left: 200px; width: 140px; height: 40px;
    border: 4px solid #ff6b35; border-radius: 8px;
    box-shadow: 0 0 30px rgba(255,107,53,0.7);"></div>
`);

// ... user sees the overlay on the recording ...

await hl.dispose();  // remove the overlay
```

Lets you inject arbitrary HTML on top of the recording. Useful for highlighting elements or showing captions.

**For Vorec recordings:** typically skip this. Vorec adds spotlights, callouts, and labels in post-production.

## CLI commands for video recording

```bash
# Start recording
playwright-cli video-start                    # default path + default size
playwright-cli video-start ./recordings/demo.webm
playwright-cli video-start ./recordings/demo.webm --size 1920x1080

# Add a chapter marker
playwright-cli video-chapter "Chapter Title" \
  --description="Details" --duration=2000

# Stop recording
playwright-cli video-stop
```

## What WebM do you get?

- Codec: VP8 (WebM's default)
- Framerate: ~25 fps (Playwright caps higher requests)
- Audio: none (silent recording)
- Duration: from start to stop

## Convert to MP4

WebM isn't universally playable (QuickTime doesn't support it). Always convert to H.264 MP4 for final delivery:

```bash
ffmpeg -y -i ./recordings/demo.webm \
  -c:v libx264 -preset slower -crf 15 -tune animation \
  -pix_fmt yuv420p -movflags +faststart \
  ./recordings/demo.mp4
```

Settings:
- `-crf 15` — visually lossless
- `-preset slower` — better compression
- `-tune animation` — optimized for UI content
- `-pix_fmt yuv420p` — universal compatibility (QuickTime, iOS, Android)
- `-movflags +faststart` — plays while downloading

Typical file sizes for 30s recordings:
- WebM: 2-4 MB
- MP4 (crf 15): 4-8 MB
- MP4 (crf 23): 1-2 MB (lower quality, not recommended for tutorials)

## Render flush before stop (avoids glitched last frame)

Before calling `page.screencast.stop()`, force a render flush with `requestAnimationFrame`:

```js
await page.evaluate(() => new Promise(r =>
  requestAnimationFrame(() => requestAnimationFrame(r))
));
await page.waitForTimeout(500);
await page.screencast.stop();
```

Without this, the last frame of the recording is often corrupted or shows half-painted content.

## Tracing vs video

Playwright also has `tracing` — a different tool for debugging. Don't confuse them:

| Feature | `page.screencast` | Tracing |
|---|---|---|
| Output | WebM video file | Trace file (JSON + screenshots, viewable in Trace Viewer) |
| Purpose | Recordings for users | Debugging for developers |
| Size | Larger (~2-10MB) | Smaller |
| Use for Vorec | ✅ Yes | ❌ No |

## Related files

- [./cli-commands.md](./cli-commands.md) — Core commands (open, click, snapshot)
- [./cli-running-code.md](./cli-running-code.md) — `run-code` for hero scripts
- [./hero-script.md](./hero-script.md) — Canonical hero script with screencast.start/stop
