import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const failures = [];

const read = (path) => readFileSync(join(root, path), 'utf8');

const check = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const file of [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'skills/record-tutorial/cursors/hotspots.json',
]) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    failures.push(`${file}: invalid JSON (${error.message})`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

for (const file of trackedFiles) {
  check(!file.endsWith('.DS_Store') || !existsSync(join(root, file)), `${file}: .DS_Store must not be tracked`);
}

const markdownFiles = trackedFiles.filter((file) => file.endsWith('.md'));
for (const file of markdownFiles) {
  const content = read(file);
  const links = content.matchAll(/\]\((\.\/[^)#]+)(?:#[^)]+)?\)/g);
  for (const [, href] of links) {
    const target = normalize(join(root, dirname(file), href));
    check(existsSync(target), `${file}: broken relative link ${href}`);
  }
}

const skill = read('skills/record-tutorial/SKILL.md');
check(!skill.includes('Load [./rules/vorec-script.md](./rules/vorec-script.md) for the template.\n\nLoad [./rules/vorec-script.md]'), 'SKILL.md: duplicate vorec-script load instruction');

const agentBehavior = read('skills/record-tutorial/rules/agent-behavior.md');
check(!agentBehavior.includes('Step 5 in SKILL.md'), 'agent-behavior.md: stale Step 5 reference');

const cursorPack = read('skills/record-tutorial/rules/cursor-pack.md');
check(!cursorPack.includes('Step 6 of the main workflow'), 'cursor-pack.md: stale Step 6 reference');

const explore = read('skills/record-tutorial/rules/explore.md');
check(!explore.includes('Step 8 (Build the recording script)'), 'explore.md: stale Step 8 reference');

const readme = read('README.md');
check(!readme.includes('CDP lossless frame capture'), 'README.md: stale CDP recording claim');
check(!readme.includes('FFmpeg at 8 Mbit/s'), 'README.md: stale bitrate claim');
check(!readme.includes('@vorec/cli@latest login'), 'README.md: stale interactive login setup');

const license = join(root, 'LICENSE');
check(existsSync(license) && statSync(license).isFile(), 'LICENSE: root MIT license is missing');

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Plugin validation passed.');
