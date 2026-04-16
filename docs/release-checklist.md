# Release Checklist

Run this before publishing a plugin update.

## Required Checks

```bash
node scripts/validate-plugin.mjs
node --check scripts/validate-plugin.mjs
node --check scripts/validate-tracked-actions.mjs
node --check scripts/validate-live-site-map.mjs
node --check scripts/smoke-test-template.mjs
node scripts/validate-tracked-actions.mjs examples/tracked-actions.sample.json
node scripts/validate-live-site-map.mjs examples/live-site-map.sample.json
```

## Manual Review

- Confirm `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` versions match.
- Confirm README feature claims match `templates/vorec-script.template.mjs`.
- Confirm `skills/record-tutorial/rules/vorec-script.md` helper signatures match the template.
- Confirm tracked-action examples include `context`, `narration`, and `pause`.
- Confirm live-site discovery examples include readiness gates and sensitive-action review.
- Confirm no `.DS_Store` files are tracked.
- Confirm any adapted third-party content remains covered by `skills/record-tutorial/LICENSE_playwright-cli.txt`.

## Optional Smoke Test

If Playwright and FFmpeg are available:

```bash
node scripts/smoke-test-template.mjs
```

The smoke test records a tiny local HTML flow and validates the generated `tracked-actions.json`.
