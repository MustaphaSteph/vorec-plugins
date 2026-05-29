import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tmpRoot = join(root, '.vorec', 'smoke-template');
const outputDir = join(root, '.vorec', 'smoke-template', 'output');

rmSync(tmpRoot, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const templatePath = join(root, 'templates', 'vorec-script.template.mjs');
const template = readFileSync(templatePath, 'utf8');
if (template.includes('recordVideo') || template.includes('ffmpeg')) {
  throw new Error('Template must not use Playwright recordVideo or FFmpeg.');
}

execFileSync('node', [templatePath], { cwd: root, stdio: 'inherit' });

const manifestPath = join(root, '.vorec', 'PROJECT_SLUG', 'vorec.json');
if (!existsSync(manifestPath)) throw new Error(`Missing generated manifest: ${manifestPath}`);

JSON.parse(readFileSync(manifestPath, 'utf8'));
console.log(`Smoke test passed: ${manifestPath}`);
rmSync(join(root, '.vorec', 'PROJECT_SLUG'), { recursive: true, force: true });
