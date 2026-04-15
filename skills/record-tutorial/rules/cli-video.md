---
name: recording-quality
description: How Vorec records video — recordVideo for real-time + FFmpeg lanczos upscale for quality
---

# Video Recording

Vorec records video using Playwright's `recordVideo` API which captures the browser in **real-time** — all pauses, typing, and animations appear at their actual speed. The WebM output is then upscaled and re-encoded with FFmpeg.

**Note:** `page.screencast` is a playwright-cli extension (only works inside `playwright-cli run-code`). The standalone vorec script uses `recordVideo` instead (standard Playwright API).

## How it works

```
recordVideo → real-time WebM (VP8) → FFmpeg lanczos upscale → H.264 MP4
```

1. `browser.newContext({ recordVideo: { dir, size } })` — records in real-time
2. All `waitForTimeout` pauses are captured (video matches what a viewer would see)
3. `context.close()` — saves and finalizes the WebM file
4. FFmpeg upscales with lanczos + re-encodes to H.264 MP4
5. Delete the intermediate WebM

## Quality presets

| Preset | DPR | Output resolution | Best for |
|--------|-----|-------------------|----------|
| `'4k'` (default) | 2 | 3840×2160 | Product demos, marketing |
| `'2k'` | 1.5 | 2880×1620 | Tutorials, onboarding |
| `'1080p'` | 1 | 1920×1080 | Internal demos |

Viewport is always 1920×1080. DPR controls pixel sharpness.

## FFmpeg upscale + re-encode

```bash
# 4K output (default):
ffmpeg -y -i raw.webm -vf "scale=3840:2160:flags=lanczos" -c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -movflags +faststart output.mp4

# 2K output:
ffmpeg -y -i raw.webm -vf "scale=2560:1440:flags=lanczos" -c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -movflags +faststart output.mp4

# 1080p output (no upscale, just re-encode):
ffmpeg -y -i raw.webm -c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -movflags +faststart output.mp4
```

| Setting | Value | Why |
|---------|-------|-----|
| Upscale | `lanczos` | Preserves sharp edges (text, buttons, icons) |
| Codec | `libx264` (H.264) | Universal playback |
| CRF | 18 | Visually lossless |
| Preset | `slow` | Better compression at same quality |
| Tune | `animation` | Optimized for UI content |
| Watermark | `drawtext` filter | "vorec.ai" bottom-right on preview file |

## Watermark

The preview MP4 saved locally (for the user to review before upload) has a "vorec.ai" watermark in the bottom-right corner. This is added during the FFmpeg upscale step via the `drawtext` filter:

```
drawtext=text='vorec.ai':fontcolor=white@0.7:fontsize=h/32:x=w-tw-30:y=h-th-30:box=1:boxcolor=black@0.35:boxborderw=10
```

- Semi-transparent white text with a dark rounded background
- Font size scales with video height (`h/32`)
- Anchored 30px from bottom-right corner

**The watermark is ONLY on the preview.** Vorec's rendering pipeline produces the final video with Vorec's own branding, so the agent's watermark doesn't appear in the exported tutorial.

## Why real-time matters

The recording must match the video duration that Vorec narrates. If the script has 5-second pauses between actions (for the viewer to read), those 5 seconds must appear in the video. Vorec's AI writes narration timed to the tracked action timestamps — if the video is shorter than the timestamps, narration won't sync.

## Related files

- [./vorec-script.md](./vorec-script.md) — Recording script template
- [./pacing.md](./pacing.md) — Timing rules per narration style
