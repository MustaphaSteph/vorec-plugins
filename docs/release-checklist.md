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
- Confirm README feature claims match the app-based `run` → review → `analyze` flow.
- Confirm `templates/vorec-manifest.template.json` matches the manifest schema agents should write.
- Confirm tracked-action examples include `context`, `narration`, and `pause`.
- Confirm live-site discovery examples include readiness gates and sensitive-action review.
- Confirm no `.DS_Store` files are tracked.
- Confirm any adapted third-party content remains covered by `skills/record-tutorial/LICENSE_playwright-cli.txt`.

## Optional Smoke Test

```bash
node scripts/smoke-test-template.mjs
```

The smoke test validates that the compatibility template produces a parseable `vorec.json` manifest and does not contain Playwright `recordVideo` or FFmpeg recording flow.
