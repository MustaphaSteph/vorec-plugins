---
name: narration-styles
description: All available Vorec narration styles — tone, use case, and what the AI voice-over sounds like
---

# Narration Styles

When the user picks a style, pass it as `narrationStyle` in the manifest. Vorec's AI watches the video and writes the voice-over script in that style.

**Default: `tutorial`** — use this unless the user asks for something different.

## Style Reference

| Style | Slug | Best for | Tone |
|-------|------|----------|------|
| Tutorial | `tutorial` | How-to guides, onboarding, product docs | Friendly instructor who wants the viewer to succeed |
| Professional | `professional` | Workplace training, enterprise demos, SOPs | Senior professional delivering structured training |
| Conversational | `conversational` | Team walkthroughs, internal demos, casual guides | Showing a friend how to do something on your screen |
| Storytelling | `storytelling` | Marketing videos, feature launches, Product Hunt | Narrator telling the story of building something |
| Concise | `concise` | Quick reference, power-user guides, changelogs | Direct and minimal — imperative form, no fluff |
| Exact | `exact` | Technical documentation, API docs, bug reports | Pure click-by-click — one short sentence per action |
| Academic | `academic` | Educational content, courses, learning platforms | Knowledgeable educator explaining the thinking behind the tools |
| Persuasive | `persuasive` | Sales demos, investor pitches, product showcases | Confident presenter showing off something impressive |

## Style Details

### Tutorial (default)
> *"Let's start by heading to the dashboard. You'll see your projects listed here — we're going to create a new one. Click the 'New Project' button in the top right..."*

- 3-8 high-level steps, groups related clicks
- Starts with intro: what app, what we're doing, why it matters
- Orients the viewer before each action
- Describes what appears on screen after each step

### Professional
> *"In this walkthrough, we'll configure the notification settings to meet your team's compliance requirements. Navigate to Settings, then select the Notifications tab..."*

- 4-10 steps covering the complete workflow
- Opens with a clear objective statement
- Precise but not robotic — explains context, not just buttons
- Uses professional vocabulary, avoids slang

### Conversational
> *"Alright, so here's the deal — I want to show you this really quick. See this button right here? Just click that and boom, you've got your dashboard..."*

- 3-7 steps, merges small actions freely
- Starts naturally, reacts to what's on screen
- Uses filler words, contractions, casual language
- Feels like a real person talking, not a script

### Storytelling
> *"We're about to transform this raw design into a published website. Here's how it comes together. First, we select our template — this is where the magic starts..."*

- 3-6 narrative beats that build on each other
- Opens with the mission/vision
- Every step answers WHY, not just what
- Creates a narrative arc with a satisfying conclusion

### Concise
> *"Open Settings. Select the Pro template. Toggle dark mode on. Save and publish."*

- 4-10 steps, one per distinct action
- Imperative form, no introductions or conclusions
- No transitions between steps
- For someone who mostly knows what they're doing

### Exact
> *"Click Settings button. Click Notifications tab. Toggle email alerts. Click Save."*

- One segment per click — no grouping
- 3-8 words per segment
- No introduction, no conclusion, no explanation
- Pure click-by-click documentation

### Academic
> *"Today we'll explore how version control works in this editor, and why it matters for team workflows. Notice the branching indicator in the top bar — this tells us..."*

- 3-8 steps grouped by conceptual topic
- Frames the learning objective upfront
- Explains the thinking behind the tools
- Connects UI elements to underlying concepts

### Persuasive
> *"Let me show you how you can go from idea to published in under two minutes. Watch how easy this is — just click here, and your entire dashboard lights up..."*

- 3-7 steps, grouped to emphasize ease and power
- Opens with excitement about what's possible
- Emphasizes speed, simplicity, and results
- Every step sells the product

## How to help the user choose

If the user isn't sure, ask:

> **Who's watching this video?**
> - New users learning the product → **Tutorial**
> - Team members in a workplace → **Professional**
> - Colleagues or friends → **Conversational**
> - Marketing audience or investors → **Storytelling** or **Persuasive**
> - Developers or power users → **Concise**
> - Technical documentation → **Exact**
> - Students or learners → **Academic**

Or just use **Tutorial** — it works for 80% of cases.

## Recording pacing

Each style has different timing. See [./pacing.md](./pacing.md) for pause durations, typing speeds, and hold times per style.
