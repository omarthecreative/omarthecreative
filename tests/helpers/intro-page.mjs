// Shared helpers for the intro's test files (intro-input, cockpit-motion, doll-follow).
// Modelled on the helpers at the top of rendered-cockpit.test.mjs. The three older test
// files keep their own copies.
//
// Use:
//   import { start, stop, open, done, ... } from './helpers/intro-page.mjs';
//   before(start); after(stop);
//   const page = await open({ viewport: { width: 1440, height: 900 } });
//   await mounted(page); await enter(page, 'Escape'); await landed(page);
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from '../serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SRC = path.join(HERE, '..', '..', 'src');
export const FIXTURES = path.join(HERE, '..', 'fixtures');
// Typekit, Vimeo and analytics are blocked, so the font gate opens quickly and offline.
export const BLOCKED = ['use.typekit.net', 'p.typekit.net', 'player.vimeo.com', 'googletagmanager.com', 'google-analytics.com'];

let server = null;
let browser = null;

// Start the static server for src/ and Chromium. Call from before().
export async function start() {
  server = await startServer(SRC);
  browser = await chromium.launch();
  // The first AudioContext in a browser run starts the audio service (400-700ms). Start it
  // now, or it lands on the first push-in of the run (ApexSound.init runs there).
  const warm = await browser.newPage();
  await warm.evaluate(() => new AudioContext().close());
  await warm.close();
}
// Close both. Call from after().
export async function stop() {
  await browser?.close();
  await server?.close();
  browser = null;
  server = null;
}
// The running server's base URL, e.g. http://127.0.0.1:54321
export const serverUrl = () => server.url;

// Open the home page in a fresh context.
// Options:
//   viewport  { width, height }, default 1440 x 900
//   path      default '/'
//   seen      this browser session has already played the intro
//   reduced   prefers-reduced-motion: reduce
//   drawn     the cockpit and doll pictures answer 404: the drawn dashboard
//   touch     the context has a touch screen (needed by enter 'tap' and 'swipe')
//   routes    [[match, handler], ...] added before the page loads
//   init      extra init scripts (functions)
// The page gets: vw, vh, errors (page errors), requested (every request URL), and
// window.__marks in the page: page-clock times of introStart, mounted, pushStart, pushEnd.
export async function open({ viewport = { width: 1440, height: 900 }, path: p = '/', seen = false, reduced = false,
  drawn = false, touch = false, routes = [], init = [] } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: touch, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  if (drawn) {
    for (const m of ['**/assets/dash/cockpit-*', '**/assets/dash/doll-*']) {
      await context.route(m, (r) => r.fulfill({ status: 404, body: 'not found' }));
    }
  }
  for (const [match, handler] of routes) await context.route(match, handler);
  if (seen) await context.addInitScript(() => sessionStorage.setItem('omar_intro_session', '1'));
  for (const fn of init) await context.addInitScript(fn);
  await context.route(
    (url) => BLOCKED.some((h) => url.hostname === h || url.hostname.endsWith('.' + h)),
    (route) => route.abort()
  );
  await context.addInitScript(() => {
    window.__marks = {};
    const mark = (k) => { if (!(k in window.__marks)) window.__marks[k] = performance.now(); };
    new MutationObserver(() => {
      const h = document.documentElement.classList;
      if (document.body && document.body.classList.contains('intro-active')) mark('introStart');
      if (h.contains('dash-intro')) mark('mounted');
      if (h.contains('dash-pushing')) mark('pushStart');
      if ('pushStart' in window.__marks && !h.contains('dash-pushing')) mark('pushEnd');
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
  const page = await context.newPage();
  page.vw = viewport.width;
  page.vh = viewport.height;
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.requested = [];
  page.on('request', (r) => page.requested.push(r.url()));
  await page.goto(server.url + p);
  return page;
}
export const done = (page) => page.context().close();

export async function until(page, fn, timeout, arg) {
  await page.waitForFunction(fn, arg, { timeout, polling: 50 });
}
// body.intro-active: the intro is running and listening for input.
export async function introStart(page) {
  await until(page, () => document.body.classList.contains('intro-active'), 8000);
}
// The dashboard is up: grid in the screen, page no longer dark, intro running.
export async function mounted(page) {
  await until(page, () => document.documentElement.classList.contains('dash-intro')
    && !document.documentElement.classList.contains('dash-loading')
    && document.body.classList.contains('intro-active'), 8000);
}
// The push-in has finished.
export async function landed(page, timeout = 6000) {
  await until(page, () => 'pushEnd' in window.__marks, timeout);
}
// Computed style; pseudo is e.g. '::before'.
export async function css(page, sel, prop, pseudo = null) {
  return page.evaluate(([sel, prop, pseudo]) => getComputedStyle(document.querySelector(sel), pseudo)[prop], [sel, prop, pseudo]);
}
export async function rect(page, sel) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  }, sel);
}

// Count DashIntro.pushIn calls from here on, note the type of the event each ran in, and
// count landings (calls of the onDone the page passes to pushIn):
// window.__pushIns, window.__pushInBy (event types, null outside an event), window.__landings.
export async function countPushIns(page) {
  await page.evaluate(() => {
    window.__pushIns = 0;
    window.__pushInBy = [];
    window.__landings = 0;
    const push = window.DashIntro.pushIn;
    window.DashIntro.pushIn = function (onDone) {
      window.__pushIns++;
      window.__pushInBy.push(window.event ? window.event.type : null);
      return push.call(this, function () {
        window.__landings++;
        if (typeof onDone === 'function') return onDone.apply(this, arguments);
      });
    };
  });
}
export const pushCounts = (page) => page.evaluate(() => ({ pushIns: window.__pushIns, by: window.__pushInBy, landings: window.__landings }));

// Perform one visitor input. how:
//   'click-screen'  mouse click on the middle of #dash-screen
//   'click-intro'   mouse click on the windshield, away from the screen and Wire Omar
//   'tap'           touch tap on the middle of #dash-screen (open with touch: true)
//   'wheel'         one wheel scroll over the screen
//   'swipe'         a touch swipe up over the screen: touchstart, touchmoves, touchend (open with touch: true)
//   anything else   a key press for page.keyboard.press, e.g. 'Escape', 'Shift', 'Meta+ArrowLeft'
// The event type each input should start the push-in from: START_EVENT[how] (keys: 'keydown').
export const START_EVENT = { 'click-screen': 'click', 'click-intro': 'click', tap: 'click', wheel: 'wheel', swipe: 'touchmove' };
export async function enter(page, how) {
  const screen = async () => {
    const r = await rect(page, '#dash-screen');
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  if (how === 'click-screen') {
    const [x, y] = await screen();
    await page.mouse.click(x, y);
  } else if (how === 'click-intro') {
    const s = await rect(page, '#dash-shield');
    await page.mouse.click(s.left + 0.12 * s.width, s.top + 0.35 * s.height);
  } else if (how === 'tap') {
    const [x, y] = await screen();
    await page.touchscreen.tap(x, y);
  } else if (how === 'wheel') {
    const [x, y] = await screen();
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 120);
  } else if (how === 'swipe') {
    const [x, y] = await screen();
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, ty) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: ty, id: 1 }],
    });
    await touch('touchStart', y);
    for (let i = 1; i <= 4; i++) await touch('touchMove', y - 20 * i);
    await touch('touchEnd', y - 80);
    await cdp.detach();
  } else {
    await page.keyboard.press(how);
  }
}

// Test scenes (cockpit-motion, minimap-motion).
// routes: withScene(scene) is a scenes file holding just this scene (minimap: the real strip unless
// the scene says otherwise); its media under test-media/ come from tests/fixtures/, with ranges.
const MEDIA_TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg' };
export const STRIP = 'assets/dash/scenes/miami-beach/minimap-strip.svg';
export function withScene(scene) {
  const body = `window.DashScenes = { scenes: [${JSON.stringify({ id: 'test-scene', minimap: STRIP, ...scene })}] };`;
  return [
    ['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })],
    ['**/test-media/**', async (r) => {
      const name = path.basename(new URL(r.request().url()).pathname);
      try {
        const buf = await fs.readFile(path.join(FIXTURES, name));
        const contentType = MEDIA_TYPES[path.extname(name)] || 'application/octet-stream';
        const m = /^bytes=(\d+)-(\d*)$/.exec(r.request().headers()['range'] || '');
        if (m) {
          const a = +m[1], b = m[2] ? Math.min(+m[2], buf.length - 1) : buf.length - 1;
          await r.fulfill({ status: 206, body: buf.subarray(a, b + 1),
            headers: { 'content-type': contentType, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${buf.length}` } });
        } else {
          await r.fulfill({ body: buf, contentType, headers: { 'accept-ranges': 'bytes' } });
        }
      } catch {
        await r.fulfill({ status: 404, body: 'not found' });
      }
    }],
  ];
}
export const STILL = 'test-media/still.jpg';
export const CLIP = { still: STILL, clip: 'test-media/clip.webm' };
export const NO_CLIP = { still: STILL };

// Init scripts for the clip. The fixture clip is 1 s long.
// SLOW: plays at a tenth of the speed, so there is time to watch it play.
export const SLOW = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.playbackRate = 0.1; return play.call(this); };
};
// LATE: play() starts 1.5 s late, then plays at a fifth of the speed.
export const LATE = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    return new Promise((r) => setTimeout(r, 1500)).then(() => { this.playbackRate = 0.2; return play.call(this); });
  };
};
// REFUSE: play() is refused.
export const REFUSE = () => {
  HTMLMediaElement.prototype.play = function () {
    return Promise.reject(new DOMException('play() refused', 'NotAllowedError'));
  };
};

// The part of an element left visible by its own clip-path: inset(...), in window px.
export async function visibleRect(page, sel) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const sx = r.width / w, sy = r.height / h;
    const resolve = (expr, refPx) => {
      const box = document.createElement('div');
      box.style.cssText = `position:fixed;left:0;top:0;width:${refPx}px;height:${refPx}px;visibility:hidden`;
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;height:${expr}`;
      box.appendChild(probe);
      document.body.appendChild(box);
      const v = probe.getBoundingClientRect().height;
      box.remove();
      return v;
    };
    let [t, rt, b, l] = [0, 0, 0, 0];
    const m = /^inset\((.*)\)$/.exec(getComputedStyle(el).clipPath.trim());
    if (m) {
      const parts = [];
      let depth = 0, cur = '';
      for (const ch of m[1].replace(/\s+round\s.*$/, '')) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (/\s/.test(ch) && depth === 0) { if (cur) parts.push(cur); cur = ''; } else cur += ch;
      }
      if (cur) parts.push(cur);
      const v = parts.length === 1 ? [parts[0], parts[0], parts[0], parts[0]]
        : parts.length === 2 ? [parts[0], parts[1], parts[0], parts[1]]
        : parts.length === 3 ? [parts[0], parts[1], parts[2], parts[1]] : parts;
      t = resolve(v[0], h); rt = resolve(v[1], w); b = resolve(v[2], h); l = resolve(v[3], w);
    }
    const left = r.left + l * sx, top = r.top + t * sy;
    const right = r.right - rt * sx, bottom = r.bottom - b * sy;
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }, sel);
}
// The screen frame and the grid placed in it coincide, within 1 px.
export async function frameFitsGrid(page, label = '') {
  const s = await rect(page, '#dash-screen');
  const g = await visibleRect(page, '#portal');
  for (const k of ['left', 'top', 'width', 'height']) {
    assert.ok(Math.abs(s[k] - g[k]) <= 1, `${label}${k}: frame ${s[k].toFixed(2)} vs grid ${g[k].toFixed(2)}`);
  }
}
// For page.evaluate once html.dash-pushing is set: every frame of the push-in (at most 1.5 s), the
// screen's rect (s) and the grid's visible rect (p: its clip-path inset, resolved as in visibleRect),
// with the grid's scale. Page clock.
export const PUSH_SAMPLES = () => new Promise((resolve) => {
  const portal = document.getElementById('portal');
  const screen = document.getElementById('dash-screen');
  const resolveLen = (expr, refPx) => {
    const box = document.createElement('div');
    box.style.cssText = `position:fixed;left:0;top:0;width:${refPx}px;height:${refPx}px;visibility:hidden`;
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;height:${expr}`;
    box.appendChild(probe);
    document.body.appendChild(box);
    const v = probe.getBoundingClientRect().height;
    box.remove();
    return v;
  };
  const visible = () => {
    const r = portal.getBoundingClientRect();
    const w = portal.offsetWidth, h = portal.offsetHeight;
    const m = /^inset\((.*)\)$/.exec(getComputedStyle(portal).clipPath.trim());
    let ins = [0, 0, 0, 0];
    if (m) {
      const parts = [];
      let depth = 0, cur = '';
      for (const ch of m[1]) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (/\s/.test(ch) && depth === 0) { if (cur) parts.push(cur); cur = ''; } else cur += ch;
      }
      if (cur) parts.push(cur);
      const v = [parts[0], parts[1] ?? parts[0], parts[2] ?? parts[0], parts[3] ?? parts[1] ?? parts[0]];
      ins = [resolveLen(v[0], h), resolveLen(v[1], w), resolveLen(v[2], h), resolveLen(v[3], w)];
    }
    const sx = r.width / w, sy = r.height / h;
    return { left: r.left + ins[3] * sx, top: r.top + ins[0] * sy, right: r.right - ins[1] * sx, bottom: r.bottom - ins[2] * sy };
  };
  const out = [];
  const t0 = performance.now();
  (function frame() {
    if (!document.documentElement.classList.contains('dash-pushing') || performance.now() - t0 > 1500) return resolve(out);
    const s = screen.getBoundingClientRect();
    const p = visible();
    out.push({ t: performance.now() - t0, scale: portal.getBoundingClientRect().width / portal.offsetWidth,
      s: { left: s.left, top: s.top, right: s.right, bottom: s.bottom }, p });
    requestAnimationFrame(frame);
  })();
});
// Which dashboard is up: 'wide' or 'tall' (rendered), or 'drawn'.
export const dashMode = (page) => page.evaluate(() => {
  const h = document.documentElement;
  return h.classList.contains('dash-rendered') ? h.getAttribute('data-dash-mode') : 'drawn';
});
