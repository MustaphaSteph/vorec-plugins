---
name: pacing
description: Timing rules for recording scripts — pause durations, typing speeds, and hold times per narration style
---

# Pacing Rules

The recording script controls video timing. Every pause must give the viewer enough time to see what's on screen AND leave room for voice-over to play.

## General rules (all styles)

- **Narration = 1 second per 3 words of context** — if context is 21 words, pause 7s minimum
- **No instant fill()** — every tracked action must use slowType so the viewer sees it
- **Hold 3s after page transitions** — after navigation or URL change, let the page render
- **Explain while doing, not before** — don't stack narrate blocks before the first click. One hover max per page to orient, then start interacting
- **Interact with what you narrate** — never drop a narrate pause over empty space. Hover over the actual element you're describing
- **Even pacing across steps** — no step should take 2x longer than another

## Per-style timing

| Style | Narrate pause | Hold after click | Typing delay | Between repeats |
|-------|--------------|-----------------|-------------|----------------|
| Exact | 2s | 1s | 50ms | 0.5s |
| Concise | 3s | 1.5s | 60ms | 0.8s |
| Tutorial | 5s | 2s | 80ms | 1.2s |
| Professional | 5s | 2s | 80ms | 1.2s |
| Conversational | 6s | 2.5s | 100ms | 1.5s |
| Storytelling | 7s | 3s | 100ms | 1.5s |
| Academic | 7s | 3s | 100ms | 1.5s |
| Persuasive | 6s | 2.5s | 80ms | 1.2s |

**How to use these values:**
- `Narrate pause` — `waitForTimeout` after a `track('narrate', ...)` call
- `Hold after click` — `waitForTimeout` after `glideClick` / form submission
- `Typing delay` — the per-character delay in `slowType` (jitter +/- 30%)
- `Between repeats` — pause between similar actions (e.g. adding multiple players)

## Context writing style must match

The `context` field on each action is what Vorec turns into voice-over. Write it in the tone of the chosen style:

| Style | How to write context |
|-------|---------------------|
| Tutorial | Friendly instructor: "Let's start by clicking the Create button. This opens the setup wizard." |
| Professional | Structured: "Navigate to the format selection page. Select Classic Americano from the available options." |
| Conversational | Casual: "Alright, so we just hit this button here and boom — the wizard opens up." |
| Storytelling | Narrative: "This is where it all begins. One click, and the tournament starts taking shape." |
| Concise | Direct: "Click Create. The wizard opens." |
| Exact | Factual: "Click Create Tournament button." |
| Academic | Conceptual: "The Create button initiates the tournament generation workflow, which follows a three-step wizard pattern." |
| Persuasive | Selling: "Look how easy this is — one click and you're already setting up your tournament." |
