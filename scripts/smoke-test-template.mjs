import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tmpRoot = join(root, '.vorec', 'smoke-template');
const fixtureDir = join(tmpRoot, 'fixture');
const outputSlug = 'smoke-template/output';
const outputDir = join(root, '.vorec', outputSlug);
const generatedScript = join(tmpRoot, 'vorec-script.mjs');

const commandExists = (command, args = ['--version']) => {
  try {
    execFileSync(command, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

try {
  await import('playwright');
} catch {
  console.log('Smoke test skipped: Playwright package is not installed in this repo.');
  process.exit(0);
}

if (!commandExists('ffmpeg', ['-version']) || !commandExists('ffprobe', ['-version'])) {
  console.log('Smoke test skipped: ffmpeg/ffprobe are not available.');
  process.exit(0);
}

rmSync(tmpRoot, { recursive: true, force: true });
mkdirSync(fixtureDir, { recursive: true });
mkdirSync(outputDir, { recursive: true });

const htmlPath = join(fixtureDir, 'index.html');
writeFileSync(htmlPath, `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Vorec Smoke Test</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 80px; }
      form { display: grid; gap: 16px; width: 360px; }
      input, button { font-size: 18px; padding: 12px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Create account</h1>
      <form id="signup">
        <label>Email <input placeholder="you@example.com" type="email" required></label>
        <button type="submit">Submit</button>
      </form>
      <section id="result" aria-live="polite"></section>
    </main>
    <script>
      document.getElementById('signup').addEventListener('submit', (event) => {
        event.preventDefault();
        document.getElementById('result').innerHTML = '<h2>Success</h2><p>Account created.</p>';
      });
    </script>
  </body>
</html>
`);

const targetUrl = pathToFileURL(htmlPath).href;
const template = readFileSync(join(root, 'templates', 'vorec-script.template.mjs'), 'utf8');
const script = template
  .replace("const OUTPUT_DIR = '.vorec/PROJECT_SLUG';", `const OUTPUT_DIR = '.vorec/${outputSlug}';`)
  .replace("const TARGET_URL = 'TARGET_URL';", `const TARGET_URL = ${JSON.stringify(targetUrl)};`)
  .replace("const QUALITY = '1080p';", "const QUALITY = '1080p';")
  .replace("await assertHealthyEndState();", "await page.getByRole('heading', { name: 'Success' }).waitFor({ timeout: 5000 });\n  await assertHealthyEndState();");

writeFileSync(generatedScript, script);

execFileSync('node', [generatedScript], { cwd: root, stdio: 'inherit' });

const outputVideo = join(outputDir, 'output.mp4');
const actions = join(outputDir, 'tracked-actions.json');
if (!existsSync(outputVideo)) throw new Error(`Missing smoke-test video: ${outputVideo}`);
if (!existsSync(actions)) throw new Error(`Missing smoke-test tracked actions: ${actions}`);

execFileSync('node', ['scripts/validate-tracked-actions.mjs', actions], { cwd: root, stdio: 'inherit' });
console.log(`Smoke test passed: ${outputVideo}`);
