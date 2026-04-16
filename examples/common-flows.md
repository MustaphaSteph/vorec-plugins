# Common Recording Flow Examples

Use these as patterns when mapping a user's request into a recording plan. They are examples, not scripts to copy verbatim.

## Public Marketing Page Walkthrough

Goal: show the value proposition and key call-to-action on a public site.

Recommended flow:
1. Open the landing page directly.
2. Narrate the hero section once.
3. Scroll to the feature section with `scrollToElement`.
4. Hover or narrate one key feature group.
5. Click the primary CTA only if it does not start a sensitive or paid action.
6. End on the signup/contact/pricing page or visible CTA state.

Use:
- Explore mode unless the codebase is available.
- `website_tour` recording type.
- `live-site-map.json` with section scroll targets.
- No login.
- Few tracked actions, usually 5-8.

## Signup Flow With Unique Email

Goal: record account creation without colliding with existing users.

Recommended flow:
1. Read validation rules in Connected mode, or dry-run in Explore mode.
2. Generate a timestamp-based email.
3. Use a password that satisfies all known rules.
4. Track each visible form moment: focus, type, submit, success.
5. Wait for the exact success state, such as a heading or dashboard redirect.

Narration rule:
- Treat typed values as demo data. Say what the field is for, not the exact value.

## Authenticated Dashboard Feature

Goal: record a feature that requires login.

Recommended flow:
1. Check `.vorec/storageState.json` before asking the user to log in.
2. If needed, open headed Chromium and save storage state after login.
3. Ensure the recording script loads `.vorec/storageState.json`.
4. Start the final recording on the feature page, not the login page.
5. End on a healthy success state with no validation or permission errors.

Use:
- `task_tutorial` recording type.
- `live-site-map.json` with required fields, valid demo values, and success state.
- `rules/auth.md` for session capture.
- The storage-state snippet in `templates/vorec-script.template.mjs`.

## E-Commerce Add-To-Cart

Goal: show how to select a product and add it to cart without completing payment.

Recommended flow:
1. Start from the product page.
2. Dismiss cookie banners early.
3. Select required product options.
4. Click Add to cart.
5. Wait for cart drawer, toast, or cart count update.
6. Stop before checkout unless the user explicitly requested checkout and no payment is made.

Sensitive action rule:
- Do not submit payment, purchase, transfer, or irreversible actions without explicit user approval.

## Local React App Connected Mode

Goal: record a local app feature using source-code knowledge.

Recommended flow:
1. Read `package.json` for scripts and port.
2. Read routes and feature components for selectors and success states.
3. Read form validators and API handlers for valid data.
4. Start the dev server if needed.
5. Record against the local URL with deterministic selectors.

Use:
- `data-testid`, accessible names, labels, and placeholders from source.
- Exact success-state locators from the component tree.
