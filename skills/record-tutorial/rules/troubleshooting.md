---
name: troubleshooting
description: Common errors and fixes for recording tutorials
---

# Troubleshooting

| Error | Fix |
|-------|-----|
| Validation failed | Read validation code, fix test data. Load [./validation.md](./validation.md) |
| Selector timeout | Use semantic locators (`getByRole`, `getByLabel`), add `scrollIntoViewIfNeeded()` |
| Submission error | Check API/backend validation rules |
| Page hangs on load | Change `waitStrategy` — avoid `networkidle` for SPAs with WebSockets |
| Cookie banner blocks clicks | Dismiss at start. Load [./playwright.md](./playwright.md) |
| Element obscured | Wait for overlays to disappear, use `force: true` as last resort |
| JS errors in console | Check `page.on('pageerror')` output — may indicate app bugs |
| New tab opens | Handle with `context.waitForEvent('page')`. Load [./playwright.md](./playwright.md) |
| iframe content | Use `page.frameLocator()`. Load [./playwright.md](./playwright.md) |
| Project limit | Delete projects or upgrade plan |
| Insufficient credits | Buy credits or wait for monthly reset |
| Recording too short | Min 10 seconds. Add delays between actions. |
| `networkidle` hangs | App has WebSockets/polling. Use `load` or `domcontentloaded` instead |
