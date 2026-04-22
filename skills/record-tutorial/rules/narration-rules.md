---
name: narration-rules
description: The exact narration rules Vorec AI uses — agent must follow these when writing narration
---

# Narration Rules

These are the EXACT rules Vorec's AI follows when generating voice-over. When you write the `narration` field on each tracked action, follow these rules. Then Vorec's AI validates your narration matches the chosen style and uses it as the final script.

## Write like a friend, not a spec

The narration explains the CONCEPT — not the exact literal input. Specific values the user types (names, emails, titles, IDs) are just examples for the recording. Never parrot them in the script.

Don't: "Type 'Padel Night Tournament' in the name field and click Next."
Do:    "Give your session a name, then hit Next."

Don't: "Click Female to set Elena's gender, then save."
Do:    "Pick your gender, then save."

Don't: "Types sarah@gmail.com into the email field."
Do:    "Enter your email."

Don't: "Names the project Q4 Marketing."
Do:    "Give the project a name."

Rule: if the value is **something the viewer would answer with their own data** (name, email, title, gender, photo, currency), narrate the PURPOSE of the field. If the value is **a feature/plan/mode where the choice drives the tutorial** (Pro vs Free, Dark vs Light), mention the option but frame it as "pick the X that fits" not "use this one".

## Plan segments first, distribute actions under them

Do NOT write one narration per action. That produces a checklist feel — every click narrated separately, voice playing constantly. Instead, plan the recording as **3-8 semantic beats**, one `narrate` block per beat, with 2-5 silent actions executing underneath each.

### The pattern

```
[narrate]  carries the voice for this beat          pause = narration speaking time
[action 1]  silent — no narration field              pause = short, just UI settle
[action 2]  silent
[action 3]  silent
```

Voice plays in full on the `narrate` block, then silent actions fire under their own short pauses. The voice finishes just before or as the silent actions start → perfect lead-up sync. No overlap, no overflow.

### What counts as a new segment

Start a new `narrate` block when:
- Page / route changes
- Modal or dialog opens
- A new cluster of related fields or steps begins
- The "why" of the next beat differs from the current one

Don't break segments arbitrarily — follow the flow's natural joints.

### Segment pacing budget

For each segment:
- `narrate.pause` = `words × 350ms + 200ms` (voice finishes 200ms before silent actions start)
- Silent actions get short pauses (500-1500ms) — just enough for UI to settle
- Total segment duration = narrate pause + sum(silent action pauses)

### Concrete example — signup flow in Tutorial style

```json
[
  { "type": "narrate", "narration": "Alright, let's get you set up — it's just four fields and a button, about ten seconds.", "pause": 6500 },
  { "type": "click",   "description": "Open signup", "pause": 1200 },

  { "type": "narrate", "narration": "Pop in your email and password, then tick the box to accept the terms.", "pause": 5600 },
  { "type": "type",    "description": "Email",    "pause": 1500 },
  { "type": "type",    "description": "Password", "pause": 1500 },
  { "type": "click",   "description": "Agree",    "pause": 800 },

  { "type": "narrate", "narration": "Hit Create account — your dashboard loads in a couple seconds.", "pause": 4500 },
  { "type": "click",   "description": "Create account", "pause": 2000, "primary": true },

  { "type": "narrate", "narration": "And there you go — you're in.", "pause": 2500 }
]
```

Three `narrate` beats, six silent actions. 16 words of lecture → zero. 4 beats of narration that land in sync with the visuals → perfect.

### The same flow in other styles (structure identical, words change)

**Conversational:** *"Okay so signing up is pretty quick — four fields, hit the button, you're done."* → *"Just your email, a password, and tick the terms box."* → *"Smash Create — should be instant."* → *"Boom. That's the dashboard."*

**Persuasive:** *"Watch this — full account in under ten seconds."* → *"Email. Password. Agree. That's it."* → *"One click."* → *"You're already inside."*

**Professional:** *"In this walkthrough, we'll create an account — a four-field form plus submission."* → *"Provide a valid email and password, then acknowledge the terms."* → *"Submit the form to proceed."* → *"The dashboard loads, confirming the account is active."*

Structure stays constant: 3 `narrate` blocks + silent actions underneath. Style picks the words.

### When inline narration on an action is OK

Skip the `narrate` block when the beat is ≤5 words and purely reactive:

```json
{ "type": "click", "description": "Undo", "narration": "Undo.", "pause": 1200 }
```

Use inline for short callouts BETWEEN segments, not as a replacement for segment planning.

## Time sentences to action timestamps

Narration is spoken over a timeline anchored by `timestamp` values on each action. If your narration is longer than the gap to the next action, it overflows and either freezes the video (freeze-sync) or runs over the next visual event.

Before writing narration for an action:

1. Estimate the gap until the next action fires (or until the recording ends).
2. Compute max words that fit: `max_words = floor((gap_ms - 500) / 350)`.
3. Write narration ≤ that word count for this action.

Speaking rate: **350ms per word** (~2.86 words/sec, Vorec TTS measured). 500ms trailing buffer so narration doesn't collide with the next click.

### Example

Action A fires at `timestamp: 2.4s`, next action B fires at `timestamp: 5.0s`.
Gap = 2600ms. Subtract 500ms buffer = 2100ms of speech.
Max words = 2100 / 350 = **6 words**.

Narration options:
- Do: *"Click Submit — the form processes."* (5 words, fits)
- Don't: *"Click Submit — the form processes and will show a success banner once done."* (12 words, overflows by 1.5s into the next action)

### When you need more words than the gap allows

- Option A: shorten the narration (preferred)
- Option B: delay the next action by increasing the current action's `pause`
- Option C: move the long explanation into a preceding `narrate` action (no click) with its own dedicated pause

A sentence describing an action should BEGIN just before that action's timestamp — not after it (sounds confused), and not 5 seconds before (sounds disconnected). If a segment has 10 seconds of actions and you write 30 seconds of narration, it will run into the next segment.

## Universal rules (apply to EVERY style)

### Perception
- You are writing what will be SPOKEN over a screen recording. Describe what's on screen, not just what was clicked.
- Before narrating an action, briefly set the scene: what's on screen, what area we're in, what the goal is.
- When something visual changes (modal opens, data loads, page transitions), REACT to it — describe what appeared.
- Group actions by INTENT, not by individual click. "Let's export this as a PNG" instead of "Click File, click Export, choose PNG".
- Use natural transitions between steps. Each segment should flow into the next like a real person talking.

### Pacing
- Narration speed: **~3 words per second** when spoken.
- Each narration must fit BEFORE the next action starts.
- If the gap is short, write fewer words. Never sacrifice timing for detail.

### Demo data vs real instructions
This is a tutorial recording. You typed values into forms as EXAMPLES. The viewer will use their own data.

**Rule 1 — User-typed text is always demo data**
Anything typed into an input, text area, search box, or form is demo data. Narrate what the field IS FOR, not the specific value. "Enter your project name" not "Type 'Q4 Site'".

**Rule 2 — Fixed choices are real instructions**
When you SELECTED from options (dropdown, radio, toggle, tab, plan/template/format), the choice matters. Reference what was selected so the viewer makes the same choice.

**Rule 3 — How to tell:**
- Did you TYPE it with keyboard? → Demo data. Narrate the purpose.
- Did you CLICK to choose from options? → Real choice. Mention it.
- Is it a button/menu/UI name? → Real. Reference by name.

**Rule 4 — When in doubt:**
Go generic. "Fill in the required field" is safer than dictating a specific value.

---

## Narration structure

Every action narration must add value. If the action is self-explanatory, keep narration short. If something new appears (dialog, page change), describe what appeared.

If you have nothing meaningful to say over an action, don't write narration for it — just track the action with context only and let Vorec handle it.

### What makes narration "no sense"
- Narrating what the user can obviously see ("The button says Submit" — they can read)
- Repeating the same idea across multiple actions ("Adding another item" × 7)
- Generic filler ("Now we'll move on to the next step")
- Describing the UI element instead of the intent ("This is a blue button with rounded corners")

### What makes narration valuable
- Explaining WHY ("We pick this option because it gives the best balance")
- Describing what CHANGED ("The dashboard now shows the new project at the top")
- Orienting on new pages ("This is the settings panel — the key options are on the left")
- Giving context the viewer needs ("This field accepts any email — use yours here")

### Hard cap: 15 words per single action

No single action's narration may exceed **15 words**. This is not a soft guideline — it's a hard cap. At 15 words × 350ms = 5250ms speaking time, the video is already holding still for over 5 seconds on one action. Longer than that, the viewer feels lectured to.

If you need more than 15 words to cover a moment, SPLIT into multiple actions:
- Move scene-setting / explainer content into a preceding `narrate` action (no click)
- Keep the narration on the actual interaction short and focused

Do (11 words): "Click Submit — the order processes for a moment before confirming."
Don't (22 words): "Click Submit — the order now processes. You'll see a spinner for about two seconds, then a confirmation dialog appears with the order number."

Fix by splitting:
```
[click] → "Click Submit — the order processes."                     (5 words)
[narrate] → "A confirmation dialog appears with the order number." (8 words)
```

### When to use inline narration vs a separate `narrate` action

Two valid patterns. Pick based on **what the narration is DOING**:

**Inline narration** — attach `narration` to a click / type / scroll action. Use when:
- The narration is SHORT (≤5 words): *"Click Save."* / *"Add."* / *"Now we're in."*
- It's a direct confirmation of the interaction itself
- The viewer's eye is already on the element being clicked

**Separate `narrate` action** — zero-click, just pause + speech. Use when:
- The narration is >8 words (scene-setting, explaining, teaching)
- You need to describe something that just APPEARED (dialog, toast, loaded page)
- You're orienting the viewer on a new page before they interact with it
- The narration is about MEANING, not about the click

**Rule of thumb**: if the narration is about *"here's what I'm clicking"*, inline. If it's about *"here's what this screen means"* or *"here's what just happened"*, use `narrate`.

Be consistent WITHIN a recording. Don't mix patterns randomly — pick one and use it for similar-type moments throughout.

### Transitions between actions

Narration should FLOW like a real person talking. Adjacent actions shouldn't feel like disconnected sentences.

Don't (abrupt) (each narration is an isolated sentence):
```
[click option]  → "Click the option — it highlights."
[click confirm] → "Confirm. Row added."
```

Do (bridged) (second narration picks up from the first):
```
[click option]   → "Pick the option and confirm below."
[click confirm]  → (no narration — the previous one covered it)
```

Do (group into one longer beat when clicks are ≤2s apart):
```
[click option + click confirm as ONE grouped action]
  → "Pick the option and confirm — the row is added in one beat."  (12 words, fits within grouped pause)
```

### Style-specific transition notes

- **Tutorial** — use soft bridges ("*Great, now...*", "*Perfect — next...*")
- **Conversational** — casual transitions ("*Alright, so...*", "*Next up...*")
- **Concise / Exact** — NO transitions, treat each line as standalone
- **Storytelling** — causal transitions ("*Because we did X, now...*")

---

## Style-specific rules

> **All quoted phrases below are examples, not scripts.** They show the TONE and APPROACH of each style. Write your own narration that matches the feel — don't copy these exact words. The examples are there to inspire, not to prescribe.



### Tutorial (default)
- **Tone**: Friendly instructor who genuinely wants the viewer to succeed.
- **Structure**: 3-8 high-level workflow steps. Group related clicks.
- **Approach**:
  - Open: set context — what app, what we're doing, why it matters.
  - Each step: orient the viewer ("We're in the settings panel now"), then guide the action.
  - When something appears (dialog, page, results), describe it before moving on.
  - Use encouraging language: "Perfect, now you can see...", "Great, that's exactly what we need..."
  - End: summarize what was accomplished.
  - Assume viewer sees this for the first time. Patient but not patronizing.

### Professional
- **Tone**: Senior professional delivering structured workplace training.
- **Structure**: 4-10 steps covering the complete workflow.
- **Approach**:
  - Open with a clear objective (e.g. *"In this walkthrough, we'll configure X to achieve Y."* — write your own).
  - Precise but not robotic — explain context, not just clicks.
  - Reference best practices: "It's recommended to...", "The standard approach is..."
  - Explain configuration options and which ones matter.
  - Note gotchas: "Make sure to save before navigating away."
  - Close: confirm what was accomplished and next steps.

### Conversational
- **Tone**: Showing a friend. Relaxed, natural, real.
- **Structure**: 3-7 steps. Merge small actions freely.
- **Approach**:
  - Start naturally in a casual tone (e.g. *"Alright, so here's the deal..."*, *"Okay so I want to show you..."* — write your own opener).
  - React like a real person: "See this panel on the left? That's where all the magic happens."
  - Contractions and filler words OK. "So basically what we're gonna do is..."
  - Share opinions: "I usually go with this option, it just works better."
  - Wrap up casually: "And that's pretty much it!"

### Storytelling
- **Tone**: Narrator telling the story of building something.
- **Structure**: 3-6 narrative beats that build on each other.
- **Approach**:
  - Open with the mission (e.g. *"We're about to transform this raw design into..."* — frame your own mission for this flow).
  - Every step answers WHY, not just what.
  - Build momentum: "Now that the foundation is set, this is where it gets interesting..."
  - Connect steps causally: "Because we set that flag earlier, the system now shows..."
  - End with accomplishment: "And just like that, what started as a blank canvas is now..."
  - **KEEP CONCISE** — prioritize pacing over detail.

### Persuasive
- **Tone**: Confident product demo presenter showing off something impressive.
- **Structure**: 3-7 steps emphasizing ease and power.
- **Approach**:
  - Open with excitement about what's possible (e.g. *"Let me show you how you can go from idea to published in under two minutes."* — match the pattern to this flow).
  - Emphasize speed: "With just a couple of clicks...", "Notice how it handles that automatically."
  - React enthusiastically: "And look at that — a fully formatted report, ready to share."
  - Compare to the old way: "What used to take an hour now happens instantly."
  - End with call-to-action: "Imagine what you could build. Try it free."

### Academic
- **Tone**: Knowledgeable educator explaining the thinking behind tools.
- **Structure**: 3-8 steps grouped by conceptual topic.
- **Approach**:
  - Frame the learning objective upfront (e.g. *"Today we'll explore how X works, and why it matters."* — state the objective for this specific flow).
  - Explain what UI elements ARE and what concepts they represent.
  - Define technical terms naturally.
  - Explain WHY things are designed this way.
  - Connect to broader concepts.
  - Summarize key takeaways.

### Concise
- **Tone**: Direct and minimal. Quick reference for someone who mostly knows.
- **Structure**: 4-10 steps. One per distinct action.
- **Approach**:
  - Imperative form: "Open Settings", "Select the Pro template", "Save and publish".
  - No intro, no conclusion, no transitions.
  - Still describe when it matters: "The export dialog appears — choose MP4."

### Exact
- **Tone**: Pure click detection — no narration style, just facts.
- **Verbosity**: 1 short sentence (3-8 words) per click.
- **Approach**:
  - Detect EVERY click. One click = one segment. No grouping.
  - NO introduction, NO conclusion, NO transitions.
  - Just: "Click Online Store", "Select Themes", "Click Customize button".

---

## How this connects to tracked actions

Each tracked action has:
- `narration` — what's spoken during this visual moment
- `pause` — explicit duration in ms for how long to hold on screen

### Rule: One visual moment = one tracked action

The narration should match what the viewer SEES in that exact moment. Don't write a long narration that spans multiple visual events. Split into multiple tracked actions, one per visual moment.

**Visual moments that deserve their own tracked action:**
- Cursor moves to an element (focus shifts)
- Button clicked (state change)
- Dialog/modal opens (new UI appears)
- Page navigates (new content loads)
- Field gets focus (cursor enters input)
- Dropdown opens (options visible)
- Item selected from a list (selection highlights)
- Result appears on screen (content updates)

**Bad — one long narration covering multiple visual events:**
```js
track('click', 'Create', 'Click Create to open project setup', 'create-btn', coords, {
  context: 'The dashboard is visible with the Create button ready to open the project setup dialog.',
  narration: "Let's create a new project. Click Create — the dialog appears with a name field. Now enter the project name, then pick a template, and finally set the visibility.",
  pause: 12000,
});
// The viewer is looking at a button being clicked but hearing about typing and selecting
```

**Good — split by visual moment:**
```js
// Moment 1: cursor on button, about to click
track('click', 'Create', 'Click Create to open project setup', 'create-btn', coords, {
  context: 'The dashboard is visible with the Create button ready to open the project setup dialog.',
  narration: "Let's make our first project — click Create.",
  pause: 2500,
});

// Moment 2: dialog appears
track('narrate', 'Dialog opens', 'Explain the project setup dialog', null, coords, {
  context: 'The project setup dialog is now open, showing fields for the project name and setup choices.',
  narration: "The project dialog slides in with a few fields to fill out.",
  pause: 3000,
});

// Moment 3: typing the name
track('type', 'Project name', 'Type the project name', 'name-input', coords, {
  context: 'The project name field is focused. The typed value is example data; viewers should enter their own name.',
  narration: "Start with a name — this is how it appears in your dashboard.",
  pause: 3000,
  typed_text: 'Q4 Marketing Site',
});
```

### CRITICAL: Narration must FIT in the pause (no freeze sync)

Narration is spoken at ~3 words/second. If the narration is too long for the pause, it overflows into the next action → **FREEZE SYNC** (the video freezes while narration catches up — looks broken).

**Math:**
- `narration_duration_ms = wordCount × 350` (measured Vorec TTS rate ~2.86 words/sec)
- `pauseMs = narration_duration_ms + 500` (breathing buffer so narration doesn't collide with next action)
- Rule: `pauseMs ≥ wordCount × 350 + 500`
- Example: 10-word narration → `pauseMs ≥ 4000` (3500 speech + 500 buffer)
- Example: `pauseMs: 3000` allows max 7 words of narration (2450 + 500 = 2950 ≤ 3000)

**When narration is too long:**
- Option A: increase `pauseMs` (if the visual moment supports a longer hold)
- Option B: shorten the narration
- Option C: split into multiple tracked actions with separate narrations and pauses

### Group nearby actions when narration spans them

If several clicks happen within 2-3 seconds (rapid navigation, multi-step clicks on the same screen), **DON'T split into multiple tracked actions with tiny pauses**. Either:

**Option A — One tracked action for the group:**
```js
// 3 clicks in 2 seconds, all part of "configure settings"
// → ONE tracked action covering all 3, with combined narration
await btn1.click();
await btn2.click();
await glideClick(btn3, 'Configure', 'Save grouped settings', 'save', context,
  "We're setting up the defaults — courts, rounds, and scoring all in one pass.",
  4500  // long enough for the combined narration
);
```

**Option B — Separate actions with fitting narration:**
```js
// If each click deserves its own narration beat
await glideClick(btn1, 'Courts', 'Choose court count', 'courts', context1, "Set the number of courts.", 2500);  // 5 words, 1.7s ✓
await glideClick(btn2, 'Rounds', 'Choose round count', 'rounds', context2, "Then pick rounds.", 2000);          // 3 words, 1s ✓
await glideClick(btn3, 'Save', 'Save settings', 'save', context3, "Save the configuration.", 2500);             // 3 words, 1s ✓
```

### Pause is explicit, not calculated

The agent sets `pause` directly in milliseconds. The narration word count is a reference (roughly 3 words/second) but the agent picks the pause based on:
- **Narration fit** — pause must hold long enough to speak the narration (`words × 350ms + 500ms buffer`)
- How long the visual moment lasts on screen
- The narration style (Conversational = longer holds, Exact = short)
- What happens next

```js
track('click', 'Submit', 'Click Submit to process the form', 'submit-btn', coords, {
  context: 'The form is complete and ready to submit. The button starts processing the entered details.',
  narration: "Click Submit. The form processes for a moment.",
  pause: 4000, // explicit — long enough for narration + brief wait for processing
});
```

### Fields summary

| Field | What it's for |
|-------|--------------|
| `context` | Scene reference (what's on screen) |
| `narration` | Spoken words over this moment (follows style rules) |
| `pause` | Hold time in ms (agent-chosen, matches visual event) |
| `typed_text` | Exact text typed (for type actions) |
| `primary` | Gold star marker |

Write narration per visual moment. Set pause explicitly. Vorec uses your narration as the final script.
