// Scene system tests (spec 2026-11-13-scene-system-design.md). Run from tests/: `npm test`.
// Every test runs twice: online, and offline (Typekit, Vimeo and analytics blocked).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src');
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

// Options:
//   seen: this browser session has already played the intro.
//   storageBlocked: localStorage and sessionStorage throw on access.
//   init: extra init scripts (functions) for the context.
//   time: ISO string; the page clock is fixed there before the first load.
async function open({ path: p = '/', seen = false, offline = false, storageBlocked = false, viewport = { width: 1440, height: 900 },
  timezoneId, time, routes = [], init = [], goto = true } = {}) {
  const context = await browser.newContext({ viewport, timezoneId });
  for (const [match, handler] of routes) await context.route(match, handler);
  if (offline) {
    await context.route(
      (url) => BLOCKED.some((h) => url.hostname === h || url.hostname.endsWith('.' + h)),
      (route) => route.abort()
    );
  }
  if (seen) await context.addInitScript(() => sessionStorage.setItem('omar_intro_session', '1'));
  if (storageBlocked) {
    await context.addInitScript(() => {
      for (const k of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(window, k, { configurable: true, get() { throw new DOMException('blocked', 'SecurityError'); } });
      }
    });
  }
  for (const fn of init) await context.addInitScript(fn);
  // Page-clock timestamps of the intro's state changes.
  await context.addInitScript(() => {
    window.__marks = {};
    const mark = (k) => { if (!(k in window.__marks)) window.__marks[k] = performance.now(); };
    new MutationObserver(() => {
      const h = document.documentElement.classList;
      if (document.body && document.body.classList.contains('intro-active')) mark('introStart');
      if (h.contains('dash-pushing')) mark('pushStart');
      if ('pushStart' in window.__marks && !h.contains('dash-pushing')) mark('pushEnd');
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.requested = [];
  page.on('request', (r) => page.requested.push(r.url()));
  if (time) await page.clock.setFixedTime(new Date(time));
  if (goto) await page.goto(server.url + p);
  return page;
}
async function introStart(page) {
  await page.waitForFunction(() => document.body.classList.contains('intro-active'), null, { timeout: 8000, polling: 50 });
}
async function landed(page) {
  await page.waitForFunction(() => 'pushEnd' in window.__marks, null, { timeout: 12000, polling: 50 });
}
async function css(page, sel, prop) {
  return page.evaluate(([sel, prop]) => getComputedStyle(document.querySelector(sel))[prop], [sel, prop]);
}
async function hasClass(page, sel, cls) {
  return page.evaluate(([sel, cls]) => document.querySelector(sel).classList.contains(cls), [sel, cls]);
}
const close = (page) => page.context().close();
const HEAD = 'HAVE TASTE. WILL TRAVEL.';
const LINES = ['ART BASEL. BASK RESPONSIBLY.', 'ART BASEL. BYO BANANA.', 'ART BASEL. NOD KNOWINGLY.',
               "ART BASEL. YES, IT'S ART.", 'ART BASEL. PARK IN FORT LAUDERDALE.'];
const IN_WINDOW = '2026-12-03T17:00:00Z';
async function headline(page) {
  return (await page.textContent('.dash-headline')).trim();
}

for (const offline of [false, true]) {
  const mode = offline ? 'offline' : 'online';
  describe(`[${mode}]`, { concurrency: 1 }, () => {
    // — Task 1: once per browser session —
    test('new session with omar_seen_intro already set: intro plays', async () => {
      const page = await open({ offline, init: [() => localStorage.setItem('omar_seen_intro', 'true')] });
      try {
        assert.equal(await hasClass(page, 'html', 'dash-first'), true);
      } finally { await close(page); }
    });

    test('same session, back to home: intro skipped', async () => {
      const page = await open({ offline });
      try {
        await page.waitForFunction(() => document.body.classList.contains('grid-active'));
        await page.goto(server.url + '/about.html');
        await page.goto(server.url + '/');
        assert.equal(await hasClass(page, 'html', 'dash-first'), false);
        assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
      } finally { await close(page); }
    });

    test('storage blocked: intro plays and lands, no page errors', async () => {
      const page = await open({ offline, storageBlocked: true });
      try {
        assert.equal(await hasClass(page, 'html', 'dash-first'), true);
        await introStart(page);
        await page.waitForTimeout(6600);
        assert.deepEqual(page.errors, []);
        assert.equal(await css(page, '#portal', 'transform'), 'none');
      } finally { await close(page); }
    });

    // — Task 2: scenes, banners and the pick —
    const atTime = (iso, check, extra = {}) => async () => {
      const page = await open({ offline, time: iso, ...extra });
      try { await check(page); } finally { await close(page); }
    };
    const headlineIs = (want) => async (page) => assert.equal(await headline(page), want);
    const headlineIn = (list) => async (page) => assert.ok(list.includes(await headline(page)), await headline(page));

    test('before the window (Nov 29 23:30 Miami): headline', atTime('2026-11-30T04:30:00Z', headlineIs(HEAD)));
    test('window opens (Nov 30 00:30 Miami): an Art Basel line', atTime('2026-11-30T05:30:00Z', headlineIn(LINES)));
    test('last minutes (Dec 6 23:30 Miami): an Art Basel line', atTime('2026-12-07T04:30:00Z', headlineIn(LINES)));
    test('after the window (Dec 7 00:30 Miami): headline', atTime('2026-12-07T05:30:00Z', headlineIs(HEAD)));
    test('visitor in Tokyo at Dec 6 23:30 Miami: still an Art Basel line',
      atTime('2026-12-07T04:30:00Z', headlineIn(LINES), { timezoneId: 'Asia/Tokyo' }));

    test('scene and line are recorded', atTime(IN_WINDOW, async (page) => {
      assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), 'miami-beach');
      const stored = await page.evaluate(() => [localStorage.getItem('omar_last_scene'), localStorage.getItem('omar_last_line')]);
      assert.deepEqual(stored, ['miami-beach', await headline(page)]);
    }));

    test('two intros running never repeat a line', async () => {
      const page = await open({ offline, time: IN_WINDOW });
      try {
        const seen = [await headline(page)];
        for (let i = 0; i < 10; i++) {
          await page.evaluate(() => sessionStorage.removeItem('omar_intro_session'));
          await page.goto(server.url + '/');
          seen.push(await headline(page));
        }
        for (let i = 1; i < seen.length; i++) {
          assert.ok(LINES.includes(seen[i]), seen[i]);
          assert.notEqual(seen[i], seen[i - 1], `intro ${i} repeated "${seen[i]}"`);
        }
      } finally { await close(page); }
    });

    test('pure functions', async () => {
      const page = await open({ offline, seen: true });
      try {
        const r = await page.evaluate(() => {
          const D = window.DashIntro;
          const a = { id: 'a', timezone: 'America/New_York' };
          const b = { id: 'b', timezone: 'Asia/Tokyo' };
          const now = new Date('2026-12-03T17:00:00Z');
          const one = { scene: 'a', start: '2026-12-01', end: '2026-12-05', lines: ['one'] };
          const two = { scene: 'a', start: '2026-12-02', end: '2026-12-04', lines: ['two'] };
          return {
            tz: D.localDate(new Date('2026-12-07T04:30:00Z'), 'America/New_York'),
            tzTokyo: D.localDate(new Date('2026-12-07T04:30:00Z'), 'Asia/Tokyo'),
            otherScene: D.pickScene([a, b], 'a', () => 0).id,
            onlyScene: D.pickScene([a], 'a', () => 0).id,
            noScene: D.pickScene([], null, () => 0),
            overlap: D.liveBanner([one, two], a, now).lines[0],
            overlapReversed: D.liveBanner([two, one], a, now).lines[0],
            emptyLines: D.liveBanner([{ scene: 'a', start: '2026-12-01', end: '2026-12-05', lines: [] }], a, now),
            noLines: D.liveBanner([{ scene: 'a', start: '2026-12-01', end: '2026-12-05' }], a, now),
            unknownScene: D.liveBanner([{ scene: 'zz', start: '2026-12-01', end: '2026-12-05', lines: ['x'] }], a, now),
            notArray: D.liveBanner(null, a, now),
            onlyLine: D.pickLine(['x'], 'x', () => 0),
            otherLine: D.pickLine(['x', 'y'], 'x', () => 0),
            def: D.DEFAULT_LINE,
          };
        });
        assert.deepEqual(r, {
          tz: '2026-12-06', tzTokyo: '2026-12-07', otherScene: 'b', onlyScene: 'a', noScene: null,
          overlap: 'two', overlapReversed: 'two', emptyLines: null, noLines: null, unknownScene: null, notArray: null,
          onlyLine: 'x', otherLine: 'y', def: HEAD,
        });
      } finally { await close(page); }
    });

    test('scenes file blocked: headline, drawn scene, no page errors', async () => {
      const page = await open({ offline, time: IN_WINDOW, routes: [['**/dashboard-scenes.js*', (r) => r.abort()]] });
      try {
        assert.equal(await headline(page), HEAD);
        assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), null);
        await introStart(page);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    test('malformed scenes file: headline, no page errors', async () => {
      const body = 'window.DashScenes = { scenes: [{ id: "miami-beach", timezone: "Not/AZone" }], banners: [{ scene: "miami-beach", start: "2026-11-30", end: "2026-12-06", lines: "oops" }, null] };';
      const page = await open({ offline, time: IN_WINDOW,
        routes: [['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })]] });
      try {
        assert.equal(await headline(page), HEAD);
        await introStart(page);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    // Online only: offline, Typekit is blocked and the fallback font sets this
    // line about 380px wide, so it can never sit fully inside 390px. Visitors
    // see the real font (the page waits for it), where the line is ~284px.
    test('longest line fully in view at 390x844 at some point in the hold', { skip: offline && 'needs the real font' }, async () => {
      const page = await open({ offline, time: IN_WINDOW, viewport: { width: 390, height: 844 },
        init: [() => { Math.random = () => 0.9; }] });
      try {
        assert.equal(await headline(page), LINES[4]);
        await introStart(page);
        const samples = [];
        for (let i = 0; i < 20; i++) {
          samples.push(await page.evaluate(() => {
            const r = document.querySelector('.dash-headline').getBoundingClientRect();
            return { left: r.left, right: r.right };
          }));
          await page.waitForTimeout(250);
        }
        assert.ok(samples.some((r) => r.left >= 0 && r.right <= 390), JSON.stringify(samples));
      } finally { await close(page); }
    });
  });
}
