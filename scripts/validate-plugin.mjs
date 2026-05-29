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
  'schemas/live-site-map.schema.json',
  'schemas/tracked-action.schema.json',
  'templates/vorec-manifest.template.json',
]) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    failures.push(`${file}: invalid JSON (${error.message})`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
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
    // SKILL.md embeds adapted rule files as inline sections; some relative
    // links are retained as provenance markers, not as files in this plugin.
    if (file === 'skills/record-tutorial/SKILL.md') continue;
    const target = normalize(join(root, dirname(file), href));
    check(existsSync(target), `${file}: broken relative link ${href}`);
  }
}

const skill = read('skills/record-tutorial/SKILL.md');
check(skill.includes('live-site-map.json'), 'SKILL.md: missing live-site map workflow');
check(skill.includes('Record (no upload yet)'), 'SKILL.md: missing local-only recording step');
check(skill.includes('On approval, upload + analyze'), 'SKILL.md: missing approval-gated analyze step');
check(skill.includes('timeline add-video'), 'SKILL.md: missing media/timeline command guidance');
check(!skill.includes('captures + uploads automatically'), 'SKILL.md: stale run-uploads wording');
check(!skill.includes('captures + uploads. Return'), 'SKILL.md: stale capture/upload wording');

const readme = read('README.md');
check(!readme.includes('CDP lossless frame capture'), 'README.md: stale CDP recording claim');
check(!readme.includes('FFmpeg at 8 Mbit/s'), 'README.md: stale bitrate claim');
check(!readme.includes('@vorec/cli@latest login'), 'README.md: stale interactive login setup');
check(readme.includes('docs/release-checklist.md'), 'README.md: missing release checklist link');
check(readme.includes('examples/common-flows.md'), 'README.md: missing common flows link');

const template = read('templates/vorec-script.template.mjs');
check(template.includes("existsSync('.vorec/storageState.json')"), 'template: missing storageState loading');
check(!template.includes('recordVideo'), 'template: stale Playwright recordVideo flow');
check(!template.includes('ffmpeg'), 'template: stale FFmpeg flow');
check(template.includes('validate-tracked-actions') === false, 'template: should not depend on repository validation scripts');

for (const file of [
  'scripts/validate-plugin.mjs',
  'scripts/validate-live-site-map.mjs',
  'scripts/validate-tracked-actions.mjs',
  'scripts/smoke-test-template.mjs',
  'templates/vorec-script.template.mjs',
]) {
  try {
    execFileSync('node', ['--check', file], { cwd: root, stdio: 'pipe' });
  } catch (error) {
    failures.push(`${file}: JavaScript syntax check failed\n${error.stderr?.toString() || error.message}`);
  }
}

try {
  execFileSync('node', ['scripts/validate-tracked-actions.mjs', 'examples/tracked-actions.sample.json'], { cwd: root, stdio: 'pipe' });
} catch (error) {
  failures.push(`examples/tracked-actions.sample.json: tracked-action validation failed\n${error.stderr?.toString() || error.message}`);
}

try {
  execFileSync('node', ['scripts/validate-live-site-map.mjs', 'examples/live-site-map.sample.json'], { cwd: root, stdio: 'pipe' });
} catch (error) {
  failures.push(`examples/live-site-map.sample.json: live-site map validation failed\n${error.stderr?.toString() || error.message}`);
}

const license = join(root, 'LICENSE');
check(existsSync(license) && statSync(license).isFile(), 'LICENSE: root MIT license is missing');

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Plugin validation passed.');
