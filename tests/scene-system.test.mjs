// Scene system tests (spec 2026-11-13-scene-system-design.md). Run from tests/: `npm test`.
// Every test runs twice: online, and offline (Typekit, Vimeo and analytics blocked).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { startServer } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src');
const FIXTURES = path.join(HERE, 'fixtures');
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
async function open({ path: p = '/', seen = false, offline = false, storageBlocked = false, viewport = { width: 1440, height: 900 },
  routes = [], init = [], goto = true } = {}) {
  const context = await browser.newContext({ viewport });
  for (const m of ['**/assets/dash/cockpit-*', '**/assets/dash/doll-*']) await context.route(m, (r) => r.fulfill({ status: 404, body: 'not found' }));
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
// Routes for a page whose scenes file holds just this scene.
// Media under test-media/ come from tests/fixtures/ (clip-small.mp4 is clip.mp4);
// any other name there is a 404.
function withScene(scene, { delayMs = 0 } = {}) {
  const body = `window.DashScenes = { scenes: [${JSON.stringify({ id: 'test-scene', ...scene })}] };`;
  return [
    ['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })],
    ['**/test-media/**', async (r) => {
      const name = path.basename(new URL(r.request().url()).pathname).replace('clip-small', 'clip');
      if (delayMs) await new Promise((d) => setTimeout(d, delayMs));
      try {
        const buf = await fs.readFile(path.join(FIXTURES, name));
        await r.fulfill({ body: buf, contentType: name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg' });
      } catch {
        await r.fulfill({ status: 404, body: 'not found' });
      }
    }],
  ];
}
const STILL = 'test-media/still.jpg';
const CLIP = 'test-media/clip.mp4';
// State of the windshield at the moment the page stops being dark.
const firstShown = () => {
  let sawLoading = false;
  new MutationObserver((_, obs) => {
    const h = document.documentElement;
    if (h.classList.contains('dash-loading')) { sawLoading = true; return; }
    if (!sawLoading) return;
    const still = document.getElementById('dash-still');
    window.__firstShown = {
      stillReady: still.complete && still.naturalWidth > 0 && !still.hidden,
      drawn: getComputedStyle(document.getElementById('dash-drawn')).display,
    };
    obs.disconnect();
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
};
const media = (page) => page.requested.filter((u) => /test-media/.test(u));

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
        await page.keyboard.press('Escape');
        await landed(page);
        assert.deepEqual(page.errors, []);
        assert.equal(await css(page, '#portal', 'transform'), 'none');
      } finally { await close(page); }
    });

    // — Task 2: scenes and the pick —
    test('scene is recorded, and no banner line', async () => {
      const page = await open({ offline });
      try {
        assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), 'miami-beach');
        const stored = await page.evaluate(() => [localStorage.getItem('omar_last_scene'), localStorage.getItem('omar_last_line')]);
        assert.deepEqual(stored, ['miami-beach', null]);
      } finally { await close(page); }
    });

    test('pure functions', async () => {
      const page = await open({ offline, seen: true });
      try {
        const r = await page.evaluate(() => {
          const D = window.DashIntro;
          const a = { id: 'a' };
          const b = { id: 'b' };
          return {
            otherScene: D.pickScene([a, b], 'a', () => 0).id,
            onlyScene: D.pickScene([a], 'a', () => 0).id,
            noScene: D.pickScene([], null, () => 0),
          };
        });
        assert.deepEqual(r, { otherScene: 'b', onlyScene: 'a', noScene: null });
      } finally { await close(page); }
    });

    test('no banner and no mirror gag: not in the scenes file, not on DashIntro', async () => {
      const page = await open({ offline, seen: true });
      try {
        const r = await page.evaluate(() => {
          const D = window.DashIntro;
          const S = window.DashScenes;
          const picked = D.applyScene();
          window.DashScenes = undefined;
          const none = D.applyScene();
          return {
            gone: ['liveBanner', 'pickLine', 'localDate', 'DEFAULT_LINE'].filter((k) => k in D),
            banners: 'banners' in S,
            mirror: S.scenes.filter((s) => 'mirror' in s).map((s) => s.id),
            picked, none,
          };
        });
        assert.deepEqual(r, { gone: [], banners: false, mirror: [], picked: { sceneId: 'miami-beach' }, none: { sceneId: null } });
      } finally { await close(page); }
    });

    test('scenes file blocked: drawn scene, no page errors', async () => {
      const page = await open({ offline, routes: [['**/dashboard-scenes.js*', (r) => r.abort()]] });
      try {
        assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), null);
        await introStart(page);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    test('malformed scenes file: no page errors', async () => {
      const body = 'window.DashScenes = { scenes: [null, { id: 42 }, { id: "miami-beach", still: 7, minimap: {} }] };';
      const page = await open({ offline,
        routes: [['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })]] });
      try {
        await introStart(page);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    // — Task 3: still and clip under the windshield —
    test('no still: #dash-drawn is rendered, no still or clip requested', async () => {
      // Pinned to a still-less scene: the default scene has its real still since Task 7.
      const page = await open({ offline, routes: withScene({}) });
      try {
        await introStart(page);
        assert.notEqual(await css(page, '#dash-drawn', 'display'), 'none');
        assert.equal(await page.getAttribute('#dash-still', 'src'), null);
        assert.equal(await page.getAttribute('#dash-clip', 'src'), null);
        assert.equal(await page.evaluate(() => document.getElementById('dash-still').hidden && document.getElementById('dash-clip').hidden), true);
      } finally { await close(page); }
    });

    test('still: visible on the first shown frame, #dash-drawn display none', async () => {
      const page = await open({ offline, routes: withScene({ still: STILL }, { delayMs: 800 }), init: [firstShown] });
      try {
        await introStart(page);
        assert.deepEqual(await page.evaluate(() => window.__firstShown), { stillReady: true, drawn: 'none' });
        assert.equal(await hasClass(page, '#dash-shield', 'dash-has-still'), true);
        // Pillars, roof and hood stay drawn over the still.
        const frame = await page.evaluate(() => [...document.querySelectorAll('.dash-sky > :not(defs):not(#dash-drawn)')]
          .filter((el) => getComputedStyle(el).display !== 'none').length);
        assert.ok(frame >= 6, `frame parts showing: ${frame}`);
      } finally { await close(page); }
    });

    test('still 404: #dash-drawn stays rendered, no page errors', async () => {
      const page = await open({ offline, routes: withScene({ still: 'test-media/missing.jpg', clip: CLIP }) });
      try {
        await introStart(page);
        await page.waitForTimeout(500);
        assert.notEqual(await css(page, '#dash-drawn', 'display'), 'none');
        assert.equal(await hasClass(page, '#dash-shield', 'dash-has-still'), false);
        assert.equal(await page.evaluate(() => document.getElementById('dash-still').hidden), true);
        assert.deepEqual(media(page).filter((u) => /clip/.test(u)), []);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    test('clip: plays once, ended or paused at the end, never loops', async () => {
      const page = await open({ offline, routes: withScene({ still: STILL, clip: CLIP }) });
      try {
        await introStart(page);
        await page.waitForFunction(() => document.getElementById('dash-clip').ended, null, { timeout: 4000, polling: 50 });
        const v = await page.evaluate(() => {
          const el = document.getElementById('dash-clip');
          return { loop: el.loop, hidden: el.hidden, played: el.played.length, atEnd: el.currentTime >= el.duration - 0.05, src: el.currentSrc };
        });
        assert.equal(v.loop, false);
        assert.equal(v.hidden, false);
        assert.equal(v.played, 1);
        assert.equal(v.atEnd, true);
        assert.match(v.src, /test-media\/clip\.mp4$/);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    test('clip 404: still stays, intro lands', async () => {
      const page = await open({ offline, routes: withScene({ still: STILL, clip: 'test-media/missing.mp4' }) });
      try {
        await introStart(page);
        await page.waitForFunction(() => document.getElementById('dash-clip').getAttribute('src') === null
          && performance.now() - window.__marks.introStart > 1000, null, { timeout: 4000, polling: 50 });
        await page.keyboard.press('Escape');
        await landed(page);
        const m = await page.evaluate(() => window.__marks);
        assert.ok(m.pushEnd - m.pushStart <= 1400, `push-in ${(m.pushEnd - m.pushStart).toFixed(0)}ms`);
        assert.equal(await page.evaluate(() => document.getElementById('dash-clip').hidden), true);
        assert.equal(await hasClass(page, '#dash-shield', 'dash-has-still'), true);
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });

    test('skipped intro (session key set) requests neither still nor clip', async () => {
      const page = await open({ offline, seen: true, routes: withScene({ still: STILL, clip: CLIP }) });
      try {
        await page.waitForFunction(() => document.body.classList.contains('grid-active'));
        await page.waitForTimeout(1500);
        assert.deepEqual(media(page), []);
      } finally { await close(page); }
    });

    test('phone uses clipSmall', async () => {
      const page = await open({ offline, viewport: { width: 390, height: 844 },
        routes: withScene({ still: STILL, clip: CLIP, clipSmall: 'test-media/clip-small.mp4' }) });
      try {
        await introStart(page);
        await page.waitForFunction(() => !document.getElementById('dash-clip').hidden, null, { timeout: 4000, polling: 50 });
        assert.match(await page.evaluate(() => document.getElementById('dash-clip').currentSrc), /clip-small\.mp4$/);
        assert.deepEqual(media(page).filter((u) => /clip\.mp4$/.test(u)), []);
      } finally { await close(page); }
    });

    // — Task 4: Miami Beach minimap —
    test('miami-beach: minimap strip is the scene file and has loaded, with the arrow', async () => {
      const page = await open({ offline });
      try {
        await introStart(page);
        assert.match(await page.getAttribute('.dash-minimap img.dash-minimap-strip', 'src'), /miami-beach\/minimap-strip\.svg$/);
        assert.ok(await page.evaluate(() => [...document.querySelectorAll('.dash-minimap img')].every((i) => i.naturalWidth > 0)));
        assert.equal(await page.locator('.dash-minimap img').count(), 2);
        assert.notEqual(await css(page, '.dash-minimap img.dash-minimap-strip', 'display'), 'none');
        assert.equal(await page.locator('.dash-minimap svg').count(), 0);
      } finally { await close(page); }
    });

    test('minimap strip 404: inline minimap still shown', async () => {
      const page = await open({ offline, routes: [['**/scenes/miami-beach/minimap-strip.svg', (r) => r.fulfill({ status: 404, body: 'not found' })]] });
      try {
        await introStart(page);
        await page.waitForTimeout(300);
        assert.equal(await page.locator('.dash-minimap img').count(), 0);
        assert.equal(await css(page, '.dash-minimap svg', 'display'), 'block');
        assert.deepEqual(page.errors, []);
      } finally { await close(page); }
    });
  });
}
