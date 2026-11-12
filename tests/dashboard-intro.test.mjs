// Dashboard intro tests. Run from tests/: `npm test` (or `node --test`).
// Every test runs twice: online, and offline (Typekit, Vimeo and analytics blocked).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const BLOCKED = ['use.typekit.net', 'p.typekit.net', 'player.vimeo.com', 'googletagmanager.com', 'google-analytics.com'];

let server;
let browser;

before(async () => {
  server = await startServer(SRC);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

async function open({ path: p = '/', seen = false, reduced = false, offline = false, viewport = { width: 1440, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  if (seen) await context.addInitScript(() => localStorage.setItem('omar_seen_intro', 'true'));
  if (offline) {
    await context.route(
      (url) => BLOCKED.some((h) => url.hostname === h || url.hostname.endsWith('.' + h)),
      (route) => route.abort()
    );
  }
  const page = await context.newPage();
  page.vw = viewport.width;
  page.vh = viewport.height;
  await page.goto(server.url + p);
  return page;
}
// The 3000ms hold starts when the page's fonts gate opens, not at navigation.
// Every timed wait counts from here.
async function introStart(page) {
  await page.waitForFunction(() => document.body.classList.contains('intro-active'), null, { timeout: 8000, polling: 50 });
}
async function until(page, fn, timeout) {
  await page.waitForFunction(fn, null, { timeout, polling: 50 });
}
async function done(page) {
  await page.context().close();
}

for (const offline of [false, true]) {
  const mode = offline ? 'offline' : 'online';
  describe(`[${mode}]`, { concurrency: 4 }, () => {
    test('baseline: first visit ends on the grid', async () => {
      const page = await open({ offline });
      try {
        await introStart(page);
        // Old exit hides the splash ~1.2s after the 3s hold; headless software
        // rendering stretches that, so poll to a deadline instead of sleeping.
        await until(page, () => getComputedStyle(document.getElementById('standoff-splash')).visibility === 'hidden', 8000);
        assert.equal(await page.evaluate(() => document.body.classList.contains('grid-active')), true);
      } finally {
        await done(page);
      }
    });
  });
}
