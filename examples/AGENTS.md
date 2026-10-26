# Vorec instructions for AI coding agents

Copy this section into your agent's instructions file:

- Codex and most agents: `AGENTS.md`
- Cursor: `.cursor/rules/vorec.md`
- Gemini CLI: `GEMINI.md`
- GitHub Copilot: `.github/copilot-instructions.md`
- Claude Code: install the `record-tutorial` plugin from this repo instead

```markdown
## Recording demo videos

When asked to record a demo, tutorial or walkthrough of this app, use Vorec
(full agent skill: https://vorec.ai/skill.md).

1. Check readiness: `npx @vorec/cli@latest check`
   (needs macOS, the Vorec Recorder app signed in with Screen Recording +
   Accessibility, and `cliclick`).
2. Plan the flow and write a `vorec.json` manifest of actions
   (click, type, select, hover, scroll, wait, navigate, narrate), each with a
   short `description` and a `context` sentence explaining what happens.
3. Record locally: `npx @vorec/cli@latest run vorec.json`.
   This never uploads or spends credits.
4. Show me the MP4 and wait for my approval.
5. Only after I approve: `npx @vorec/cli@latest analyze <path-to-mp4>`
   to upload, generate AI narration and voice-over, and get the editor link.

Never type real passwords or secrets into a manifest. Use demo data.
```
