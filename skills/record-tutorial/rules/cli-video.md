---
name: recording-quality
description: How Vorec records video — page.screencast for real-time + FFmpeg re-encode for quality
---

# Video Recording

Vorec records video using Playwright's `page.screencast` API which captures the browser in **real-time** — all pauses, typing, and animations appear at their actual speed. The WebM output is then re-encoded with FFmpeg for higher quality.

## How it works

```
page.screencast → real-time WebM (VP8) → FFmpeg re-encode → H.264 MP4
```

1. `page.screencast.start()` — records the browser window in real-time
2. All `waitForTimeout` pauses are captured (the video matches what a viewer would see)
3. `page.screencast.stop()` — saves WebM file
4. FFmpeg re-encodes WebM → MP4 with better quality settings
5. Delete the intermediate WebM

## Quality presets

| Preset | DPR | Output resolution | Best for |
|--------|-----|-------------------|----------|
| `'4k'` (default) | 2 | 3840×2160 | Product demos, marketing |
| `'2k'` | 1.5 | 2880×1620 | Tutorials, onboarding |
| `'1080p'` | 1 | 1920×1080 | Internal demos |

Viewport is always 1920×1080. DPR controls pixel sharpness.

## FFmpeg re-encode settings

```bash
ffmpeg -y -i raw.webm -c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -movflags +faststart output.mp4
```

| Setting | Value | Why |
|---------|-------|-----|
| Codec | `libx264` (H.264) | Universal playback |
| CRF | 18 | Visually lossless |
| Preset | `slow` | Better compression at same quality |
| Tune | `animation` | Optimized for UI content |

## Why real-time matters

The recording must match the video duration that Vorec narrates. If the script has 5-second pauses between actions (for the viewer to read), those 5 seconds must appear in the video. Vorec's AI writes narration timed to the tracked action timestamps — if the video is shorter than the timestamps, narration won't sync.

## Related files

- [./vorec-script.md](./vorec-script.md) — Recording script template
- [./pacing.md](./pacing.md) — Timing rules per narration style
