---
name: action-reference
description: Manifest action types, descriptions, and context fields
---

# Action Reference

Every action needs `description` (timeline label) and `context` (rich scene description for narration).

**Good descriptions:** "Open the create dialog", "Enter the project name"
**Bad descriptions:** "button:has-text('Create')", "input[type='email']"

The description is the intent, not the selector.

## Action Types

| Type | Fields | What It Does |
|------|--------|-------------|
| `narrate` | `description`, `context`, `delay` | Pause — describe scene. No interaction. |
| `click` | `selector`, `description` | Click an element |
| `type` | `selector`, `text`, `description` | Type text into an input |
| `select` | `selector`, `value`, `description` | Pick from dropdown |
| `hover` | `selector`, `description` | Hover to highlight |
| `scroll` | `description` | Scroll down |
| `wait` | `delay` (ms) | Pause for animations |
| `navigate` | `text` (URL), `description` | Navigate to page |

Optional: `delay` (ms) — extra wait after the action. `context` — rich description for AI narration.

## When to use `narrate`

Don't add to every action — use judgment:
- User asked to explain a page/feature
- Complex page would confuse viewers
- Something isn't obvious from the recording alone

`narrate` explains **how things work**, not what's visible.

## Document ALL actions

Not just clicks. If the user types text → `type` action with `text` field. Dropdown → `select` with `value`. Vorec needs the full workflow.
