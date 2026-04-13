---
name: pacing
description: Timing rules — context-driven pauses, style multipliers, one formula
---

# Pacing Rules

## One formula for all pauses

Every pause duration is calculated from the context that will be narrated over it:

```js
const wordMs = (text) => Math.max(1500, Math.round((text.split(/\s+/).length / 3) * 1000));
```

- Average speaking rate: ~3 words per second
- 30-word context = ~10s pause
- 6-word context = ~2s pause
- Minimum 1.5s (even silent transitions need a beat)

**Write the context first. The timing follows automatically.**

## Style multiplier

Each narration style adjusts the base pause:

```js
const STYLE_SPEED = {
  exact: 0.6,
  concise: 0.7,
  tutorial: 1.0,
  professional: 1.0,
  conversational: 1.2,
  storytelling: 1.3,
  academic: 1.3,
  persuasive: 1.1,
};

const pause = (context, style) => Math.round(wordMs(context) * (STYLE_SPEED[style] || 1.0));
```

Same context, different styles:
- "Click Create. The wizard opens." (6 words) → Exact: 1.5s, Tutorial: 2s, Storytelling: 2.6s
- A 30-word scene description → Exact: 6s, Tutorial: 10s, Conversational: 12s

## How helpers use it

The helpers calculate their own timing from context — no hardcoded pauses:

```js
const glideClick = async (locator, name, desc, target, context) => {
  const box = await glideMove(locator);
  track('click', name, desc, target, toCoords(box), { context });
  await locator.click();
  await page.waitForTimeout(pause(context, STYLE));
};

const hoverTour = async (locator, name, context) => {
  const box = await glideMove(locator);
  track('narrate', name, context, null, toCoords(box), { context });
  await page.waitForTimeout(pause(context, STYLE));
};

const slowType = async (locator, text, name, desc, target, context) => {
  const box = await glideMove(locator);
  await locator.click();
  track('type', name, desc, target, toCoords(box), { context, typed_text: text });
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: TYPING_DELAY });
  }
  await page.waitForTimeout(pause(context, STYLE));
};
```

## Typing delay per style

| Style | Typing delay per character |
|-------|---------------------------|
| Exact | 50ms |
| Concise | 60ms |
| Tutorial | 80ms |
| Professional | 80ms |
| Conversational | 100ms |
| Storytelling | 100ms |
| Academic | 100ms |
| Persuasive | 80ms |

## General rules

- **No instant `fill()`** — every tracked `type` action must use `slowType` so the viewer sees it
- **Explain while doing, not before** — don't stack narrate blocks before the first click
- **Interact with what you narrate** — hover over the actual element you're describing
- **Even pacing across steps** — no step should take more than 2x the time of another step

## Context writing style must match

The tone of your context should match the narration style. See [./context-writing.md](./context-writing.md) for the full guide.

| Style | Tone |
|-------|------|
| Tutorial | Friendly: "Let's start by clicking Create. This opens the setup wizard." |
| Professional | Structured: "Navigate to the settings panel. Select the notification preferences." |
| Conversational | Casual: "Alright, so we just hit this button and the wizard pops up." |
| Storytelling | Narrative: "This is where it all begins. One click, and everything starts taking shape." |
| Concise | Direct: "Click Create. The wizard opens." |
| Exact | Factual: "Click Create button." |
| Academic | Conceptual: "The Create action initiates the multi-step configuration workflow." |
| Persuasive | Selling: "Look how easy this is — one click and you're already building." |
