---
name: pacing
description: How the agent calculates pause duration from narration word count — no hardcoded values
---

# Pacing

## The only rule

Every pause is calculated from the narration you wrote for that action:

```js
const pauseFor = (narration) =>
  Math.max(1500, Math.ceil(narration.split(/\s+/).filter(Boolean).length * 350) + 500);
```

- `350ms per word` = ~2.86 words/sec (measured Vorec TTS rate)
- `+500ms` = breathing buffer AFTER speech ends, so narration doesn't collide with the next click
- `1500ms` minimum — even silent transitions need a beat

**`pauseMs` = speaking time + buffer. Not just speaking time.**
Example: a 20-word line speaks in 7000ms, so its `pauseMs` is **7500ms** (speech + 500ms buffer).

## Never eyeball durations

When drafting narration for the user, **never label lines with approximate seconds** like `(6s)` or `~5s`. Always run the formula and write the exact integer `pauseMs`. Eyeballing causes freeze-sync (narration overflows the pause).

Do: `"Click Submit." → 2 words → pauseMs: 1500`
Don't: `"Click Submit." (2s)` ← no formula applied

**Agent workflow:** write narration → count words → run formula → show exact `pauseMs` integer.

## Examples

| Narration | Words | pauseFor() |
|-----------|-------|-----------|
| "Click Submit." | 2 | 1500ms (minimum) |
| "Click Save. The dialog closes." | 5 | 2250ms |
| "Now let's create a new project — click New Project in the top-right." | 12 | 4700ms |
| "This is where the real magic happens. Every action you take here updates in real time, and the preview on the right shows exactly what your customers will see." | 28 | 10300ms |

## Typing speed per style

Typing speed IS style-dependent (affects how human the typing looks):

```js
const TYPING_DELAY = {
  exact: 50, concise: 60, tutorial: 80, professional: 80,
  conversational: 100, storytelling: 100, academic: 100, persuasive: 80,
}[STYLE];
```

## General rules

- **Write narration first, pause second** — never set pauseMs before the narration exists
- **Split by visual moments** — one tracked action = one thing the viewer sees changing
- **No `fill()` for tracked actions** — always `slowType` so the typing is visible
- **Group or split** — if you need 20 words over 3 clicks in 2 seconds, either merge into one action with one long narration, or split into 3 actions each with fitting narration

See [./narration-rules.md](./narration-rules.md) for how to write narration in the chosen style. See [./context-writing.md](./context-writing.md) for context field rules.
