---
name: action-reference
description: Manifest action types, tracked action fields, and how Vorec uses them for narration
---

# Action Reference

Every tracked action needs **`description`** (short timeline label), **`context`** (rich scene description), and usually **`narration`** (the spoken script for that visual moment).

## The two text fields

| Field | Length | Purpose | Example |
|-------|--------|---------|---------|
| `description` | 5-10 words | Timeline label, what the user does | `"Click the Create Project button"` |
| `context` | 1-2 sentences | Scene reference for the AI and editor. Describe what happens, what appears on screen, why it matters. | `"Clicks the blue Create Project button. A dialog slides in with title and template fields."` |
| `narration` | 1 spoken segment | Primary voice-over script for this visual moment. Must fit the explicit `pause`. | `"Click Create Project. The setup dialog opens with the first fields ready to fill in."` |

**Good descriptions:** "Open the create dialog", "Enter the project name"
**Bad descriptions:** "button:has-text('Create')", "input[type='email']"

The description is the intent, not the selector.

**Good context:** "Clicks the New Project button in the top-right corner. A creation dialog appears with fields for project title, template selection, and a color picker."
**Bad context:** "Click button" (too vague — Vorec can't write useful narration from this)

## Action Types

| Type | Extra fields | What It Does |
|------|-------------|-------------|
| `narrate` | — | Pause — describe scene. No interaction. |
| `click` | — | Click an element |
| `type` | `typed_text` | Type text into an input |
| `select` | `selected_value` | Pick from dropdown |
| `hover` | — | Hover to highlight |
| `scroll` | — | Scroll down |
| `wait` | — | Pause for animations |
| `navigate` | — | Navigate to page |

All actions also have: `description`, `context`, `target`, `timestamp`, `coordinates`. Most actions also include `narration` and `pause`.

## When to use `narrate`

Don't add to every action — use judgment:
- User asked to explain a page/feature
- Complex page would confuse viewers
- Something isn't obvious from the recording alone
- Between sections to provide overview or transition

`narrate` explains **how things work**, not what's visible.

## Document ALL actions

Not just clicks. If the user types text → `type` action with `typed_text`. Dropdown → `select` with `selected_value`. Vorec needs the full workflow to generate accurate narration.

## How Vorec uses tracked actions

1. **Timeline** — each action appears as a color-coded dot at its `timestamp`
2. **Narration** — Vorec uses `narration` as the primary voice-over script and `context` as scene reference/fallback
3. **Auto-zoom** — click `coordinates` become zoom targets (centered on the element)
4. **Cursor effects** — click ripples render at `coordinates` position
5. **Click markers** — `description` shown as tooltip, `target` as element label
6. **Primary clicks** — segments reference actions via `click_refs[]` indexes; `primary_click` gets a gold star on timeline
