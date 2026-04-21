---
name: recording-types
description: Classify what kind of video is being recorded so the agent picks the right discovery and narration behavior
---

# Recording Types

Classify every recording request before planning the flow. The type controls what the agent optimizes for.

## Types

| Type | User wording | Optimize for |
|---|---|---|
| `task_tutorial` | "how to create", "show how to set up", "record checkout", "make a tutorial" | Successful completion, valid data, assertions, clean end state |
| `website_tour` | "showcase this site", "tour the homepage", "explain the landing page" | Content-aware scrolling, section coverage, no unnecessary clicks |
| `bug_reproduction` | "record the bug", "show the error", "it breaks when..." | Faithful reproduction, visible error, diagnostic context |
| `ux_review` | "review this website", "compare competitor", "critique flow" | Observations, friction points, persona/style, no account-changing actions |

## Defaults

- If the user asks "how to do X", default to `task_tutorial`.
- If the user gives only a URL and asks for a demo/tour, default to `website_tour`.
- If the user mentions broken behavior, default to `bug_reproduction`.
- If the user asks for critique, competitor analysis, or opinionated commentary, default to `ux_review`.

## Behavior by Type

### Task Tutorial

The final video should show a known-good path from start to success.

Required before recording:
- Entry action
- Required fields
- Valid demo values
- Primary submit/create buttons
- Button enabling rules, if visible
- Success assertion
- Sensitive action review

### Website Tour

The final video should explain visible page content with purposeful scrolling.

Required before recording:
- 3-5 meaningful sections
- Scroll target for each section
- Visual goal for each section
- No unnecessary form submissions

### Bug Reproduction

The final video should preserve the bug, not hide it.

Required before recording:
- Initial state
- Exact reproduction steps
- Expected result
- Actual result
- Error message or broken UI evidence

### UX Review

The final video may include opinionated commentary, but must not perform sensitive actions.

Required before recording:
- Pages/sections reviewed
- Persona or tone
- Friction points
- Stop conditions for auth, payment, or destructive actions

## Examples (for each recording type)

| User says | Mode | Type | Priority |
|---|---|---|---|
| "Record how to sign up on acme.com" | Explore | `task_tutorial` | Find signup form, valid inputs, success page |
| "Record my dashboard so I can show investors" | Connected (codebase) or Explore (hosted) | `website_tour` | 3–5 meaningful sections, purposeful scrolling |
| "Record the bug where the cart doubles when I refresh" | Connected or Explore | `bug_reproduction` | Exact steps, visible error, preserve the glitch |
| "Review stripe.com's pricing page vs ours" | Explore | `ux_review` | Friction points, no account-changing actions |
| "Show how to create a product in our Shopify app" | Explore | `task_tutorial` + `recordFrame` iframe crop | Open through admin.shopify.com, crop recording to the app iframe |
