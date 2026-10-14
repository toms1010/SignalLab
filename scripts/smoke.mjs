/**
 * Smoke test: visits every route, exercises key interactions, and fails on
 * any console error, page error, or failed request.
 *
 * Run with:  node scripts/smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const VIEWPORTS = [
  { name: '320 small phone', width: 320, height: 720 },
  { name: '390 phone', width: 390, height: 844 },
  { name: '768 tablet', width: 768, height: 1024 },
  { name: '1440 desktop', width: 1440, height: 900 },
];

const problems = [];
const note = (route, kind, text) => problems.push(`[${route}] ${kind}: ${text}`);

/** Routes visited on every viewport. */
const CORE_ROUTES = ['/', '/module/1', '/lesson/m1-sampling', '/formulas', '/glossary', '/resources', '/paths', '/exercises', '/settings'];
/** Extra routes visited once, to keep runtime sane. */
const EXTRA_ROUTES = [
  '/my-resources',
  '/lesson/m1-snr-ber',
  '/lesson/m2-quantization',
  '/lesson/m2-companding-impl',
  '/lesson/m3-delta-modulation',
  '/lesson/m3-sigma-delta',
  '/lesson/m4-qam',
  '/lesson/m4-ofdm',
  '/lesson/m4-spread-spectrum',
  '/lesson/m4-modems',
  '/lesson/m5-am',
  '/lesson/m5-fm',
  '/lesson/m5-receiver',
  '/lesson/m6-crc',
  '/lesson/m6-hamming',
  '/lesson/m6-arq',
  '/lesson/m6-interleaving',
  '/lesson/m6-advanced',
  '/module/6',
  '/nope-does-not-exist',
];

// Prefer the Playwright-managed build; fall back to the system Chrome so the
// smoke test still runs on a machine where `playwright install` has not run.
let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
}

async function visit(page, route) {
  const res = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  if (!res || res.status() >= 400) {
    // A 404 route still renders the SPA shell; only flag real server failures.
    if (route !== '/nope-does-not-exist') note(route, 'http', `status ${res?.status()}`);
  }
  // Give canvas/scene effects a moment to run.
  await page.waitForTimeout(320);
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const viewportWidth = vp.width;
  const viewportHeight = vp.height;

  page.on('console', (msg) => {
    if (msg.type() === 'error') note(vp.name, 'console', msg.text().slice(0, 220));
  });
  page.on('pageerror', (err) => note(vp.name, 'pageerror', String(err).slice(0, 220)));

  for (const route of CORE_ROUTES) {
    await visit(page, route);

    /* --- no unintended horizontal overflow --- */
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      return { scrollW: de.scrollWidth, clientW: de.clientWidth };
    });
    if (overflow.scrollW > overflow.clientW + 1) {
      note(route, `layout ${vp.name}`, `horizontal overflow ${overflow.scrollW} > ${overflow.clientW}`);
    }

    /* --- the app actually rendered something, AND it is on screen ---
       A heading can exist in the DOM while sitting far below the fold; that
       happened once when the sidebar was not in the same flex row as the
       content, so both conditions are asserted. */
    const heading = await page.locator('h1').first().textContent().catch(() => null);
    if (!heading || heading.trim() === '') note(route, 'render', 'no <h1> rendered');

    const headingBox = await page.locator('h1').first().boundingBox().catch(() => null);
    if (headingBox) {
      if (headingBox.y > viewportHeight) {
        note(route, 'layout', `<h1> is below the fold at y=${Math.round(headingBox.y)} — content is not reaching the viewport`);
      }
      if (headingBox.x > viewportWidth) {
        note(route, 'layout', `<h1> is off-screen to the right at x=${Math.round(headingBox.x)}`);
      }
    }

    /* --- main content container must start near the top of the page --- */
    const mainBox = await page.locator('main#main-content').boundingBox().catch(() => null);
    if (mainBox && mainBox.y > 200) {
      note(route, 'layout', `main content starts at y=${Math.round(mainBox.y)} (expected near the top)`);
    }

    /* --- canvas labs must have actually painted something --- */
    const canvasCount = await page.locator('canvas').count();
    if (route.startsWith('/lesson/') && canvasCount === 0) {
      note(route, 'lab', 'lesson rendered without a visualisation canvas');
    }
    if (canvasCount > 0) {
      const painted = await page.evaluate(() => {
        const cs = [...document.querySelectorAll('canvas')];
        return cs.some((c) => c.width > 0 && c.height > 0);
      });
      if (!painted) note(route, 'lab', 'canvas elements present but none were sized');
    }
  }

  await context.close();
}

/* ---- one desktop context for the deeper interaction pass ---- */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && note('interaction', 'console', m.text().slice(0, 220)));
  page.on('pageerror', (e) => note('interaction', 'pageerror', String(e).slice(0, 220)));

  for (const route of EXTRA_ROUTES) await visit(page, route);

  // Quiz: answer all three questions, check scoring, then reload to test persistence.
  await visit(page, '/module/1');
  const options = page.locator('button[role="radio"]');
  for (let q = 0; q < 3; q++) {
    const n = await options.count();
    if (n === 0) break;
    await options.nth(1).click();
    const submit = page.getByRole('button', { name: /submit answer/i });
    if (await submit.count()) await submit.click();
    const nextBtn = page.getByRole('button', { name: /next question|see results/i });
    if (await nextBtn.count()) await nextBtn.click();
    await page.waitForTimeout(120);
  }
  const resultText = await page.locator('section').filter({ hasText: /Best score/i }).first().textContent().catch(() => null);
  if (!resultText || !/\d\/3/.test(resultText)) note('quiz', 'assert', 'score not displayed after completing 3 questions');
  else note('quiz', 'ok', `score shown: ${resultText.match(/\d\/3/)?.[0]}`);

  // Persistence across reload.
  await page.reload({ waitUntil: 'networkidle' });
  const persisted = await page.evaluate(() => localStorage.getItem('signallab.v1') ?? '');
  if (!persisted.includes('"quizzes"')) note('persistence', 'assert', 'quiz result not written to localStorage');
  else note('persistence', 'ok', 'quiz result persisted to localStorage');

  // Theme toggle.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.getByRole('button', { name: /switch to (light|dark) theme/i }).click();
  const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (before === after) note('theme', 'assert', 'theme toggle did not change data-theme');
  else note('theme', 'ok', `theme toggled ${before} → ${after}`);

  // Mobile drawer open/close.
  const context2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await context2.newPage();
  await p2.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await p2.getByRole('button', { name: /open navigation menu/i }).click();
  await p2.waitForTimeout(650);
  const drawerOpen = await p2.evaluate(() => {
    const el = document.querySelector('#lab-sidebar');
    return el ? el.getBoundingClientRect().left >= -1 : false;
  });
  if (!drawerOpen) note('drawer', 'assert', 'drawer did not open');
  await p2.keyboard.press('Escape');
  await p2.waitForTimeout(650);
  const drawerClosed = await p2.evaluate(() => {
    const el = document.querySelector('#lab-sidebar');
    return el ? el.getBoundingClientRect().right <= 2 : false;
  });
  if (!drawerClosed) note('drawer', 'assert', 'Escape did not close the drawer');
  else note('drawer', 'ok', 'drawer opens and closes via Escape');
  const ov2 = await p2.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  if (ov2.s > ov2.c + 1) note('drawer', 'layout', `overflow with drawer ${ov2.s} > ${ov2.c}`);
  await context2.close();

  await context.close();
}

await browser.close();

const oks = problems.filter((p) => /\bok:/.test(p));
const errors = problems.filter((p) => !/\bok:/.test(p));

console.log('\n=== PASS ===');
for (const o of oks) console.log('  ' + o);
console.log(`\n=== FAILURES (${errors.length}) ===`);
for (const e of errors) console.log('  ' + e);
console.log('');

process.exit(errors.length === 0 ? 0 : 1);