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
  });
}
