// vorec-script.mjs - standalone Node.js recording script template.
// Replace PROJECT_SLUG, TARGET_URL, STYLE, QUALITY, and the example flow.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const OUTPUT_DIR = '.vorec/PROJECT_SLUG';
const TARGET_URL = 'TARGET_URL';
const QUALITY = '1080p'; // '1080p', '2k', or '4k'
const STYLE = 'tutorial';

mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const storageState = existsSync('.vorec/storageState.json') ? '.vorec/storageState.json' : undefined;
const context = await browser.newContext({
  ...(storageState ? { storageState } : {}),
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: {
    dir: OUTPUT_DIR,
    size: { width: 1920, height: 1080 },
  },
});

const page = await context.newPage();
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'smooth';
});

const VP = { w: 1920, h: 1080 };
const __actions = [];
const T0 = Date.now();

const track = (type, name, description, target, coords, extra = {}) => {
  __actions.push({
    type,
    name,
    description,
    target,
    timestamp: +((Date.now() - T0) / 1000).toFixed(2),
    coordinates: coords || { x: 500, y: 500 },
    ...extra,
  });
};

const toCoords = (box) => box ? {
  x: Math.round(((box.x + box.width / 2) / VP.w) * 1000),
  y: Math.round(((box.y + box.height / 2) / VP.h) * 1000),
} : { x: 500, y: 500 };

const TYPING_DELAY = {
  exact: 50,
  concise: 60,
  tutorial: 80,
  professional: 80,
  conversational: 100,
  storytelling: 100,
  academic: 100,
  persuasive: 80,
}[STYLE] || 80;

const pauseFor = (narration) =>
  Math.max(1500, Math.ceil((narration || '').split(/\s+/).filter(Boolean).length * 350) + 500);

const retry = async (fn, label, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) {
        const path = `${OUTPUT_DIR}/error-${label.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-${Date.now()}.png`;
        await page.screenshot({ path, fullPage: true });
        throw new Error(`${label} failed after ${maxAttempts} attempts: ${err.message}. Screenshot: ${path}`);
      }
      await page.waitForTimeout(1000 * attempt);
    }
  }
};

const scrollToElement = async (locator, name, description) => {
  const box = await locator.boundingBox();
  if (box && box.y >= 0 && box.y + box.height <= VP.h) return;

  await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
    const distance = targetY - window.scrollY;
    const steps = 20;
    const stepY = distance / steps;
    let i = 0;
    return new Promise((resolve) => {
      const tick = () => {
        if (i++ >= steps) return resolve();
        window.scrollBy(0, stepY);
        requestAnimationFrame(tick);
      };
      tick();
    });
  });
  await page.waitForTimeout(400);

  if (name) {
    const narration = description || name;
    track('scroll', name, description || name, null, toCoords(await locator.boundingBox()), {
      context: description || name,
      narration,
      pause: pauseFor(narration),
    });
  }
};

const glideMove = async (locator) => {
  await scrollToElement(locator, null, null);
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 35 });
  await page.waitForTimeout(500);
  return box;
};

const glideClick = async (locator, name, description, target, contextText, narration, pauseMs) => {
  if (typeof pauseMs !== 'number') throw new Error('pauseMs required - calculate from narration word count');
  await retry(async () => {
    const box = await glideMove(locator);
    if (await page.evaluate(() => !!window.__vc?.clickPulse)) {
      await page.evaluate(() => window.__vc.clickPulse());
      await page.waitForTimeout(120);
    }
    track('click', name, description, target, toCoords(box), { context: contextText, narration, pause: pauseMs });
    await locator.click();
  }, name);
  await page.waitForTimeout(pauseMs);
};

const slowType = async (locator, text, name, description, target, contextText, narration, pauseMs) => {
  if (typeof pauseMs !== 'number') throw new Error('pauseMs required - calculate from narration word count');
  const box = await glideMove(locator);
  await locator.click();
  await page.waitForTimeout(300);
  track('type', name, description, target, toCoords(box), {
    context: contextText,
    narration,
    typed_text: text,
    pause: pauseMs,
  });
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: TYPING_DELAY + Math.random() * (TYPING_DELAY * 0.5) });
  }
  await page.waitForTimeout(pauseMs);
};

const hoverTour = async (locator, name, description, narration, pauseMs) => {
  if (typeof pauseMs !== 'number') throw new Error('pauseMs required - calculate from narration word count');
  const box = await glideMove(locator);
  track('narrate', name, description, null, toCoords(box), {
    context: description,
    narration,
    pause: pauseMs,
  });
  await page.waitForTimeout(pauseMs);
};

const assertHealthyEndState = async () => {
  const alerts = await page.locator('[role="alert"], [aria-invalid="true"]').count();
  const errorText = await page.getByText(/error|invalid|required|fix|must|failed/i).count();
  if (alerts > 0 || errorText > 0) {
    throw new Error('End state shows validation errors - fix the flow and re-record.');
  }
};

try {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  const intro = "Here's the page we'll be working with.";
  track('narrate', 'Intro', 'Recording starts', 'intro', { x: 500, y: 500 }, {
    context: 'The page loads showing the main content.',
    narration: intro,
    pause: pauseFor(intro),
  });
  await page.waitForTimeout(pauseFor(intro));

  // Replace this example flow with the approved recording plan.
  const emailField = page.getByPlaceholder('you@example.com');
  const n1 = "This is where the account email goes.";
  await hoverTour(emailField, 'Email field', 'Hover the email input', n1, pauseFor(n1));

  const n2 = "Enter your email - this becomes the account login.";
  await slowType(
    emailField,
    'sarah.demo@gmail.com',
    'Enter email',
    'Type email address',
    'email',
    'The email field is focused. The viewer should use their own email address here.',
    n2,
    pauseFor(n2),
  );

  const n3 = "Click Submit. The account is created.";
  await glideClick(
    page.getByRole('button', { name: 'Submit' }),
    'Submit',
    'Click submit to create account',
    'submit',
    'The signup fields are complete. Submitting creates the account and moves to the success state.',
    n3,
    pauseFor(n3),
  );
  __actions[__actions.length - 1].primary = true;

  await assertHealthyEndState();

  const nFinal = "And that's it - the task is done.";
  track('narrate', 'Complete', 'Flow complete', null, { x: 500, y: 500 }, {
    context: 'The flow is complete. The user has successfully finished the task.',
    narration: nFinal,
    pause: pauseFor(nFinal),
  });
  await page.waitForTimeout(pauseFor(nFinal));
} catch (err) {
  const path = `${OUTPUT_DIR}/error-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true }).catch(() => {});
  throw new Error(`${err.message}. Screenshot: ${path}`);
} finally {
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  )).catch(() => {});
  await page.waitForTimeout(500).catch(() => {});
}

const rawVideo = `${OUTPUT_DIR}/raw.webm`;
await page.close();
await page.video().saveAs(rawVideo);
await browser.close();

const SIZES = { '4k': '3840:2160', '2k': '2560:1440', '1080p': null };
const targetSize = SIZES[QUALITY];
const watermark = "drawtext=text='vorec.ai':fontcolor=white@0.7:fontsize=h/32:x=w-tw-30:y=h-th-30:box=1:boxcolor=black@0.35:boxborderw=10";
const filterParts = [];
if (targetSize) filterParts.push(`scale=${targetSize}:flags=lanczos`);
filterParts.push(watermark);
const vf = `-vf "${filterParts.join(',')}"`;

execSync(`ffmpeg -y -i "${rawVideo}" \
  ${vf} \
  -c:v libx264 -preset slow -crf 18 -tune animation \
  -pix_fmt yuv420p -movflags +faststart \
  "${OUTPUT_DIR}/output.mp4"`, { stdio: 'pipe' });
execSync(`rm "${rawVideo}"`);

const probe = execSync(
  `ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUTPUT_DIR}/output.mp4"`,
  { encoding: 'utf8' },
);
const videoDuration = parseFloat(probe.trim());
const lastAction = __actions[__actions.length - 1]?.timestamp || 0;
if (videoDuration > 0 && lastAction > 0) {
  const scale = (videoDuration - 1) / lastAction;
  for (const action of __actions) action.timestamp = +(action.timestamp * scale).toFixed(2);
}

writeFileSync(`${OUTPUT_DIR}/tracked-actions.json`, JSON.stringify(__actions, null, 2));
console.log(`${__actions.length} actions tracked -> ${OUTPUT_DIR}/tracked-actions.json`);
console.log(`Recording saved -> ${OUTPUT_DIR}/output.mp4`);
