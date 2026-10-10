// Capture a website's current design for docs/design-inspiration.md:
// desktop + mobile full-page JPEGs and first-screen PNGs, the rendered HTML, and a
// scroll-through video (desktop-scroll.webm) so moving elements are kept too.
//
// Usage (playwright-core is not a site dependency, so install it without saving):
//   npm i --no-save playwright-core@1.47.2
//   node scripts/capture-inspiration.mjs https://axiom.co/ docs/design-inspiration/axiom/<YYYY-MM-DD>
// Add --no-video to skip the video (e.g. for secondary pages of a site).
// Uses the installed Google Chrome. A new capture goes in a new dated folder;
// never overwrite an earlier one.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs';

const args = process.argv.slice(2);
const noVideo = args.includes('--no-video');
const [url, out] = args.filter((a) => !a.startsWith('--'));
mkdirSync(out, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME });

// Heavy sites never go network-idle; fall back to a fixed wait after load.
async function open(page) {
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); }
  catch { await page.waitForTimeout(3000); }
}

async function dismissCookies(page) {
  // Cookie banners use buttons or links (Stripe: <a>); prefer declining.
  const b = page.locator('button, a, [role=button]')
    .filter({ hasText: /^\s*(Decline|Reject all|Accept)\s*$/ }).first();
  try { await b.click({ timeout: 4000 }); await page.waitForTimeout(500); } catch {}
}

async function scrollThrough(page, step = 400, wait = 250) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(wait);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
}

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await open(page);
  await dismissCookies(page);
  await scrollThrough(page);
  await dismissCookies(page); // some banners only appear after a delay
  await page.screenshot({ path: `${out}/${name}-full.jpg`, fullPage: true, quality: 85 });
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  if (name === 'desktop') writeFileSync(`${out}/page.html`, await page.content());
  await ctx.close();
}

if (noVideo) { await browser.close(); console.log('done'); process.exit(0); }

// Video: hero for a few seconds (moving elements), then a slow scroll down the page.
const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
const vpage = await vctx.newPage();
await open(vpage);
await dismissCookies(vpage);
await vpage.waitForTimeout(6000);
await dismissCookies(vpage);
const h = await vpage.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 60) {
  await vpage.evaluate((y) => window.scrollTo(0, y), y);
  await vpage.waitForTimeout(80);
}
await vpage.waitForTimeout(1500);
await vctx.close();
for (const f of readdirSync(out)) if (f.endsWith('.webm')) renameSync(`${out}/${f}`, `${out}/desktop-scroll.webm`);
await browser.close();
console.log('done');
