import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:4173';
mkdirSync('shots', { recursive: true });
let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); }

const shots = [
  ['dashboard-dark', '/', 1440, 900, 'dark'],
  ['dashboard-light', '/', 1440, 900, 'light'],
  ['lesson-sampling', '/lesson/m1-sampling', 1440, 980, 'dark'],
  ['lesson-quantizer', '/lesson/m2-quantization', 1440, 980, 'dark'],
  ['module-quiz', '/module/1', 1440, 980, 'dark'],
  ['formulas', '/formulas', 1440, 900, 'dark'],
  ['resources', '/resources', 1440, 900, 'dark'],
  ['hamming', '/lesson/m6-hamming', 1440, 900, 'dark'],
  ['mobile-lesson', '/lesson/m1-sampling', 390, 844, 'dark'],
  ['mobile-dash', '/', 390, 844, 'dark'],
  ['small-formulas', '/formulas', 320, 700, 'light'],
];
for (const [name, route, w, h, theme] of shots) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    const k = 'signallab.v1';
    const raw = localStorage.getItem(k);
    const parsed = raw ? JSON.parse(raw) : { v: 1, lessons: {}, quizzes: {}, resources: {}, exercises: {}, prefs: {}, viz: {}, path: null, lastLesson: null, recent: [] };
    parsed.prefs = { ...(parsed.prefs ?? {}), theme: t };
    localStorage.setItem(k, JSON.stringify(parsed));
  }, theme);
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/${name}.png` });
  await ctx.close();
  console.log('shot', name);
}
await browser.close();
