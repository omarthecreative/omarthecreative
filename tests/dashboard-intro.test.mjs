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
  // Page-clock timestamps of the intro's state changes, immune to test-runner lag.
  await context.addInitScript(() => {
    window.__marks = {};
    const mark = (k) => { if (!(k in window.__marks)) window.__marks[k] = performance.now(); };
    const check = () => {
      const h = document.documentElement.classList;
      if (document.body && document.body.classList.contains('intro-active')) mark('introStart');
      if (h.contains('dash-intro')) mark('mounted');
      if (h.contains('dash-pushing')) mark('pushStart');
      if ('pushStart' in window.__marks && !h.contains('dash-pushing')) mark('pushEnd');
    };
    new MutationObserver(check).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
    window.addEventListener('click', () => mark('skip'), true);
    window.addEventListener('keydown', () => mark('skip'), true);
  });
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
// Grid in its normal state, intro layer gone.
async function endState(page, timeout) {
  await until(page, () => {
    const portal = document.getElementById('portal');
    const splash = document.getElementById('standoff-splash');
    const cs = getComputedStyle(portal);
    return cs.transform === 'none' && cs.clipPath === 'none' && getComputedStyle(splash).display === 'none'
      && !document.documentElement.classList.contains('dash-intro')
      && !document.documentElement.classList.contains('dash-pushing');
  }, timeout);
}
async function assertEndState(page) {
  assert.equal(await css(page, '#portal', 'transform'), 'none');
  assert.equal(await css(page, '#portal', 'clipPath'), 'none');
  assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
  const html = await page.evaluate(() => document.documentElement.className);
  assert.ok(!/dash-intro|dash-pushing/.test(html), html);
  assert.equal(await page.evaluate(() => document.body.classList.contains('intro-active')), false);
  const p = await rect(page, '#portal');
  assert.ok(p.left === 0 && p.top === 0 && Math.abs(p.width - page.vw) <= 1, JSON.stringify(p));
  // The grid page scrolls in its own fixed container (html/body never scroll on the grid page).
  const scrolled = await page.evaluate(() => {
    const c = document.getElementById('grid-scroll-container');
    c.scrollTop = 400;
    return c.scrollTop;
  });
  assert.equal(scrolled, 400);
}
// Count shutter sounds and pushIn calls from here on.
async function countExits(page) {
  await page.evaluate(() => {
    window.__shutters = 0;
    window.__pushIns = 0;
    if (typeof ApexSound !== 'undefined') { // script-scope const, not on window
      const play = ApexSound.play;
      ApexSound.play = function (name) {
        if (name === 'shutter') window.__shutters++;
        try { return play.apply(this, arguments); } catch (e) { /* no audio in headless */ }
      };
    }
    const push = DashIntro.pushIn;
    DashIntro.pushIn = function () { window.__pushIns++; return push.apply(this, arguments); };
  });
}
async function done(page) {
  await page.context().close();
}

for (const offline of [false, true]) {
  const mode = offline ? 'offline' : 'online';
  describe(`[${mode}]`, { concurrency: 1 }, () => {
    test('baseline: first visit ends on the grid', async () => {
      const page = await open({ offline });
      try {
        await introStart(page);
        // Headless software rendering stretches timings, so poll to a deadline.
        await until(page, () => getComputedStyle(document.getElementById('standoff-splash')).display === 'none', 8000);
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
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      test(`after hold and push-in the grid is in its normal state (${viewport.width}x${viewport.height})`, async () => {
        const page = await open({ offline, viewport });
        try {
          await introStart(page);
          await page.waitForTimeout(4400);
          await endState(page, 3000); // slack for headless software rendering; timings asserted below
          const m = await page.evaluate(() => window.__marks);
          const hold = m.pushStart - m.introStart, push = m.pushEnd - m.pushStart;
          assert.ok(hold >= 2950 && hold <= 3600, `hold ${hold.toFixed(0)}ms`);
          assert.ok(push <= 1400, `push-in ${push.toFixed(0)}ms`);
          await assertEndState(page);
        } finally {
          await done(page);
        }
      });
    }

    test('mid push-in, frame and grid edges still coincide', async (t) => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await until(page, () => document.documentElement.classList.contains('dash-pushing'), 5000);
        const samples = await page.evaluate(() => new Promise((resolve) => {
          const out = [];
          const t0 = performance.now();
          const portal = document.getElementById('portal');
          const screen = document.getElementById('dash-screen');
          (function frame() {
            const pushing = document.documentElement.classList.contains('dash-pushing');
            if (!pushing || performance.now() - t0 > 1500) return resolve(out);
            const s = screen.getBoundingClientRect();
            const p = portal.getBoundingClientRect();
            const scale = p.width / portal.offsetWidth;
            out.push({
              pushing,
              s: { left: s.left, top: s.top, width: s.width, height: s.height },
              // visible part of the grid is its first screenful: 100vh, scaled
              p: { left: p.left, top: p.top, width: p.width, height: window.innerHeight * scale },
              scale,
            });
            requestAnimationFrame(frame);
          })();
        }));
        const mid = samples.filter((x) => x.pushing && x.scale > 0.5 && x.scale < 0.99);
        assert.ok(mid.length >= 1, `no mid-push samples: ${JSON.stringify(samples.map((x) => x.scale))}`);
        for (const x of mid) assertFits(x.s, x.p, 2, `scale ${x.scale.toFixed(3)} `);
        const worst = Math.max(...mid.flatMap((x) => ['left', 'top', 'width', 'height'].map((k) => Math.abs(x.s[k] - x.p[k]))));
        t.diagnostic(`${mid.length} mid-push frames, worst edge error ${worst.toFixed(3)}px`);
      } finally {
        await done(page);
      }
    });

    test('click skips: end state within 1400ms of the click (page clock)', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.waitForTimeout(500);
        await page.mouse.click(page.vw * 0.75, page.vh * 0.6); // on the screen
        await endState(page, 6000);
        const m = await page.evaluate(() => window.__marks);
        assert.ok(m.pushEnd - m.skip <= 1400, `skip to end state ${(m.pushEnd - m.skip).toFixed(0)}ms`);
        await assertEndState(page);
        assert.ok(!/\?p=|project/.test(page.url()), page.url()); // the click did not open a tile
      } finally {
        await done(page);
      }
    });

    test('Escape skips: end state within 1400ms (page clock)', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await endState(page, 6000);
        const m = await page.evaluate(() => window.__marks);
        assert.ok(m.pushEnd - m.skip <= 1400, `skip to end state ${(m.pushEnd - m.skip).toFixed(0)}ms`);
        await assertEndState(page);
      } finally {
        await done(page);
      }
    });

    test('click then timer: pushIn runs once', async () => {
      const page = await open({ offline });
      try {
        await introStart(page);
        await countExits(page);
        assert.ok(!('pushStart' in await page.evaluate(() => window.__marks)), 'counters attached too late');
        // Clicks scheduled on the page clock, so runner lag cannot reorder them against the 3s timer.
        await page.evaluate(() => {
          const at = (ms, fn) => setTimeout(fn, Math.max(0, window.__marks.introStart + ms - performance.now()));
          const click = () => document.getElementById('dash-shield').dispatchEvent(new MouseEvent('click', { bubbles: true }));
          at(2850, click); // just before the timer
          at(3150, click); // again, mid push-in
        });
        await endState(page, 6000);
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => window.__shutters), 1);
        assert.equal(await page.evaluate(() => window.__pushIns), 1);
        await assertEndState(page);
      } finally {
        await done(page);
      }
    });

    test('tab hidden during push-in still finishes', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.evaluate(() => {
          // Hidden tabs do not deliver transitionend.
          window.addEventListener('transitionend', (e) => e.stopImmediatePropagation(), true);
        });
        await page.keyboard.press('Enter');
        await until(page, () => document.documentElement.classList.contains('dash-pushing'), 1000).catch(() => {});
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForTimeout(1500);
        await assertEndState(page);
      } finally {
        await done(page);
      }
    });
    async function assertNoIntro(page) {
      assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dash-intro')), false);
      assert.equal(await css(page, '#portal', 'transform'), 'none');
      assert.equal(await page.evaluate(() => 'mounted' in window.__marks || 'introStart' in window.__marks), false);
    }

    test('returning visitor: no intro', async () => {
      const page = await open({ offline, seen: true });
      try {
        await until(page, () => document.body.classList.contains('grid-active'), 5000);
        await page.waitForTimeout(500);
        await assertNoIntro(page);
      } finally {
        await done(page);
      }
    });

    test('?filter=films: no intro, filter applied', async () => {
      const page = await open({ offline, path: '/?filter=films' });
      try {
        await until(page, () => document.body.classList.contains('grid-active'), 5000);
        await page.waitForTimeout(500);
        await assertNoIntro(page);
        assert.equal(await page.getAttribute('.filter-btn.active', 'data-filter'), 'films');
      } finally {
        await done(page);
      }
    });

    test('?p=0: no intro, project view', async () => {
      const page = await open({ offline, path: '/?p=0' });
      try {
        await until(page, () => document.body.classList.contains('project-view'), 5000);
        await page.waitForTimeout(500);
        await assertNoIntro(page);
      } finally {
        await done(page);
      }
    });

    test('reduced motion: no intro, grid active at 500ms', async () => {
      const page = await open({ offline, reduced: true });
      try {
        await page.waitForTimeout(500);
        // What the visitor sees at 500ms: no intro, grid on screen (head script's immediate style).
        assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
        assert.equal(await css(page, '#combined-grid-view', 'display'), 'block');
        // grid-active itself waits on the page's existing font gate (2s safety timeout when Typekit fails).
        await until(page, () => document.body.classList.contains('grid-active'), 2500);
        await assertNoIntro(page);
      } finally {
        await done(page);
      }
    });

    test('Wire Omar navigates to about.html during the hold', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        await countExits(page);
        await page.click('#dash-wire');
        await page.waitForURL(/about\.html$/, { timeout: 5000 });
      } finally {
        await done(page);
      }
    });

    test('Wire Omar by keyboard (Enter) navigates, does not skip', async () => {
      const page = await open({ offline });
      try {
        await mounted(page);
        await page.focus('#dash-wire');
        await page.keyboard.press('Enter');
        await page.waitForURL(/about\.html$/, { timeout: 5000 });
      } finally {
        await done(page);
      }
    });
  });
}
