---
name: context-writing
description: How to write great context fields for tracked actions — the key to quality narration
---

# Writing Context for Tracked Actions

The `context` field on each tracked action is what Vorec's AI uses to write voice-over narration. Better context = better narration. This guide teaches you how to write context that produces professional voice-over.

## The three text fields

| Field | Length | Purpose | Timeline shows |
|-------|--------|---------|---------------|
| `name` | 3-5 words | Short label | Dot tooltip |
| `description` | 5-15 words | What the user is doing | Action list |
| `context` | 1-3 sentences | **Rich scene description for narration** | Not shown — fed to AI |

## How to write context

### Rule 1 — Describe what you SEE, not just what you click

Bad: `"Click the Create button"`
Good: `"The Create button is in the top-right corner of the dashboard. Clicks it — a dialog slides in with fields for project title and template."`

### Rule 2 — Set the scene BEFORE the action

Bad: `"Clicks Next to go to Step 2"`
Good: `"We're on Step 1 of the wizard — the tournament name is set and Classic Americano is selected. Clicks Next to move to Step 2: Participants."`

### Rule 3 — React to what CHANGED after the action

Bad: `"Clicks Submit"`
Good: `"Clicks Submit. A success banner appears at the top confirming the account was created. The page redirects to the dashboard."`

### Rule 4 — Group by intent, not by individual click

When multiple actions serve one goal, write context that explains the intent:

Bad (on each action separately):
- "Click the name field"
- "Type 'Friday Night Padel'"
- "Click Next"

Good (on the type action, grouping the intent):
- `"Types 'Friday Night Padel' as the tournament name. This appears at the top of the bracket and leaderboard. The format is already set to Classic Americano."`

### Rule 5 — Orient the viewer on new pages

When the page changes (navigation, modal opens, tab switch), the FIRST action on the new page should describe what the viewer sees:

Good: `"The Participants page shows a text field for adding player names, an Add button, and a list of current participants. The count shows 1 of 24 — that's you, already added from the profile step."`

### Rule 6 — Vary context for repeated actions

When adding multiple items (players, products, rows), don't write the same context:

| Action | Context |
|--------|---------|
| Add player 1 | `"Types 'Carlos' into the name field. Each player needs a unique name. The Add button confirms each entry."` |
| Add player 2 | `"Adding Maria. The participant list grows on the right side as we add each name."` |
| Add player 4 | `"Four players in — halfway there. The counter updates in real time."` |
| Add player 7 | `"Last player — Diego. We now have 8 participants, which gives great variety in matchups."` |

### Rule 7 — Every action MUST have context

No empty context fields. Even simple actions need context:

| Type | Minimum context |
|------|----------------|
| `click` | What you click + what happens after |
| `type` | What you type + what the field is for |
| `narrate` | What you see on screen right now |
| `scroll` | What you're scrolling to and why |
| `select` | What you picked and what it controls |

## The `effect` concept

When writing context, think about the EFFECT of each action. This helps Vorec understand what happened:

| Effect | Include in context |
|--------|-------------------|
| Navigation | "The page navigates to..." |
| Modal opens | "A dialog appears showing..." |
| Modal closes | "The dialog closes, returning to..." |
| Tab switch | "Switching to the [tab name] tab, which shows..." |
| Form focus | "The cursor moves to the [field name] field..." |
| Content loads | "The results load, showing..." |
| Toggle change | "Toggles [setting] on/off, which..." |

## Context writing checklist

Before moving to the next action, check:
- [ ] Did I describe what's ON SCREEN (not just what I clicked)?
- [ ] Did I mention what CHANGED after the action?
- [ ] Did I orient the viewer if this is a new page/section?
- [ ] Is the context DIFFERENT from the previous action's context?
- [ ] Would someone listening (not watching) understand what happened?

## What Vorec does with your context

Vorec's AI reads context like this:
```
[0] 4.8s — narrate "intro" — The landing page shows a hero section with...
[1] 13.5s — click "generate-btn" — Clicks Generate Tournament. The format picker appears...
[2] 27.4s — click "classic-americano" — Clicks Classic Americano. The 3-step wizard opens...
```

It then writes voice-over that EXPANDS your context into natural speech, timed to the video. Better context = the AI knows what happened and can explain it naturally. Bad context = generic narration like "Click the button."
