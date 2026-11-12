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
async function rect(page, sel) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  }, sel);
}
// Bounding rect of an element intersected with its own clip-path inset(), in viewport px.
// Inset values may be calc() with % and vh, so each is resolved against the element's box.
async function visibleRect(page, sel) {
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
async function css(page, sel, prop) {
  return page.evaluate(([sel, prop]) => getComputedStyle(document.querySelector(sel))[prop], [sel, prop]);
}
// The dashboard is mounted (grid placed in the screen) when html.dash-intro appears.
async function mounted(page) {
  await until(page, () => document.documentElement.classList.contains('dash-intro'), 8000);
}
function assertFits(s, p, tol, label = '') {
  for (const k of ['left', 'top', 'width', 'height']) {
    assert.ok(Math.abs(s[k] - p[k]) <= tol, `${label}${k}: frame ${s[k].toFixed(2)} vs grid ${p[k].toFixed(2)}`);
  }
}
async function done(page) {
  await page.context().close();
}

for (const offline of [false, true]) {
  const mode = offline ? 'offline' : 'online';
  describe(`[${mode}]`, { concurrency: 2 }, () => {
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
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const size = `${viewport.width}x${viewport.height}`;
      test(`screen frame has the window's proportions (${size})`, async () => {
        const page = await open({ offline, viewport });
        try {
          await mounted(page);
          const r = await rect(page, '#dash-screen');
          assert.ok(Math.abs(r.width / r.height - viewport.width / viewport.height) < 0.01, `${r.width}x${r.height}`);
        } finally {
          await done(page);
        }
      });
      test(`first screenful of the grid sits exactly in the frame (${size})`, async () => {
        const page = await open({ offline, viewport });
        try {
          await mounted(page);
          await page.waitForTimeout(300);
          assertFits(await rect(page, '#dash-screen'), await visibleRect(page, '#portal'), 1);
        } finally {
          await done(page);
        }
      });
    }

    test('grid still fits the frame after a resize during the hold', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.setViewportSize({ width: 1000, height: 700 });
        await page.waitForTimeout(200);
        assertFits(await rect(page, '#dash-screen'), await visibleRect(page, '#portal'), 1);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(200);
        assertFits(await rect(page, '#dash-screen'), await visibleRect(page, '#portal'), 1, 'rotated: ');
      } finally {
        await done(page);
      }
    });

    for (const viewport of [{ width: 2560, height: 1080 }, { width: 1280, height: 500 }]) {
      test(`frame stays inside the window at ${viewport.width}x${viewport.height}`, async () => {
        const page = await open({ offline, viewport });
        try {
          await mounted(page);
          const s = await rect(page, '#dash-screen');
          const shieldBottom = (await rect(page, '#dash-shield')).bottom;
          assert.ok(s.left >= 0 && s.top >= shieldBottom && s.right <= viewport.width && s.bottom <= viewport.height,
            JSON.stringify({ s, shieldBottom }));
          assertFits(s, await visibleRect(page, '#portal'), 1);
        } finally {
          await done(page);
        }
      });
    }

    test('banner headline is in view at 300ms', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        assert.equal((await page.textContent('#standoff-splash h1')).trim(), 'HAVE TASTE. WILL TRAVEL.');
        assert.equal(await page.locator('#standoff-splash h1').count(), 1);
        const h = await rect(page, '#standoff-splash h1');
        assert.ok(h.left < page.vw && h.right > 0 && h.width > 0, JSON.stringify(h));
      } finally {
        await done(page);
      }
    });
  });
}
