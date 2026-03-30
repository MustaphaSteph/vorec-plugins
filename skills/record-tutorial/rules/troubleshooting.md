---
name: troubleshooting
description: Common errors and fixes
---

# Troubleshooting

| Error | Fix |
|-------|-----|
| `playwright-cli: command not found` | `npm install @playwright/cli` |
| Chromium not installed | `npx playwright install chromium` |
| FFmpeg missing | `brew install ffmpeg` (macOS) / `apt install ffmpeg` (Linux) |
| No API key | `npx @vorec/cli@latest login` |
| Element ref not found | Run `snapshot` again — refs change after page updates |
| Validation failed | Read validation code, fix test data. Load [./validation.md](./validation.md) |
| Page hangs on load | Use `--headless` first to test, check for WebSockets/polling |
| Cookie banner blocks | Dismiss via `click` on the accept button ref from snapshot |
| Auth expired | Re-run `state-save` with fresh login |
| iframe content | Use `run-code` with `page.frameLocator()`. Load [./playwright-cli.md](./playwright-cli.md) |
| New tab opens | Use `tab-list` and `tab-select`. Load [./playwright-cli.md](./playwright-cli.md) |
| Project limit | Delete projects or upgrade plan |
| Insufficient credits | Buy credits or wait for monthly reset |
| Recording too short | Min 10 seconds. Add waits between actions. |
| Video blank/corrupt | Ensure `video-start` before actions and `video-stop` after |
| Coordinates wrong | Verify `resize 1920 1080` was set before recording |
