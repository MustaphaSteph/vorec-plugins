---
name: narration-rules
description: The exact narration rules Vorec AI uses — agent must follow these when writing narration
---

# Narration Rules

These are the EXACT rules Vorec's AI follows when generating voice-over. When you write the `narration` field on each tracked action, follow these rules. Then Vorec's AI validates your narration matches the chosen style and uses it as the final script.

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

## Style-specific rules

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
  - Open: clear objective — "In this walkthrough, we'll configure X to achieve Y."
  - Precise but not robotic — explain context, not just clicks.
  - Reference best practices: "It's recommended to...", "The standard approach is..."
  - Explain configuration options and which ones matter.
  - Note gotchas: "Make sure to save before navigating away."
  - Close: confirm what was accomplished and next steps.

### Conversational
- **Tone**: Showing a friend. Relaxed, natural, real.
- **Structure**: 3-7 steps. Merge small actions freely.
- **Approach**:
  - Start naturally: "Alright, so here's the deal..." or "Okay so I want to show you..."
  - React like a real person: "See this panel on the left? That's where all the magic happens."
  - Contractions and filler words OK. "So basically what we're gonna do is..."
  - Share opinions: "I usually go with this option, it just works better."
  - Wrap up casually: "And that's pretty much it!"

### Storytelling
- **Tone**: Narrator telling the story of building something.
- **Structure**: 3-6 narrative beats that build on each other.
- **Approach**:
  - Open with the mission: "We're about to transform this raw design into..."
  - Every step answers WHY, not just what.
  - Build momentum: "Now that the foundation is set, this is where it gets interesting..."
  - Connect steps causally: "Because we set that flag earlier, the system now shows..."
  - End with accomplishment: "And just like that, what started as a blank canvas is now..."
  - **KEEP CONCISE** — prioritize pacing over detail.

### Persuasive
- **Tone**: Confident product demo presenter showing off something impressive.
- **Structure**: 3-7 steps emphasizing ease and power.
- **Approach**:
  - Open with excitement: "Let me show you how you can go from idea to published in under two minutes."
  - Emphasize speed: "With just a couple of clicks...", "Notice how it handles that automatically."
  - React enthusiastically: "And look at that — a fully formatted report, ready to share."
  - Compare to the old way: "What used to take an hour now happens instantly."
  - End with call-to-action: "Imagine what you could build. Try it free."

### Academic
- **Tone**: Knowledgeable educator explaining the thinking behind tools.
- **Structure**: 3-8 steps grouped by conceptual topic.
- **Approach**:
  - Frame learning objective: "Today we'll explore how X works, and why it matters."
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

Each tracked action has a `narration` field. Write it following the style rules above. The word count of your narration determines the pause after the action (`words ÷ 3 = seconds`).

```js
track('click', 'Create', 'Click Create', 'create-btn', coords, {
  context: 'Clicks Create. A dialog opens with name, template, and visibility fields.',
  narration: "Now let's make our first project. Click the Create button and you'll see a dialog pop up where you can name it and set who can see it.",
});
```

- **`context`** = what's on screen (short, for scene reference)
- **`narration`** = what will be spoken (follows style rules, sized to action duration)
- **Pause** = `narration.wordCount ÷ 3` seconds

Write narration in the chosen style. Vorec validates it against these rules and uses it as the final script.
