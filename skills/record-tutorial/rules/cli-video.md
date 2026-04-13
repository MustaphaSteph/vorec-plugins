---
name: recording-quality
description: How Vorec records high-quality video — CDP frame capture piped to FFmpeg
---

# Video Recording

Vorec records video by capturing lossless PNG frames from Chrome via CDP (Chrome DevTools Protocol) and piping them to FFmpeg in real-time. This produces sharp 4K H.264 MP4 files.

## How it works

```
Chrome renders page → CDP sends PNG frames → FFmpeg encodes to H.264 MP4
```

1. Open a Chromium browser with `deviceScaleFactor: 2` (4K pixels, normal-size content)
2. Start CDP `Page.startScreencast` with `format: 'png'` — Chrome sends lossless frames
3. Each frame is piped to FFmpeg's stdin as raw PNG data
4. FFmpeg encodes to H.264 MP4 with high bitrate settings
5. When done, stop CDP screencast and close FFmpeg

## Quality presets

| Preset | DPR | Output resolution | Bitrate |
|--------|-----|-------------------|---------|
| `'4k'` (default) | 2 | 3840×2160 | 8 Mbit/s |
| `'2k'` | 1.5 | 2880×1620 | 6 Mbit/s |
| `'1080p'` | 1 | 1920×1080 | 4 Mbit/s |

Viewport is always 1920×1080. Only DPR changes pixel sharpness.

## FFmpeg settings

```
-c:v libx264 -preset slow -crf 18 -tune animation -pix_fmt yuv420p -movflags +faststart
```

| Setting | Value | Why |
|---------|-------|-----|
| Codec | `libx264` (H.264) | Universal playback — QuickTime, iOS, Android, web |
| CRF | 18 | Visually lossless (lower = better quality, 18-23 range) |
| Preset | `slow` | Better compression at same quality |
| Tune | `animation` | Optimized for UI content (text, flat colors, sharp edges) |
| FPS | 30 | Smooth for tutorials, reasonable file size |

## Render flush before stop

Before stopping the CDP screencast, force a render flush to avoid a corrupted last frame:

```js
await page.evaluate(() => new Promise(r =>
  requestAnimationFrame(() => requestAnimationFrame(r))
));
await page.waitForTimeout(500);
await cdp.send('Page.stopScreencast');
```

## Output

- `./recordings/output.mp4` — ready to upload to Vorec or share directly
- No WebM intermediate — direct MP4 output, single compression pass

## Related files

- [./vorec-script.md](./vorec-script.md) — Recording script template with full CDP setup
- [./cli-commands.md](./cli-commands.md) — playwright-cli commands for page exploration
