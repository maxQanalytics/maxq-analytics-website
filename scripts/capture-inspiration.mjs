// Capture a website's current design for docs/design-inspiration.md:
// desktop + mobile full-page JPEGs and first-screen PNGs, the rendered HTML, and a
// video (desktop-sections.webm) that stops 4 seconds at every section of the
// page, so moving elements are kept too.
//
// Usage (playwright-core is not a site dependency, so install it without saving):
//   npm i --no-save playwright-core@1.47.2
//   node scripts/capture-inspiration.mjs https://axiom.co/ docs/design-inspiration/axiom/<YYYY-MM-DD>
// Add --no-video to skip the video (e.g. for secondary pages of a site), or
// --video-only to record just the video into an existing capture folder.
// Uses the installed Google Chrome. A new capture goes in a new dated folder;
// never overwrite an earlier one.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';

const args = process.argv.slice(2);
const noVideo = args.includes('--no-video');
const videoOnly = args.includes('--video-only');
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

for (const [name, opts] of videoOnly ? [] : [
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

// Video: stop SECTION_PAUSE ms at every section, with a smooth scroll in between.
const SECTION_PAUSE = 4000;
const NAV_OFFSET = 80; // keep a section's top edge clear of a sticky nav

// Tops of the page's sections: <section> elements and the children of <main>
// that are at least half the viewport wide and 250 px tall. Recomputed at
// every stop, because lazy-loaded content changes the page height.
const sectionTops = (p) => p.evaluate(() => {
  const els = document.querySelectorAll('section, main > *, body > div > main > *');
  const tops = [...els]
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.height >= 250 && r.width >= innerWidth / 2)
    .map((r) => Math.round(r.top + scrollY))
    .sort((a, b) => a - b);
  return tops.filter((t, i) => i === 0 || t - tops[i - 1] > 200);
});

const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
const vpage = await vctx.newPage();
await open(vpage);
await dismissCookies(vpage);
await vpage.waitForTimeout(SECTION_PAUSE);
await dismissCookies(vpage);
let y = 0;
for (let stops = 0; stops < 60; stops++) {
  const maxY = await vpage.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  if (y >= maxY - 5) break;
  const tops = await sectionTops(vpage);
  // Next section below the current position; without detectable sections,
  // fall back to steps of 85% of the viewport.
  const next = tops.map((t) => t - NAV_OFFSET).find((t) => t > y + 150) ?? y + 765;
  const target = Math.min(next, maxY);
  await vpage.evaluate((t) => window.scrollTo({ top: t, behavior: 'smooth' }), target);
  await vpage.waitForTimeout(1200 + SECTION_PAUSE);
  y = await vpage.evaluate(() => scrollY);
  if (y < target - 5) y = target; // smooth scroll hijacked or clamped; move on anyway
}
const raw = await vpage.video().path();
await vctx.close();
renameSync(raw, `${out}/desktop-sections.webm`);
await browser.close();
console.log('done');
