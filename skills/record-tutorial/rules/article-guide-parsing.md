---
name: article-guide-parsing
description: How to extract flow steps and screenshots from a user-provided article or help guide link before writing the manifest
---

# Parsing a User-Provided Article or Guide

When the user shares a link to a help article, documentation page, or any guide that describes the flow they want to record, treat it as the source of truth for what the video must show. Don't rely only on the text summary — the screenshots in the article define the exact UI states the video must match.

## When to load this file

Load this file when:
- The user pastes a URL before asking you to record
- The user says "record this", "follow this guide", "same as this article"
- The user shares a help center, docs, or tutorial link alongside a recording request

## Step 1 — Fetch the article

Use `WebFetch` on the URL with this prompt:

> "List every image URL in this article and describe what each image shows. Also list every step shown with its exact UI label or button name."

This gives you:
- All image CDN URLs (usually from storage.crisp.chat, cdn.intercom.com, etc.)
- The ordered list of steps and button labels from the article text

## Step 2 — Fetch the screenshots

Launch a single subagent (Agent with subagent_type=Explore) and pass it all image URLs at once. Ask it to:

> "For each image URL, open it in the browser using browser_navigate, take a screenshot with
> browser_take_screenshot, and describe exactly what UI is shown — what buttons, fields,
> checkboxes, labels, and states are visible. Note what is highlighted or focused and what
> step this represents."

The subagent uses Playwright to open each URL in a real browser window, renders the image at full resolution, captures a screenshot, and the vision model returns a detailed description of the screen state.

**Why Playwright and not WebFetch?**
WebFetch is built for HTML pages — it converts HTML to markdown and loses image content. Image URLs (JPG, PNG, WebP) have no HTML to parse. Playwright opens the image directly in a browser tab where it renders at full size, so the vision model sees the actual pixels.

**Why a subagent?**
All images can be opened in parallel and the descriptions can be large — offloading to a subagent keeps the main context clean.

## Step 3 — Map article images to manifest actions

Go through the image descriptions in order. For each screenshot, identify:

| Screenshot shows | Manifest action |
|---|---|
| A button being clicked | `click` action targeting that button |
| A field being filled | `type` action with the value shown |
| A modal/dialog open | Preceding `click` that opens it + `narrate` for overview |
| A checkbox checked | `click` on that checkbox |
| A result/success state | Trailing `narrate` describing what changed |
| A panel or section overview | `narrate` with `delay` to let user observe |

Screenshots with red circles, numbered labels, or highlight boxes are the article author's emphasis — treat those as the primary actions for that step.

## Step 4 — Use article demo values

When the article shows example values in fields (rate names, prices, country selections, product names), use the same values in your manifest. This ensures the recorded video visually matches the article.

If the article shows a condition like "India" selected as a country or specific products added — replicate that in the manifest actions. Do not invent different demo values.

## Step 5 — Check for steps the text misses

Article text often summarizes; screenshots are exhaustive. Common gaps:

- **Save button** — articles frequently show an "Unsaved changes" banner and a Save click that the text summary skips. If a screenshot shows it, include it.
- **Tab switches** — the article may say "go to Form Builder" without showing the click. If a screenshot shows the tab selected, include the `click` on that tab.
- **Intermediate dialogs** — a screenshot might show a modal open mid-flow that the text never mentions. Include a `narrate` to orient the viewer.
- **Empty vs filled states** — if a screenshot shows a search field that appeared after a checkbox was clicked, include the checkbox click AND the resulting search interaction as separate actions.

## Step 6 — Flag selectors that need discovery

After mapping all screenshots to actions, note which ones you have not verified live:

- Any modal or dialog that only appears after an earlier action
- Any dynamic field that appears conditionally (search inputs, expanded sections)
- Any picker (country picker, product picker) that requires typing + selecting from a dropdown

Mark these in `flow-notes.md` as **needs live verification**. During the dry-run, confirm these selectors before recording.

## Example

User shares: `https://help.example.com/en/article/add-shipping-rates`

WebFetch(url, "List every image URL and step label")
→ Returns 8 image URLs + 16 step labels

Agent(Explore, "Open each image URL in browser, screenshot, describe the UI")
→ Returns descriptions of each screenshot

Map each description to manifest actions:
  Screenshot 1 (Shipping rates tab active) → click tab
  Screenshot 2 (Add rate dialog open)      → click "Add rate" button
  Screenshot 3 (conditions expanded)       → click "Add conditions"
  Screenshot 4 (country checked + India)   → click checkbox + type "India"
  Screenshot 5 (product selected)          → click checkbox + select product
  Screenshot 6 (Unsaved changes + Save)    → narrate banner + click "Save"
  Screenshot 7 (Import button highlighted) → narrate tip about Import
  Screenshot 8 (Form Builder + field)      → click tab + click "Add new fields"

## What not to do

- **Don't rely only on the article text** — the text is a summary. Screenshots are the ground truth.
- **Don't skip screenshots that show "optional" steps** — if the article author included a screenshot for it, the user expects to see it in the video.
- **Don't invent demo values** — use whatever the article shows in the fields. Users will compare the video to the article.
- **Don't use WebFetch to fetch image URLs** — WebFetch is for HTML pages. Use Playwright browser_navigate + browser_take_screenshot for image files.
- **Don't batch all images into one WebFetch call** — fetch the article page first to get the URLs, then open the images separately via the Playwright subagent.
