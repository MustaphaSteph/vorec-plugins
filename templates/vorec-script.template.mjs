// Deprecated compatibility template.
//
// Vorec no longer records with standalone browser/video shell scripts.
// Agents should write a vorec.json manifest and run:
//   npx @vorec/cli@latest run vorec.json
// then, after user approval:
//   npx @vorec/cli@latest analyze <local-mp4>

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';

const OUTPUT_DIR = '.vorec/PROJECT_SLUG';
const TARGET_URL = 'TARGET_URL';
const storageState = existsSync('.vorec/storageState.json') ? '.vorec/storageState.json' : undefined;

mkdirSync(OUTPUT_DIR, { recursive: true });

const manifest = {
  title: 'PROJECT_TITLE',
  url: TARGET_URL,
  ...(storageState ? { storageState } : {}),
  language: 'en',
  narrationStyle: 'tutorial',
  actions: [
    {
      type: 'narrate',
      description: 'Introduce the workflow.',
      narration: 'In this tutorial, I will show you the workflow from start to finish.',
      pause: 2500,
    },
  ],
};

writeFileSync(`${OUTPUT_DIR}/vorec.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${OUTPUT_DIR}/vorec.json`);
