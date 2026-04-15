---
name: context-writing
description: How to write great context fields for tracked actions — the key to quality narration
---

# Writing Context for Tracked Actions

The `context` field on each tracked action is what Vorec's AI turns into voice-over narration. Better context = better narration. This is the most important part of your recording script.

## ⚠️ CRITICAL: Context length determines video length

Every tracked action pauses the recording for `word_count ÷ 3` seconds (at the average speaking rate). This means:

- **A 30-word context = 10 second pause in the video**
- **A 6-word context = 2 second pause**

If you write long contexts on every action, the video will be 5+ minutes. Keep contexts **tight and action-sized**:

| Action type | Ideal context length |
|-------------|---------------------|
| Navigation click (page changes) | 8-15 words |
| Form submit / primary action | 10-20 words |
| Type input | 8-12 words |
| Hover/narrate (explains something) | 15-25 words |
| Repeated actions (adding items) | 5-8 words (terse) |

**The narration AI expands your short context into full sentences during TTS.** You don't need to write the final narration — just give the scene. "Clicks Save. Dialog closes, table refreshes." becomes "Now let's save our changes. The dialog disappears and you can see the table has updated with the new entry."

## ⚠️ CRITICAL: For repeated actions (loops), drop context to bare minimum

When adding 5+ of the same thing (players, rows, products):
- **First item**: full context explaining the process (20 words)
- **Middle items**: bare minimum, no repetition (3-6 words: "Adding another.", "Fifth one in.", "List grows.")
- **Last item**: brief wrap-up (8-12 words: "Last one — eight total, ready to continue.")

This cuts 8 × 20 words = 160 words (53s pause) down to ~60 words (20s pause). Same information, third the time.

## The three text fields

| Field | Length | Purpose | Example |
|-------|--------|---------|---------|
| `name` | 3-5 words | Timeline dot label | `"New Project"` |
| `description` | 5-15 words | What the user is doing | `"Click New Project to open the creation dialog"` |
| `context` | 1-3 sentences | **Scene description for AI narration** | `"Clicks the New Project button in the top-right corner. A dialog slides in with fields for name, description, and visibility settings."` |

## The 7 rules

### Rule 1 — Describe what you SEE, not just what you click

The viewer is watching a screen they've never seen before. Paint the picture.

Bad: `"Click the Settings button"`
Good: `"The Settings button is in the sidebar, below the team members list. Clicks it — the settings panel opens with tabs for General, Billing, and Notifications."`

### Rule 2 — Set the scene BEFORE the action

Tell the viewer where they are and what they're looking at before describing what you do.

Bad: `"Clicks Next to continue"`
Good: `"The form is filled out — name, email, and role are all set. Clicks Next to move to the permissions step."`

### Rule 3 — React to what CHANGED after the action

After every click, describe what happened on screen. Modals, page transitions, loading states, success messages — the viewer needs to know.

Bad: `"Clicks Save"`
Good: `"Clicks Save. A green toast notification appears confirming the changes were saved. The dialog closes and the updated value shows in the table."`

### Rule 4 — Group by intent, not by individual click

Don't narrate every micro-action. Group related actions into one meaningful step.

Bad (3 separate actions):
- `"Click the email field"`
- `"Type the email address"`
- `"Click the password field"`

Good (on the type action):
- `"Types the email address into the login form. The password field is next — it requires at least 8 characters with one uppercase letter."`

### Rule 5 — Orient the viewer on new pages

When navigation happens, the first action on the new page must describe what appeared.

Good examples:
- `"The dashboard loads showing three sections: recent projects on the left, team activity in the center, and usage stats on the right."`
- `"A modal appears with a multi-step form. The progress bar at the top shows Step 1 of 3: Basic Info."`
- `"The page redirects to the billing section. The current plan is highlighted in blue, with upgrade options below."`

### Rule 6 — Vary context for repeated actions

When adding multiple items, tell a progression story. The agent types realistic demo data (real-looking names, emails, values) but the context must frame them as examples — the viewer enters their own.

**First item — explain the PROCESS (how to add):**
`"Types a name and clicks Add. Enter each of your team members here — the list updates as you go."`

**Second item — reinforce the pattern:**
`"Adding another one. Same process — type the name, hit Add."`

**Middle item — show PROGRESS:**
`"Four added so far. The list is filling up on the right side."`

**Last item — what happens NEXT:**
`"Last one. The team is complete — ready to assign roles and set permissions."`

**Never narrate the specific demo values.** The viewer should hear "enter your team members" not "type Carlos, then Maria, then Pedro."

### Rule 7 — Every tracked action MUST have context

No empty context fields. If you track it, you describe it.

| Type | What to include in context |
|------|---------------------------|
| `click` | What you see → what you click → what changed after |
| `type` | What field → what you typed → what the field controls |
| `narrate` | Full description of what's currently on screen |
| `scroll` | What you're scrolling toward → what comes into view |
| `select` | What dropdown → what you picked → what it affects |
| `navigate` | Where you're going → why → what the new page shows |

## Think about the EFFECT

Every action causes a visual change. Name the effect in your context:

| Effect | How to describe it |
|--------|-------------------|
| Page navigation | `"The page navigates to the settings panel, showing..."` |
| Modal/dialog opens | `"A confirmation dialog appears asking..."` |
| Modal closes | `"The dialog closes, returning to the main view where..."` |
| Tab switch | `"Switching to the Activity tab, which shows a timeline of..."` |
| Dropdown opens | `"The dropdown expands showing options for..."` |
| Content loads | `"The results appear after a brief loading spinner, showing..."` |
| Success state | `"A green checkmark appears confirming..."` |
| Error state | `"A red warning appears saying..."` |
| Toggle change | `"Toggles dark mode on. The entire interface switches to..."` |

## Context checklist

Before moving to the next action, check:
- [ ] Did I describe what's ON SCREEN (not just what I clicked)?
- [ ] Did I mention what CHANGED after the action?
- [ ] Did I orient the viewer if this is a new page/section?
- [ ] Is the context DIFFERENT from the previous action's context?
- [ ] Would someone listening (not watching) understand what happened?
- [ ] For type actions — did I mention WHAT was typed and WHY?
- [ ] For repeated actions — does this context add new information?

## Demo data vs real choices

When recording, the agent fills forms with demo data. Vorec's narration must distinguish between data the agent made up (examples) and real choices the user would actually make.

| Signal | What it means | How to write context |
|--------|--------------|---------------------|
| Agent TYPED text with keyboard | Demo data — the value doesn't matter, the field does | `"Types a project name into the title field. You can use any name here — this is where your project appears in the dashboard."` |
| Agent CLICKED to choose from options | Real choice — the option matters | `"Selects the Pro plan. This unlocks advanced features like custom domains and team collaboration."` |
| Button or menu name clicked | Real UI element — always mention it | `"Clicks Export. A dropdown shows PDF, PNG, and SVG options."` |

**Rules:**
1. **Typed text = demo data** → narrate the PURPOSE of the field, not the specific value. Say "enter your project name" not "type 'My Project'"
2. **Clicked from a list = real choice** → mention what was selected and why it matters
3. **When in doubt → go generic** — safer to say "fill in the field" than dictate a specific value the viewer should copy

**In the context field:**

Bad: `"Types 'Q4 Marketing Site' as the project name."`
Good: `"Types a name for the project. This is how it appears in your dashboard — pick something descriptive for your team."`

Bad: `"Types 'sarah@gmail.com' into the email field."`  
Good: `"Enters an email address. This will be the account login — use your real email here."`

Good (for a real choice): `"Selects 'Monthly' billing. This charges once a month instead of annually — you can switch later in settings."`

## How Vorec uses your context

Vorec's AI reads each action like this:

```
[0] 2.5s — narrate "Dashboard" — The dashboard shows three project cards...
[1] 8.3s — click "New Project" ★ — Clicks New Project. A creation dialog slides in...
[2] 14.1s — type "Project name" (typed: "Q4 Marketing Site") — Types the project name...
[3] 22.7s — click "Create" ★ — Clicks Create. The project is created and the editor opens...
```

The AI expands your context into natural voice-over, timed to the video. It trusts your context completely — if you say a modal appeared, it narrates a modal appearing. If your context is empty or generic, the narration will be empty and generic.

**You are the eyes. Write what you see.**
