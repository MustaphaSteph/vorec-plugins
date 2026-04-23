---
name: scroll
description: When and how to use scroll actions — SPA reset trap, smooth scroll, button-reveal pattern
---

# Scroll Management

Scrolling is the most common source of "broken" recordings — the click fires but the new page opens off-screen because scroll position survived an SPA state change.

## Smooth scroll is automatic (CLI 2.21+)

The CLI now animates every `scroll` action in ~25px increments at 50fps so the camera glides instead of snapping. You don't need to do anything — just request a delta and it animates over ~400-1500ms depending on size.

## Reveal-before-click

When the next button is below the viewport (typical for Next / Submit / Generate at the bottom of long forms), add a visible `scroll` BEFORE the click so the viewer's eye follows the cursor down to the button.

```json
{ "type": "scroll", "y": 400, "pause": 600 },
{ "type": "click", "selector": "text=Generate", "pause": 1500, "primary": true }
```

Without the scroll, the cursor teleports to a button the viewer can't see, then the page jumps — looks broken.

## SPA vs real navigation — the reset trap

| Click outcome | Browser scroll behavior | What you must do |
|--------------|------------------------|------------------|
| URL changes (real navigation) | Browser auto-resets scroll to top | Nothing |
| Same URL, new content (SPA wizard / multi-step / tab swap) | Scroll position **persists** | Add a `scroll` with negative `y` AFTER the click |

The SPA case is what bites: you scroll down 500px to reveal the Next button, click it, the wizard advances to step 3 — but step 3's heading is still 500px above the viewport because scroll didn't reset.

### Fix pattern

```json
{ "type": "scroll", "y": 400,  "pause": 600 },                   // reveal Next
{ "type": "click",  "selector": "text=Next", "pause": 1500 },    // SPA advances
{ "type": "scroll", "y": -2000, "pause": 700 }                   // reset to top
```

`y: -2000` is safe — the scroll is clamped at 0, so over-scrolling up just stops at the top.

## When NOT to add a reset scroll

- The next click is also at the bottom (no reset needed, you're already there)
- The "next page" is a modal that overlays the current scroll (modal opens at top regardless)
- The URL actually changed (browser handles it)

## How to tell if a click triggers an SPA change vs real nav

During discovery, check the URL pattern:
- `/wizard/step1` → `/wizard/step2` = real nav, no reset needed
- `/wizard` for both steps = SPA, reset needed
- Modal-only flows (URL never changes) = SPA, but usually no reset (modal scrolls itself)

If you're unsure, add the reset scroll anyway — it's a no-op when scroll is already at 0.

## Scroll speed sanity

Default `y: 300` covers about a third of a 1080p viewport. Useful values:
- `y: 200-400` — reveal a button just below the fold
- `y: 600-900` — full-page-down (next section)
- `y: -2000` — reset to top after SPA state change
- `y: 1500-3000` — long page tour (use sparingly, gets boring)

Each scroll takes ~400-1500ms to complete depending on distance. Don't stack many large scrolls back-to-back unless you're doing a deliberate "tour the page" beat.
