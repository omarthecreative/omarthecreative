// Rendered cockpit tests (spec 2026-11-13-rendered-cockpit-design.md). Run from tests/: `node --test rendered-cockpit.test.mjs`.
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

let server;
let browser;

before(async () => {
  server = await startServer(SRC);
  browser = await chromium.launch();
  // The first AudioContext in a browser run starts the audio service (400-700ms
  // here, drawn or rendered). Start it now, or it lands on the first test whose
  // hold ends (ApexSound.init runs at the push-in) and stretches its timing.
  const warm = await browser.newPage();
  await warm.evaluate(() => new AudioContext().close());
  await warm.close();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

describe('assets', () => {
  test('every Spec 3 asset is served with a media type', async () => {
    const files = ['assets/dash/cockpit-wide-2560.webp', 'assets/dash/cockpit-wide-3840.webp', 'assets/dash/cockpit-tall-1080.webp',
      'assets/dash/doll-top.webp', 'assets/dash/doll-base.webp',
      ...['still-1920.jpg', 'still-960.jpg', 'clip-1920.mp4', 'clip-960.mp4'].map((f) => 'assets/dash/scenes/miami-beach/' + f)];
    for (const f of files) {
      const res = await fetch(server.url + '/' + f);
      assert.equal(res.status, 200, f);
      assert.match(res.headers.get('content-type'), /^(image|video)\//, f);
    }
  });
});

describe('layout', () => {
  const cases = [
    [1440, 900,  { mode: 'wide', k: 0.48,   left: 712,    top: 387,    shield: 370.8, ckX: 0,   ckW: 1600,    cropR: 160 }],
    [1920, 1080, { mode: 'wide', k: 0.48,   left: 940.8,  top: 464.4,  shield: 445,   ckX: 0,   ckW: 1920,    cropR: 0 }],
    [1024, 768,  { mode: 'wide', k: 0.391,  left: 607.6,  top: 330.2,  shield: 316.4, ckX: 0,   ckW: 1365.3,  cropR: 341.3 }],
    [2560, 1080, { mode: 'wide', k: 0.41,   left: 1174.4, top: 464.4,  shield: 445,   ckX: 320, ckW: 1920,    cropR: 0 }],
    [1280, 500,  { mode: 'wide', k: 0.373,  left: 591.1,  top: 215,    shield: 206,   ckX: 195.6, ckW: 888.9, cropR: 0 }],
    [1280, 1024, { mode: 'none' }],
    [768, 1024,  { mode: 'none' }],
    [390, 844,   { mode: 'tall', k: 0.62,   left: 74.1,   top: 270.1,  shield: 190.7, ckX: 0,   ckW: 390,     cropR: 0 }],
    [412, 732,   { mode: 'tall', k: 0.62,   left: 78.3,   top: 234.2,  shield: 201.4, ckX: 0,   ckW: 412,     cropR: 0 }],
    [740, 360,   { mode: 'none' }],
  ];

  test('layout(w, h) matches the table and holds its invariants', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(server.url + '/');
      await page.waitForFunction(() => window.DashIntro);
      const results = await page.evaluate((cs) => cs.map(([w, h]) => window.DashIntro.layout(w, h)), cases);
      cases.forEach(([w, h, want], i) => {
        const got = results[i];
        const name = `${w}x${h}`;
        assert.equal(got.mode, want.mode, `${name} mode`);
        if (want.mode === 'none') return;
        for (const key of ['left', 'top', 'shield', 'ckX', 'ckW', 'cropR']) {
          assert.ok(Math.abs(got[key] - want[key]) <= 0.6, `${name} ${key}: got ${got[key]}, want ${want[key]}`);
        }
        assert.ok(Math.abs(got.k - want.k) <= 0.002, `${name} k: got ${got.k}, want ${want.k}`);
        assert.ok(got.top >= got.shield, `${name} top below windshield edge`);
        assert.ok(got.left + got.k * w <= w, `${name} screen inside the width`);
        assert.ok(got.top + got.k * h <= h, `${name} screen inside the height`);
        assert.ok(got.sbX <= 0 && got.sbY <= 0, `${name} scene box starts at or before the view`);
        assert.ok(got.sbX + got.sbW >= got.ckW - 0.5, `${name} scene box covers the view width`);
        assert.ok(got.sbY + got.sbH >= got.shield - 0.5, `${name} scene box covers the view height`);
      });
    } finally {
      await page.close();
    }
  });
});

// — Task 3: the cockpit layer and the html.dash-rendered switch —
// Helpers copied from dashboard-intro.test.mjs and scene-system.test.mjs, so this file stands alone.
// These tests run offline (Typekit, Vimeo and analytics blocked) so the font gate opens quickly.
const BLOCKED = ['use.typekit.net', 'p.typekit.net', 'player.vimeo.com', 'googletagmanager.com', 'google-analytics.com'];

// Options (Task 5): path, seen (session already played the intro), reduced (prefers-reduced-motion),
// init (extra init scripts, functions).
async function open({ viewport = { width: 1440, height: 900 }, routes = [], path: p = '/', seen = false, reduced = false, init = [] } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  for (const [match, handler] of routes) await context.route(match, handler);
  if (seen) await context.addInitScript(() => sessionStorage.setItem('omar_intro_session', '1'));
  for (const fn of init) await context.addInitScript(fn);
  await context.route(
    (url) => BLOCKED.some((h) => url.hostname === h || url.hostname.endsWith('.' + h)),
    (route) => route.abort()
  );
  // Page-clock timestamps of the intro's state changes.
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
const done = (page) => page.context().close();
async function until(page, fn, timeout) {
  await page.waitForFunction(fn, null, { timeout, polling: 50 });
}
async function introStart(page) {
  await until(page, () => document.body.classList.contains('intro-active'), 8000);
}
async function landed(page) {
  await until(page, () => 'pushEnd' in window.__marks, 12000);
}
async function mounted(page) {
  await until(page, () => document.documentElement.classList.contains('dash-intro')
    && !document.documentElement.classList.contains('dash-loading')
    && document.body.classList.contains('intro-active'), 8000);
}
async function rect(page, sel) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  }, sel);
}
// Bounding rect of an element intersected with its own clip-path inset(), in viewport px.
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
function assertFits(s, p, tol, label = '') {
  for (const k of ['left', 'top', 'width', 'height']) {
    assert.ok(Math.abs(s[k] - p[k]) <= tol, `${label}${k}: frame ${s[k].toFixed(2)} vs grid ${p[k].toFixed(2)}`);
  }
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
  const scrolled = await page.evaluate(() => {
    const c = document.getElementById('grid-scroll-container');
    c.scrollTop = 400;
    return c.scrollTop;
  });
  assert.equal(scrolled, 400);
}
// Which dashboard is up: rendered flag, mode attribute, DashIntro.rendered(), inline variables.
async function dashState(page) {
  return page.evaluate(() => {
    const h = document.documentElement;
    const names = ['--dash-k', '--dash-left', '--dash-top', '--dash-shield', '--ck-x', '--ck-w', '--ck-h', '--ck-crop-r',
      '--sb-x', '--sb-y', '--sb-w', '--sb-h'];
    return {
      cls: h.classList.contains('dash-rendered'),
      mode: h.getAttribute('data-dash-mode'),
      api: typeof DashIntro.rendered === 'function' ? DashIntro.rendered() : 'missing',
      inline: names.filter((n) => h.style.getPropertyValue(n) !== ''),
    };
  });
}
async function assertDrawn(page, label = '') {
  const s = await dashState(page);
  assert.deepEqual(s, { cls: false, mode: null, api: false, inline: [] }, `${label}drawn dashboard expected`);
  assert.equal(await css(page, '.dash-surface', 'display'), 'block', `${label}.dash-surface`);
  const phone = await page.evaluate(() => matchMedia('(max-width: 760px)').matches);
  assert.equal(await css(page, '.dash-furniture', 'display'), phone ? 'none' : 'block', `${label}.dash-furniture`);
  assert.equal(await css(page, '#dash-cockpit', 'display'), 'none', `${label}#dash-cockpit`);
}
async function assertRendered(page, mode, label = '') {
  const s = await dashState(page);
  assert.equal(s.cls, true, `${label}html.dash-rendered`);
  assert.equal(s.mode, mode, `${label}data-dash-mode`);
  assert.equal(s.api, true, `${label}DashIntro.rendered()`);
  assert.equal(s.inline.length, 12, `${label}inline variables: ${s.inline.join(' ')}`);
  assert.equal(await css(page, '.dash-surface', 'display'), 'none', `${label}.dash-surface`);
  assert.equal(await css(page, '.dash-furniture', 'display'), 'none', `${label}.dash-furniture`);
  assert.notEqual(await css(page, '#dash-cockpit', 'display'), 'none', `${label}#dash-cockpit`);
}
async function assertFrameFitsGrid(page, label = '') {
  assertFits(await rect(page, '#dash-screen'), await visibleRect(page, '#portal'), 1, label);
}
const cockpitRequests = (page) => page.requested.filter((u) => /cockpit-/.test(u));

describe('rendered cockpit', { concurrency: 1 }, () => {
  for (const [w, h] of [[1440, 900], [1920, 1080], [1024, 768], [2560, 1080]]) {
    test(`rendered at ${w}x${h}: cockpit shows, drawn dashboard does not, screen clear of button and windshield`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        await assertRendered(page, 'wide');
        const img = await page.evaluate(() => {
          const i = document.getElementById('dash-cockpit-img');
          return { complete: i.complete, nw: i.naturalWidth, src: i.currentSrc };
        });
        assert.ok(img.complete && img.nw > 0, JSON.stringify(img));
        assert.match(img.src, /\/assets\/dash\/cockpit-wide-2560\.webp$/);
        // The old dashboard's pillars, roof and hood are in the cockpit image now.
        const sky = await page.evaluate(() => [...document.querySelector('.dash-sky').children]
          .filter((el) => el.tagName !== 'defs' && el.id !== 'dash-drawn')
          .map((el) => getComputedStyle(el).display));
        assert.ok(sky.length > 0 && sky.every((d) => d === 'none'), `drawn sky parts: ${sky.join(',')}`);
        const ck = await rect(page, '#dash-cockpit-img');
        assert.ok(ck.left >= 0, `cockpit left ${ck.left}`);
        assert.ok(Math.abs(ck.height - h) <= 1, `cockpit height ${ck.height}`);
        assert.ok(Math.abs(ck.width - h * 16 / 9) <= 1, `cockpit width ${ck.width}`);
        const screen = await rect(page, '#dash-screen');
        const shield = await rect(page, '#dash-shield');
        assert.ok(screen.top >= shield.bottom, `screen top ${screen.top} above windshield edge ${shield.bottom}`);
        assert.ok(screen.right <= w && screen.bottom <= h, JSON.stringify(screen));
        assert.ok(screen.left >= ck.left + 0.433 * ck.width, `screen left ${screen.left} overlaps the start button`);
        const wire = await rect(page, '#dash-wire');
        const cx = wire.left + wire.width / 2, cy = wire.top + wire.height / 2;
        assert.ok(Math.abs(cx - (ck.left + 0.416 * ck.width)) <= 2, `wire centre x ${cx}`);
        assert.ok(Math.abs(cy - 0.675 * h) <= 2, `wire centre y ${cy}`);
        assert.ok(Math.abs(wire.width - 0.034 * ck.width) <= 1, `wire width ${wire.width}`);
        assert.ok(wire.right <= screen.left, `wire right ${wire.right} vs screen left ${screen.left}`);
        // "Wire Omar" sits under the button on one line, clear of the screen.
        const words = await rect(page, '#dash-wire span');
        assert.ok(words.top >= wire.bottom - 1, `words top ${words.top} vs button bottom ${wire.bottom}`);
        assert.ok(Math.abs(words.left + words.width / 2 - cx) <= 1, 'words centred under the button');
        assert.ok(words.right <= screen.left, `words right ${words.right} vs screen left ${screen.left}`);
        assert.equal((await page.textContent('#dash-wire span')).replace(/\s+/g, ' ').trim(), 'Wire Omar');
        assert.ok(words.height < 2 * parseFloat(await css(page, '#dash-wire span', 'fontSize')), 'words on one line');
        assert.equal(await css(page, '#dash-wire', 'borderTopWidth'), '0px');
        assert.equal(await css(page, '#dash-wire', 'boxShadow'), 'none');
        assert.equal(await css(page, '#dash-wire', 'backgroundColor'), 'rgba(0, 0, 0, 0)');
        const knight = await rect(page, '#dash-wire svg');
        assert.ok(Math.abs(knight.height - 0.46 * wire.height) <= 1, `knight ${knight.height} of button ${wire.height}`);
        await assertFrameFitsGrid(page);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('wider than 2560: the 3840 cockpit file', async () => {
    const page = await open({ viewport: { width: 2600, height: 1100 } });
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      assert.match(await page.evaluate(() => document.getElementById('dash-cockpit-img').currentSrc), /cockpit-wide-3840\.webp$/);
      assert.deepEqual(cockpitRequests(page).map((u) => u.split('/').pop()), ['cockpit-wide-3840.webp']);
    } finally {
      await done(page);
    }
  });

  test('wider than 16:9: black beside the cockpit image, fading over its outer 6%', async () => {
    const page = await open({ viewport: { width: 2560, height: 1080 } });
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      const ck = await rect(page, '#dash-cockpit-img');
      const sides = await page.evaluate(() => {
        const box = document.getElementById('dash-cockpit');
        return ['::before', '::after'].map((p) => {
          const cs = getComputedStyle(box, p);
          return { content: cs.content, width: parseFloat(cs.width), left: cs.left, right: cs.right, bg: cs.backgroundImage, z: cs.zIndex };
        });
      });
      for (const s of sides) {
        assert.notEqual(s.content, 'none');
        assert.ok(Math.abs(s.width - (ck.left + 0.06 * ck.width)) <= 1, `side band ${s.width}px`);
        assert.match(s.bg, /linear-gradient\(.*rgb\(0, 0, 0\).*(transparent|rgba\(0, 0, 0, 0\))/);
      }
      assert.equal(sides[0].left, '0px');
      assert.equal(sides[1].right, '0px');
      // At 1440x900 the image fills the width from x = 0: no side bands.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(200);
      const w = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('dash-cockpit'), '::before').width));
      assert.ok(w <= 0.5, `side band at 1440x900: ${w}px`);
    } finally {
      await done(page);
    }
  });

  test('rendered at 390x844: tall cockpit, link drawn as on main', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertRendered(page, 'tall');
      assert.match(await page.evaluate(() => document.getElementById('dash-cockpit-img').currentSrc), /\/assets\/dash\/cockpit-tall-1080\.webp$/);
      const ck = await rect(page, '#dash-cockpit-img');
      assert.ok(ck.left === 0 && Math.abs(ck.width - 390) <= 1 && Math.abs(ck.height - 390 * 16 / 9) <= 1, JSON.stringify(ck));
      const floor = await rect(page, '.dash-cockpit-floor');
      assert.ok(Math.abs(floor.top - ck.height) <= 1 && Math.abs(floor.bottom - 844) <= 1 && floor.left === 0 && floor.right === 390, JSON.stringify(floor));
      assert.equal(await css(page, '.dash-cockpit-floor', 'backgroundColor'), 'rgb(1, 1, 2)');
      assert.ok(parseFloat(await css(page, '#dash-wire', 'borderTopWidth')) > 0, 'wire border');
      assert.equal(await css(page, '#dash-wire', 'borderTopStyle'), 'solid');
      assert.notEqual(await css(page, '#dash-wire', 'borderTopColor'), 'rgba(0, 0, 0, 0)');
      const screen = await rect(page, '#dash-screen');
      assert.ok(screen.top >= (await rect(page, '#dash-shield')).bottom, 'screen below the windshield');
      await assertFrameFitsGrid(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [w, h, mode] of [[1440, 900, 'wide'], [390, 844, 'tall']]) {
    test(`paint order at ${w}x${h}: minimap, doll, screen and Wire Omar over the cockpit`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        await assertRendered(page, mode);
        const probes = await page.evaluate(() => {
          const img = document.getElementById('dash-cockpit-img');
          const ib = img.getBoundingClientRect();
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          const alpha = (x, y) => {
            const px = Math.floor((x - ib.left) / ib.width * c.width), py = Math.floor((y - ib.top) / ib.height * c.height);
            return px >= 0 && py >= 0 && px < c.width && py < c.height ? g.getImageData(px, py, 1, 1).data[3] : null;
          };
          const box = (sel) => document.querySelector(sel).getBoundingClientRect();
          const centre = (sel) => { const b = box(sel); return [b.left + b.width / 2, b.top + b.height / 2]; };
          const dollOn = document.querySelector('.dash-doll').classList.contains('dash-doll-rendered');
          const doll = box(dollOn ? '.dash-doll-r-base' : '.dash-doll-base');
          const points = {
            opaque: [ib.left + 0.05 * ib.width, ib.top + 0.95 * Math.min(ib.height, innerHeight)],
            minimap: centre('.dash-minimap'),
            // The doll hops, and its base can reach into the live screen's hole in #dash-cockpit (the
            // cockpit image is clipped away there and cannot be hit). Probe left of the screen's edge.
            // Known, accepted deviation from the spec's layer order (controller ruling P1): at widths where
            // the screen sits at its left limit (1440x900, 1024x768, 2560x1080) the doll's base overlaps the
            // screen's top-left corner by about 50 x 13 px and paints over #dash-screen. That is the doll's
            // resting state (dash-hop keeps it down for 80% of each cycle), and the base is opaque there,
            // not a moment of the hop. It is left for the owner to settle on screen; the probe avoids the overlap on
            // purpose, and the overlap itself is pinned by its own test ("known deviation (P1)").
            doll: [Math.min(doll.left + doll.width / 2, box('#dash-screen').left - 6), doll.top + doll.height * (dollOn ? 0.92 : 0.75)],
            wire: centre('#dash-wire'),
            screen: centre('#dash-screen'),
          };
          // The cockpit layer is pointer-events: none like the rest of #dash-body;
          // let it take hits for the probe so a hit shows what paints on top.
          img.style.pointerEvents = 'auto';
          const out = {};
          for (const [name, [x, y]] of Object.entries(points)) {
            const stack = document.elementsFromPoint(x, y);
            const top = stack[0];
            out[name] = {
              alpha: alpha(x, y),
              top: top ? (top.id ? '#' + top.id : top.tagName) : null,
              in: top ? ['.dash-minimap', '.dash-doll', '#dash-wire', '#dash-screen', '#dash-cockpit-img']
                .filter((s) => top.closest(s)) : [],
              at: [Math.round(x * 10) / 10, Math.round(y * 10) / 10],
              screenLeft: box('#dash-screen').left,
              imgAt: stack.indexOf(img),
            };
          }
          img.style.pointerEvents = '';
          return out;
        });
        const p = JSON.stringify(probes);
        assert.equal(probes.opaque.top, '#dash-cockpit-img', p);
        assert.ok(probes.opaque.alpha > 200, `cockpit not opaque at the probe: ${p}`);
        assert.ok(probes.minimap.in.includes('.dash-minimap'), p);
        assert.ok(probes.doll.in.includes('.dash-doll'), p);
        assert.ok(probes.doll.at[0] < probes.doll.screenLeft, `doll probe is inside the screen hole: ${p}`);
        assert.ok(probes.doll.imgAt > 0, `cockpit image not under the doll: ${p}`);
        assert.ok(probes.wire.in.includes('#dash-wire'), p);
        assert.equal(probes.screen.top, '#dash-screen', p);
        assert.equal(probes.screen.imgAt, -1, `cockpit image covers the screen: ${p}`);
        if (mode === 'wide') {
          assert.ok(probes.wire.alpha > 200, `Wire Omar not on an opaque button: ${p}`);
          assert.ok(probes.doll.alpha > 200, `doll not standing on the dash: ${p}`);
          assert.ok(probes.wire.imgAt > 0, `cockpit image not under Wire Omar: ${p}`);
        }
        // Minimap: 7% of the cockpit's width in from the visible right edge of the image.
        const ck = await rect(page, '#dash-cockpit-img');
        const mm = await rect(page, '.dash-minimap');
        assert.ok(Math.abs(mm.right - (Math.min(w, ck.right) - 0.07 * ck.width)) <= 1, `minimap right ${mm.right}`);
        assert.notEqual(await css(page, '.dash-doll', 'display'), 'none');
      } finally {
        await done(page);
      }
    });

    // The mirror glass is painted into the cockpit picture: no mirror element shows over or under it.
    test(`rendered at ${w}x${h}: the mirror element is not displayed, no banner`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await assertRendered(page, mode);
        assert.equal(await css(page, '.dash-mirror', 'display'), 'none');
        assert.equal(await page.locator('.dash-rider, .dash-banner, .dash-fly, .dash-towline, .dash-plane, [data-gag]').count(), 0);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('1280x1024: drawn dashboard, cockpit never requested', async () => {
    const page = await open({ viewport: { width: 1280, height: 1024 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertDrawn(page);
      assert.deepEqual(cockpitRequests(page), []);
      assert.equal(await page.getAttribute('#dash-cockpit-img', 'src'), null);
      await assertFrameFitsGrid(page);
    } finally {
      await done(page);
    }
  });

  test('cockpit 404: drawn dashboard, no page errors', async () => {
    const page = await open({ routes: [['**/assets/dash/cockpit-*', (r) => r.fulfill({ status: 404, body: 'not found' })]] });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      assert.ok(cockpitRequests(page).length >= 1, 'cockpit was not requested');
      await assertDrawn(page);
      await assertFrameFitsGrid(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('cockpit slower than the dark wait: drawn dashboard for the whole intro', async () => {
    const slow = (r) => setTimeout(() => r.continue().catch(() => {}), 2500);
    const page = await open({ routes: [['**/assets/dash/cockpit-*', slow]] });
    try {
      await introStart(page);
      await assertDrawn(page, 'at intro start: ');
      // The late image does arrive during the hold...
      await until(page, () => {
        const i = document.getElementById('dash-cockpit-img');
        return i.complete && i.naturalWidth > 0;
      }, 6000);
      const late = await page.evaluate(() => {
        const e = performance.getEntriesByType('resource').find((x) => /cockpit-/.test(x.name));
        return { loaded: e ? e.responseEnd : null, introStart: window.__marks.introStart };
      });
      assert.ok(late.loaded > late.introStart, `cockpit arrived before the page showed: ${JSON.stringify(late)}`);
      // ...and is ignored for good: not now, not 3000ms after the intro started, not after a resize.
      await assertDrawn(page, 'after the late load: ');
      await page.waitForTimeout(Math.max(0, late.introStart + 3000 - await page.evaluate(() => performance.now())));
      await assertDrawn(page, '3000ms into the hold: ');
      await page.setViewportSize({ width: 1400, height: 880 });
      await page.waitForTimeout(150);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(150);
      await assertDrawn(page, 'after a resize: ');
      await assertFrameFitsGrid(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('resize 1440x900 -> 1000x900 during the hold: falls back to drawn, frame and grid still coincide', async () => {
    const page = await open();
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      await assertFrameFitsGrid(page, '1440x900: ');
      // Below the k floor: the drawn dashboard, the stylesheet's own geometry.
      await page.setViewportSize({ width: 1000, height: 900 });
      await page.waitForTimeout(200);
      await assertDrawn(page, '1000x900: ');
      await assertFrameFitsGrid(page, '1000x900: ');
      // Back above the floor: rendered again (the wide image is loaded).
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(200);
      await assertRendered(page, 'wide', 'back to 1440x900: ');
      await assertFrameFitsGrid(page, 'back to 1440x900: ');
      // Across the 760px breakpoint: the tall image was never loaded, so drawn.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      await assertDrawn(page, '390x844: ');
      await assertFrameFitsGrid(page, '390x844: ');
      assert.deepEqual(cockpitRequests(page).map((u) => u.split('/').pop()), ['cockpit-wide-2560.webp']);
    } finally {
      await done(page);
    }
  });

  test('resize from the phone during the hold: tall stays rendered, across the breakpoint falls back', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await assertRendered(page, 'tall');
      await page.setViewportSize({ width: 412, height: 732 });
      await page.waitForTimeout(200);
      await assertRendered(page, 'tall', '412x732: ');
      await assertFrameFitsGrid(page, '412x732: ');
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(200);
      await assertDrawn(page, '1440x900: ');
      await assertFrameFitsGrid(page, '1440x900: ');
    } finally {
      await done(page);
    }
  });

  for (const [w, h, mode] of [[1440, 900, 'wide'], [390, 844, 'tall']]) {
    test(`push-in lands on the grid in rendered mode (${w}x${h})`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await introStart(page);
        await assertRendered(page, mode);
        await landed(page);
        await page.waitForTimeout(200);
        const m = await page.evaluate(() => window.__marks);
        const hold = m.pushStart - m.introStart, push = m.pushEnd - m.pushStart;
        assert.ok(hold >= 4950 && hold <= 5600, `hold ${hold.toFixed(0)}ms`);
        assert.ok(push <= 1400, `push-in ${push.toFixed(0)}ms`);
        await assertEndState(page);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('mid push-in, frame and grid edges still coincide in rendered mode', async (t) => {
    const page = await open();
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      await until(page, () => document.documentElement.classList.contains('dash-pushing'), 7000);
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
            rendered: document.documentElement.classList.contains('dash-rendered'),
            s: { left: s.left, top: s.top, width: s.width, height: s.height },
            p: { left: p.left, top: p.top, width: p.width, height: window.innerHeight * scale },
            scale,
          });
          requestAnimationFrame(frame);
        })();
      }));
      const mid = samples.filter((x) => x.pushing && x.scale > 0.5 && x.scale < 0.99);
      assert.ok(mid.length >= 1, `no mid-push samples: ${JSON.stringify(samples.map((x) => x.scale))}`);
      assert.ok(mid.every((x) => x.rendered), 'left rendered mode mid push-in');
      for (const x of mid) assertFits(x.s, x.p, 2, `scale ${x.scale.toFixed(3)} `);
      const worst = Math.max(...mid.flatMap((x) => ['left', 'top', 'width', 'height'].map((k) => Math.abs(x.s[k] - x.p[k]))));
      t.diagnostic(`${mid.length} mid-push frames, worst edge error ${worst.toFixed(3)}px`);
    } finally {
      await done(page);
    }
  });

  test('Wire Omar navigates to about.html in rendered mode', async () => {
    const page = await open();
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      await page.waitForTimeout(300);
      await page.click('#dash-wire');
      await page.waitForURL(/about\.html$/, { timeout: 5000 });
    } finally {
      await done(page);
    }
  });
});

// — Task 4: the scene box —
// Copied from scene-system.test.mjs and extended: serves .webm too.
const MEDIA_TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg' };
function withScene(scene) {
  const body = `window.DashScenes = { scenes: [${JSON.stringify({ id: 'test-scene', timezone: 'America/New_York', ...scene })}] };`;
  return [
    ['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })],
    ['**/test-media/**', async (r) => {
      const name = path.basename(new URL(r.request().url()).pathname).replace('-small', '');
      try {
        const buf = await fs.readFile(path.join(FIXTURES, name));
        const contentType = MEDIA_TYPES[path.extname(name)] || 'application/octet-stream';
        // Answer byte ranges as a real host does (tests/serve.mjs does too).
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
const T4_STILL = 'test-media/still.jpg';
const media = (page) => page.requested.filter((u) => /test-media/.test(u));
const noCockpit = [['**/cockpit-*', (r) => r.fulfill({ status: 404, body: 'not found' })]];
const stillReady = () => {
  const i = document.getElementById('dash-still');
  return i.complete && i.naturalWidth > 0 && !i.hidden;
};

describe('scene box', { concurrency: 1 }, () => {
  test('fallback (cockpit 404): still fills the shield as on main', async () => {
    const page = await open({ routes: [...noCockpit, ...withScene({ still: T4_STILL })] });
    try {
      await mounted(page);
      await page.waitForTimeout(400);
      await assertDrawn(page);
      const still = await rect(page, '#dash-still');
      const shield = await rect(page, '#dash-shield');
      for (const k of ['left', 'top', 'width', 'height']) assert.ok(Math.abs(still[k] - shield[k]) <= 0.5, `${k}: ${still[k]} vs ${shield[k]}`);
      const views = await page.evaluate(() => ['#dash-view', '#dash-scenebox'].map((s) => {
        const cs = getComputedStyle(document.querySelector(s));
        const r = document.querySelector(s).getBoundingClientRect();
        return { pos: cs.position, z: cs.zIndex, overflow: cs.overflow, clip: cs.clipPath, tf: cs.transform, op: cs.opacity, iso: cs.isolation, w: r.width, h: r.height };
      }));
      const sh = await rect(page, '#dash-shield');
      for (const v of views) {
        assert.equal(v.pos, 'absolute');
        assert.equal(v.z, 'auto');
        assert.equal(v.overflow, 'visible');
        assert.equal(v.clip, 'none');
        assert.equal(v.tf, 'none');
        assert.equal(v.op, '1');
        assert.ok(Math.abs(v.w - sh.width) <= 0.5 && Math.abs(v.h - sh.height) <= 0.5, JSON.stringify(v));
      }
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('phone uses stillSmall', async () => {
    const page = await open({
      viewport: { width: 390, height: 844 },
      routes: withScene({ still: 'test-media/missing-big.jpg', stillSmall: T4_STILL }),
    });
    try {
      await mounted(page);
      await assertRendered(page, 'tall');
      await until(page, stillReady, 4000);
      assert.match(await page.evaluate(() => document.getElementById('dash-still').currentSrc), /test-media\/still\.jpg$/);
      assert.deepEqual(media(page).filter((u) => /big/.test(u)), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('desktop ignores stillSmall', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, stillSmall: 'test-media/missing-small.jpg' }) });
    try {
      await mounted(page);
      await until(page, stillReady, 4000);
      assert.deepEqual(media(page).filter((u) => /missing/.test(u)), []);
    } finally {
      await done(page);
    }
  });
});

// — Task 5: the clip —
// One start in both modes: the still, then the clip, played once. clip.webm is the fixture
// (Playwright's Chromium may not decode H.264). Each test runs rendered and drawn (cockpit 404).
const T5 = { still: T4_STILL, clip: 'test-media/clip.webm' };
const MODES = [['rendered', [], 'wide'], ['drawn, cockpit 404', noCockpit, null]];
const isClip = (u) => /\/test-media\/clip\.webm$/.test(u);
const clipRequests = (page) => page.requested.filter(isClip);
async function assertMode(page, mode) {
  if (mode) await assertRendered(page, mode); else await assertDrawn(page);
}
// The fixture is 1s long. Stretch it (test only) so there is time to act while it plays.
const SLOW = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.playbackRate = 0.2; return play.call(this); };
};
const clipPlaying = () => {
  const c = document.getElementById('dash-clip');
  return !c.hidden && c.currentTime > 0;
};
async function clipState(page) {
  return page.evaluate(() => {
    const el = document.getElementById('dash-clip');
    const still = document.getElementById('dash-still');
    return {
      hidden: el.hidden, src: el.getAttribute('src'), t: el.currentTime, d: el.duration, paused: el.paused,
      ended: el.ended, loop: el.loop, played: el.played.length,
      stillShown: still.complete && still.naturalWidth > 0 && !still.hidden,
    };
  });
}

describe('clip', { concurrency: 1 }, () => {
  for (const [label, opts] of [['?p=0', { path: '/?p=0' }], ['?filter=films', { path: '/?filter=films' }],
    ['reduced motion', { reduced: true }], ['second visit in the session', { seen: true }]]) {
    test(`skipped intro (${label}): no clip requested, #dash-clip has no src and preload none`, async () => {
      const page = await open({ ...opts, routes: withScene(T5) });
      try {
        await until(page, () => document.body.classList.contains('grid-active') || document.body.classList.contains('project-view'), 8000);
        await page.waitForTimeout(1500);
        assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played');
        assert.deepEqual(media(page).filter((u) => /clip/.test(u)), []);
        assert.equal(await page.getAttribute('#dash-clip', 'src'), null);
        // Nothing is fetched before startClip(): the markup's preload="none" is untouched.
        assert.equal(await page.evaluate(() => document.getElementById('dash-clip').preload), 'none');
      } finally {
        await done(page);
      }
    });
  }

  // Firefox and WebKit honour preload="none" after load(), so nothing would load.
  // Chromium cannot show that; it can show the property the clip is requested with.
  for (const [label, extra, mode] of MODES) {
    test(`clip requested with preload auto (${label})`, async () => {
      const page = await open({ routes: [...extra, ...withScene(T5)] });
      try {
        await introStart(page);
        await assertMode(page, mode);
        await until(page, () => document.getElementById('dash-clip').getAttribute('src') !== null, 4000);
        assert.equal(await page.evaluate(() => document.getElementById('dash-clip').preload), 'auto');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  // The intro ends while the clip's response is still held back: the clip lets go of its file.
  for (const [label, extra, skip] of [
    ['rendered, Enter during the hold', [], (page) => page.keyboard.press('Enter')],
    ['drawn, cockpit 404, click during the hold', noCockpit, (page) => page.mouse.click(page.vw * 0.75, page.vh * 0.6)],
  ]) {
    test(`intro ends while the clip is loading (${label}): the clip keeps no src, no page errors`, async () => {
      let release;
      const held = new Promise((r) => { release = r; });
      const hold = ['**/test-media/clip.webm', async (r) => {
        await held;
        const body = await fs.readFile(path.join(FIXTURES, 'clip.webm'));
        await r.fulfill({ body, contentType: 'video/webm' }).catch(() => {});
      }];
      const page = await open({ routes: [...extra, ...withScene(T5), hold] });
      try {
        await introStart(page);
        await until(page, () => document.getElementById('dash-clip').getAttribute('src') !== null, 4000);
        assert.ok(clipRequests(page).length >= 1, 'clip was not requested');
        await skip(page);
        await landed(page);
        await page.waitForTimeout(300);
        const v = await page.evaluate(() => {
          const el = document.getElementById('dash-clip');
          return { src: el.getAttribute('src'), networkState: el.networkState, paused: el.paused };
        });
        const s = JSON.stringify(v);
        assert.equal(v.src, null, s);
        assert.equal(v.networkState, 0, `the clip still has a resource (NETWORK_EMPTY is 0): ${s}`);
        assert.equal(v.paused, true, s);
        await assertEndState(page);
        assert.deepEqual(page.errors, []);
      } finally {
        release();
        await done(page);
      }
    });
  }

  for (const [label, extra, mode] of MODES) {
    test(`intro ends mid-clip (${label}): the clip is paused and let go`, async () => {
      // finish() pauses the clip, then lets go of its file (load() without a src resets it):
      // record its state at that load() call, while it still holds its time.
      const AT_RELEASE = () => {
        const load = HTMLMediaElement.prototype.load;
        window.__released = {};
        HTMLMediaElement.prototype.load = function () {
          if (this.id && this.getAttribute('src') === null) {
            window.__released[this.id] = { paused: this.paused, ended: this.ended, t: this.currentTime, d: this.duration };
          }
          return load.call(this);
        };
      };
      const page = await open({ routes: [...extra, ...withScene(T5)], init: [SLOW, AT_RELEASE] });
      try {
        await introStart(page);
        await assertMode(page, mode);
        await until(page, clipPlaying, 4000);
        await page.keyboard.press('Enter');
        await landed(page);
        const at = await page.evaluate(() => window.__released);
        const x = at['dash-clip'];
        assert.ok(x && x.paused && !x.ended && x.t > 0 && x.t < x.d - 0.05, `clip at release: ${JSON.stringify(at)}`);
        const v = await clipState(page);
        assert.ok(v.paused && v.src === null, JSON.stringify(v));
        await page.waitForTimeout(300);
        assert.equal((await clipState(page)).t, v.t, 'clip moved after the push-in');
        await assertEndState(page);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

// — Task 6: the rendered doll —
// Doll geometry from the plan: height, centre x and feet y as fractions of the cockpit picture.
const DOLL = { wide: { h: 0.25, cx: 0.45, feet: 0.445 }, tall: { h: 0.14, cx: 0.20, feet: 0.31 } };
const noDoll = [['**/assets/dash/doll-*', (r) => r.fulfill({ status: 404, body: 'not found' })]];
// The doll's box with its hop paused (the hop moves the whole box), plus the
// state that tells which doll is up.
async function dollBox(page) {
  return page.evaluate(() => {
    const d = document.querySelector('.dash-doll');
    const before = d.style.animation;
    d.style.animation = 'none';
    const r = d.getBoundingClientRect();
    d.style.animation = before;
    const ck = document.getElementById('dash-cockpit-img').getBoundingClientRect();
    return {
      left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
      cx: r.left + r.width / 2, rendered: d.classList.contains('dash-doll-rendered'),
      ckLeft: ck.left, ckWidth: ck.width, ckHeight: ck.height,
      svgTop: getComputedStyle(d.querySelector('.dash-doll-top')).display,
      svgBase: getComputedStyle(d.querySelector('.dash-doll-base')).display,
      imgs: [...d.querySelectorAll('.dash-doll-r')].map((i) => ({
        cls: i.className, display: getComputedStyle(i).display, ok: i.complete && i.naturalWidth > 0,
      })),
    };
  });
}
function assertDollGeometry(d, mode, label = '') {
  const k = DOLL[mode];
  const H = k.h * d.ckHeight;
  assert.equal(d.rendered, true, `${label}dash-doll-rendered`);
  assert.ok(Math.abs(d.bottom - k.feet * d.ckHeight) <= 2, `${label}feet ${d.bottom} vs ${k.feet * d.ckHeight}`);
  assert.ok(Math.abs(d.height - H) <= 2, `${label}height ${d.height} vs ${H}`);
  assert.ok(Math.abs(d.width - H * 1161 / 3092) <= 2, `${label}width ${d.width} vs ${H * 1161 / 3092}`);
  assert.ok(Math.abs(d.cx - (d.ckLeft + k.cx * d.ckWidth)) <= 2, `${label}centre x ${d.cx} vs ${d.ckLeft + k.cx * d.ckWidth}`);
}

describe('rendered doll', { concurrency: 1 }, () => {
  test('1440x900: both pieces loaded, drawn doll hidden, feet on the dash', async () => {
    const page = await open();
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertRendered(page, 'wide');
      const d = await dollBox(page);
      assertDollGeometry(d, 'wide');
      assert.ok(Math.abs(d.bottom - 0.445 * 900) <= 2 && Math.abs(d.height - 0.25 * 900) <= 2);
      assert.ok(Math.abs(d.cx - 0.45 * 1600) <= 2, `centre x ${d.cx}`);
      assert.deepEqual(d.imgs.map((i) => [i.cls, i.display, i.ok]), [
        ['dash-doll-r dash-doll-r-base', 'block', true], ['dash-doll-r dash-doll-r-top', 'block', true]]);
      assert.equal(d.svgTop, 'none');
      assert.equal(d.svgBase, 'none');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('2560x1080: the doll is centred on the cockpit, which starts at x = 320, not on the window', async () => {
    const page = await open({ viewport: { width: 2560, height: 1080 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertRendered(page, 'wide');
      const d = await dollBox(page);
      assert.ok(Math.abs(d.ckLeft - 320) <= 1 && Math.abs(d.ckWidth - 1920) <= 1, `cockpit ${d.ckLeft} ${d.ckWidth}`);
      assert.ok(Math.abs(d.cx - (320 + 0.45 * 1920)) <= 2, `centre x ${d.cx} vs ${320 + 0.45 * 1920}`);
      assertDollGeometry(d, 'wide');
    } finally {
      await done(page);
    }
  });

  test('390x844: doll height == 0.14 * (390*16/9), feet at 0.31 of the picture', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertRendered(page, 'tall');
      const d = await dollBox(page);
      assertDollGeometry(d, 'tall');
      assert.ok(Math.abs(d.height - 0.14 * (390 * 16 / 9)) <= 2, `height ${d.height}`);
      assert.ok(Math.abs(d.cx - 0.2 * 390) <= 2, `centre x ${d.cx}`);
      assert.equal(d.svgTop, 'none');
    } finally {
      await done(page);
    }
  });

  test('rendered doll keeps one size from first shown to the hold', async () => {
    const page = await open({
      init: [() => {
        window.__dollSizes = [];
        const tick = () => {
          const d = document.querySelector('.dash-doll');
          const h = document.documentElement.classList;
          if (d && d.classList.contains('dash-doll-rendered') && !h.contains('dash-loading') && h.contains('dash-intro')) {
            window.__dollSizes.push([d.offsetWidth, d.offsetHeight]);
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }],
    });
    try {
      await mounted(page);
      await page.waitForTimeout(2000);
      const sizes = await page.evaluate(() => window.__dollSizes);
      assert.ok(sizes.length > 20, `sampled ${sizes.length} frames`);
      for (const [w, h] of sizes) {
        assert.ok(Math.abs(w - sizes[0][0]) <= 1 && Math.abs(h - sizes[0][1]) <= 1, `size moved: ${sizes[0]} -> ${[w, h]}`);
      }
      assert.ok(Math.abs(sizes[0][1] - 0.25 * 900) <= 2, `first shown at ${sizes[0][1]}`);
    } finally {
      await done(page);
    }
  });

  for (const [name, routes] of [
    ['both doll images 404', noDoll],
    ['only the top 404', [['**/assets/dash/doll-top.webp', (r) => r.fulfill({ status: 404, body: 'not found' })]]],
    ['only the base 404', [['**/assets/dash/doll-base.webp', (r) => r.fulfill({ status: 404, body: 'not found' })]]],
  ]) {
    test(`${name}: drawn doll shows inside the rendered cockpit, no page errors`, async () => {
      const page = await open({ routes });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        await assertRendered(page, 'wide');
        const d = await dollBox(page);
        assert.equal(d.rendered, false);
        assert.deepEqual(d.imgs.map((i) => i.display), ['none', 'none']);
        assert.equal(d.svgTop, 'block');
        assert.equal(d.svgBase, 'block');
        // The drawn doll keeps its own rules (ruling D1): its own shape, not the rendered doll's 1161:3092.
        assert.ok(d.width / d.height > 0.5, `drawn doll box ${d.width} x ${d.height} (rendered doll is 1161:3092)`);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('paint order: the doll is over the cockpit picture at its feet', async () => {
    const page = await open();
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertRendered(page, 'wide');
      const p = await page.evaluate(() => {
        document.querySelector('.dash-doll').style.animation = 'none';
        const base = document.querySelector('.dash-doll-r-base');
        const img = document.getElementById('dash-cockpit-img');
        const px = (el, x, y) => {
          const c = document.createElement('canvas');
          c.width = el.naturalWidth; c.height = el.naturalHeight;
          const g = c.getContext('2d');
          g.drawImage(el, 0, 0);
          return g.getImageData(x, y, 1, 1).data[3];
        };
        // An opaque pixel of the base piece, low down: the feet.
        const r = base.getBoundingClientRect();
        let pt = null;
        for (let fy = 0.97; fy > 0.6 && !pt; fy -= 0.02) {
          for (let fx = 0.2; fx < 0.8 && !pt; fx += 0.02) {
            if (px(base, Math.floor(fx * base.naturalWidth), Math.floor(fy * base.naturalHeight)) > 250) {
              pt = [r.left + fx * r.width, r.top + fy * r.height];
            }
          }
        }
        if (!pt) return { pt };
        // The layers are pointer-events: none; let them take hits so the stack shows paint order.
        base.style.pointerEvents = 'auto';
        img.style.pointerEvents = 'auto';
        const ib = img.getBoundingClientRect();
        const stack = document.elementsFromPoint(pt[0], pt[1]);
        return {
          pt,
          cockpitAlpha: px(img, Math.floor((pt[0] - ib.left) / ib.width * img.naturalWidth),
            Math.floor((pt[1] - ib.top) / ib.height * img.naturalHeight)),
          base: stack.indexOf(base), img: stack.indexOf(img),
        };
      });
      const j = JSON.stringify(p);
      assert.ok(p.pt, `no opaque base pixel found: ${j}`);
      assert.ok(p.pt[1] > 0.412 * 900, `probe is below the windshield edge (0.412): ${j}`);
      assert.ok(p.cockpitAlpha > 200, `cockpit picture not opaque under the doll's feet: ${j}`);
      assert.ok(p.base >= 0 && p.img >= 0, j);
      assert.ok(p.base < p.img, `doll base under the cockpit picture: ${j}`);
    } finally {
      await done(page);
    }
  });

  test('resize across the 760px breakpoint: the doll follows the mode, wide and tall constants never mix', async () => {
    const page = await open();
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      assertDollGeometry(await dollBox(page), 'wide', '1440x900: ');
      // Larger window, same mode: the doll scales with the picture.
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(250);
      assertDollGeometry(await dollBox(page), 'wide', '1920x1080: ');
      // Phone width: the tall picture was never loaded, so drawn dashboard and drawn doll.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      await assertDrawn(page, '390x844: ');
      const drawn = await dollBox(page);
      assert.equal(drawn.rendered, false, 'rendered doll without the rendered cockpit');
      assert.equal(drawn.svgTop, 'block');
      // Back: wide constants again.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(250);
      await assertRendered(page, 'wide', 'back: ');
      assertDollGeometry(await dollBox(page), 'wide', 'back at 1440x900: ');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('resize from the phone: tall doll, then drawn doll on a wide window, then tall again', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await assertRendered(page, 'tall');
      assertDollGeometry(await dollBox(page), 'tall', '390x844: ');
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(250);
      await assertDrawn(page, '1440x900: ');
      assert.equal((await dollBox(page)).rendered, false);
      await page.setViewportSize({ width: 360, height: 740 });
      await page.waitForTimeout(250);
      await assertRendered(page, 'tall', '360x740: ');
      assertDollGeometry(await dollBox(page), 'tall', '360x740: ');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('doll image slower than the dark wait: drawn doll for the whole intro, never swapped late', async () => {
    const slow = (r) => setTimeout(() => r.continue().catch(() => {}), 2500);
    const page = await open({ routes: [['**/assets/dash/doll-top.webp', slow]] });
    try {
      await introStart(page);
      await assertRendered(page, 'wide', 'at intro start: ');
      assert.equal((await dollBox(page)).rendered, false, 'doll shown before its pieces loaded');
      await until(page, () => {
        const i = document.querySelector('.dash-doll-r-top');
        return i.complete && i.naturalWidth > 0;
      }, 6000);
      const late = await page.evaluate(() => {
        const e = performance.getEntriesByType('resource').find((x) => /doll-top/.test(x.name));
        return { loaded: e ? e.responseEnd : null, introStart: window.__marks.introStart };
      });
      assert.ok(late.loaded > late.introStart, `doll arrived before the page showed: ${JSON.stringify(late)}`);
      assert.equal((await dollBox(page)).rendered, false, 'doll swapped after the late load');
      await page.setViewportSize({ width: 1400, height: 880 });
      await page.waitForTimeout(150);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(150);
      const d = await dollBox(page);
      assert.equal(d.rendered, false, 'doll swapped after a resize');
      assert.equal(d.svgTop, 'block');
      await assertFrameFitsGrid(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('cockpit 404 with both doll images fine: drawn dashboard, drawn doll, never the rendered doll', async () => {
    const page = await open({ routes: noCockpit });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      await assertDrawn(page);
      const d = await dollBox(page);
      assert.equal(d.rendered, false);
      assert.deepEqual(d.imgs.map((i) => i.display), ['none', 'none']);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('1280x1024: drawn dashboard, the doll pieces are never requested', async () => {
    const page = await open({ viewport: { width: 1280, height: 1024 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      assert.deepEqual(page.requested.filter((u) => /doll-/.test(u)), []);
      assert.equal((await dollBox(page)).rendered, false);
    } finally {
      await done(page);
    }
  });

  test('swaying: the top piece turns about the spring, the base stays put', async () => {
    const page = await open();
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      const s = await page.evaluate(() => {
        const top = document.querySelector('.dash-doll-r-top');
        const base = document.querySelector('.dash-doll-r-base');
        return {
          name: getComputedStyle(top).animationName, baseName: getComputedStyle(base).animationName,
          origin: getComputedStyle(top).transformOrigin, w: top.offsetWidth, h: top.offsetHeight,
        };
      });
      assert.equal(s.name, 'dash-dance');
      assert.equal(s.baseName, 'none');
      const [ox, oy] = s.origin.split(' ').map(parseFloat);
      assert.ok(Math.abs(ox / s.w - 0.4953) < 0.005 && Math.abs(oy / s.h - 0.7733) < 0.005, s.origin);
    } finally {
      await done(page);
    }
  });
});

// — Task 7: the real Miami Beach scene, its files and its weight —
// These tests use the scene entry in src/dashboard-scenes.js and the real files. Playwright's Chromium
// may not decode H.264, so they assert on requests and on the still, not on playback.
const MB = 'assets/dash/scenes/miami-beach/';
const REAL = (page) => page.requested.filter((u) => /\/(still|clip)-\d+\./.test(u) || /\/cockpit-/.test(u) || /\/doll-/.test(u));
const realName = (u) => new URL(u).pathname.split('/').pop();
const isRealClip = (u) => /\/miami-beach\/clip-\d+\.mp4$/.test(u);
// State of the windshield at the moment the page stops being dark.
const firstShownStill = () => {
  let sawLoading = false;
  new MutationObserver((_, obs) => {
    const h = document.documentElement;
    if (h.classList.contains('dash-loading')) { sawLoading = true; return; }
    if (!sawLoading) return;
    const still = document.getElementById('dash-still');
    window.__firstStill = {
      ready: still.complete && still.naturalWidth > 0 && !still.hidden,
      src: still.getAttribute('src'),
      rendered: h.classList.contains('dash-rendered'),
    };
    obs.disconnect();
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
};
const sizeOf = async (f) => (await fs.stat(path.join(SRC, f))).size;

describe('miami beach, real files', { concurrency: 1 }, () => {
  test('query strings in index.html are the bumped ones', async () => {
    const html = await fs.readFile(path.join(SRC, 'index.html'), 'utf8');
    assert.match(html, /href="dashboard-intro\.css\?v=7"/);
    assert.match(html, /src="dashboard-scenes\.js\?v=2"/);
    assert.match(html, /src="dashboard-intro\.js\?v=6"/);
  });

  test('1440x900: rendered, still shown at the first frame, then clip-1920 requested', async () => {
    const page = await open({ init: [firstShownStill] });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      const first = await page.evaluate(() => window.__firstStill);
      assert.deepEqual(first, { ready: true, src: MB + 'still-1920.jpg', rendered: true });
      const t0 = Date.now();
      while (!page.requested.some(isRealClip) && Date.now() - t0 < 5000) await page.waitForTimeout(50);
      const reqs = page.requested;
      const iStill = reqs.findIndex((u) => /still-1920\.jpg$/.test(u)), iClip = reqs.findIndex(isRealClip);
      assert.ok(iStill !== -1 && iClip !== -1 && iStill < iClip, `still, then clip: ${REAL(page).map(realName).join(' ')}`);
      assert.match(reqs[iClip], /\/clip-1920\.mp4$/);
      assert.equal(await page.evaluate(() => document.getElementById('dash-still').hidden === false), true, 'still stays under the clip');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('390x844: requests still-960 and clip-960 and no 1920 file', async () => {
    const page = await open({ viewport: { width: 390, height: 844 }, init: [firstShownStill] });
    try {
      await introStart(page);
      await assertRendered(page, 'tall');
      const t0 = Date.now();
      while (!page.requested.some(isRealClip) && Date.now() - t0 < 5000) await page.waitForTimeout(50);
      const names = REAL(page).map(realName);
      for (const want of ['still-960.jpg', 'clip-960.mp4', 'cockpit-tall-1080.webp', 'doll-top.webp', 'doll-base.webp']) {
        assert.ok(names.includes(want), `${want} not requested: ${names.join(' ')}`);
      }
      assert.deepEqual(names.filter((n) => /1920|2560|3840/.test(n)), [], 'a large file was requested on a phone');
      assert.equal((await page.evaluate(() => window.__firstStill)).src, MB + 'still-960.jpg');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [label, opts] of [['?p=0', { path: '/?p=0' }], ['reduced motion', { reduced: true }]]) {
    test(`real scene, skipped intro (${label}): no clip-* requested`, async () => {
      const page = await open(opts);
      try {
        await until(page, () => document.body.classList.contains('grid-active') || document.body.classList.contains('project-view'), 8000);
        await page.waitForTimeout(1500);
        assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played');
        assert.deepEqual(page.requested.filter((u) => /\/clip-\d+\./.test(u)), []);
        assert.equal(await page.getAttribute('#dash-clip', 'src'), null);
      } finally {
        await done(page);
      }
    });
  }

  // The brief's limits "760 KB" and "420 KB" are counted in KiB (1024 bytes).
  // Cockpit, still and the doll's two pieces.
  test('first-load weight: laptop <= 760 KiB, phone <= 420 KiB', async () => {
    const dash = 'assets/dash/';
    const doll = (await sizeOf(dash + 'doll-top.webp')) + (await sizeOf(dash + 'doll-base.webp'));
    const laptop = (await sizeOf(dash + 'cockpit-wide-2560.webp')) + (await sizeOf(MB + 'still-1920.jpg')) + doll;
    const phone = (await sizeOf(dash + 'cockpit-tall-1080.webp')) + (await sizeOf(MB + 'still-960.jpg')) + doll;
    assert.ok(laptop <= 760 * 1024, `laptop ${laptop} bytes`);
    assert.ok(phone <= 420 * 1024, `phone ${phone} bytes`);
  });
});

// — Removed: the foreground layer (cut-out picture and moving cut-out over the scene). —
// These keep it from coming back.
const FG_FIELDS = ['foreground', 'foregroundSmall', 'foregroundClip', 'foregroundClipSmall'];
const FG_FILES = [
  ...['fg-1920.webp', 'fg-960.webp', 'fgclip-1920.webm', 'fgclip-960.webm', 'fgclip-1920.mov', 'fgclip-960.mov']
    .map((f) => path.join(SRC, MB, f)),
  ...['fg.webp', 'fgclip.webm', 'fgclip-opaque.webm'].map((f) => path.join(FIXTURES, f)),
];

describe('no foreground layer', { concurrency: 1 }, () => {
  test('no #dash-fgbox, #dash-fg or #dash-fgclip in the DOM', async () => {
    const page = await open();
    try {
      await mounted(page);
      assert.equal(await page.locator('#dash-fgbox, #dash-fg, #dash-fgclip').count(), 0);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('the scene has none of the four foreground fields', async () => {
    const page = await open({ seen: true });
    try {
      const found = await page.evaluate((keys) => window.DashScenes.scenes.flatMap((s) => keys.filter((k) => k in s)), FG_FIELDS);
      assert.deepEqual(found, []);
    } finally {
      await done(page);
    }
  });

  test('DashIntro exposes nothing named after the foreground', async () => {
    const page = await open({ seen: true });
    try {
      const keys = await page.evaluate(() => Object.keys(window.DashIntro));
      assert.deepEqual(keys.filter((k) => /fg|foreground|cut|pair|webkit|clear|drift|sized/i.test(k)), [], keys.join(' '));
    } finally {
      await done(page);
    }
  });

  test('the nine foreground files are not on disk', async () => {
    const present = [];
    for (const f of FG_FILES) {
      try { await fs.access(f); present.push(path.relative(path.join(HERE, '..'), f)); } catch {}
    }
    assert.deepEqual(present, []);
  });

  for (const [w, h] of [[1440, 900], [390, 844]]) {
    test(`real scene at ${w}x${h}: no /fg- or /fgclip- request`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await introStart(page);
        const t0 = Date.now();
        while (!page.requested.some(isRealClip) && Date.now() - t0 < 5000) await page.waitForTimeout(50);
        await page.waitForTimeout(1000);
        assert.deepEqual(page.requested.filter((u) => /\/fg-|\/fgclip-/.test(u)), []);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('local server byte ranges', () => {
  const url = () => server.url + '/assets/dash/scenes/miami-beach/clip-960.mp4';
  test('plain request: 200, full length, Accept-Ranges', async () => {
    const size = await sizeOf(MB + 'clip-960.mp4');
    const res = await fetch(url());
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('accept-ranges'), 'bytes');
    assert.equal(res.headers.get('content-length'), String(size));
    assert.equal((await res.arrayBuffer()).byteLength, size);
  });
  test('bytes=0-1: 206, two bytes, Content-Range', async () => {
    const size = await sizeOf(MB + 'clip-960.mp4');
    const whole = await fs.readFile(path.join(SRC, MB + 'clip-960.mp4'));
    const res = await fetch(url(), { headers: { Range: 'bytes=0-1' } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('content-range'), `bytes 0-1/${size}`);
    assert.equal(res.headers.get('content-length'), '2');
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), whole.subarray(0, 2));
  });
  test('bytes=a-: open-ended, to the last byte', async () => {
    const size = await sizeOf(MB + 'clip-960.mp4');
    const a = size - 1000;
    const res = await fetch(url(), { headers: { Range: `bytes=${a}-` } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('content-range'), `bytes ${a}-${size - 1}/${size}`);
    assert.equal((await res.arrayBuffer()).byteLength, 1000);
  });
  test('bytes=-n: the last n bytes', async () => {
    const size = await sizeOf(MB + 'clip-960.mp4');
    const whole = await fs.readFile(path.join(SRC, MB + 'clip-960.mp4'));
    const res = await fetch(url(), { headers: { Range: 'bytes=-500' } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get('content-range'), `bytes ${size - 500}-${size - 1}/${size}`);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), whole.subarray(size - 500));
  });
  test('range past the end: 416 with Content-Range bytes */size', async () => {
    const size = await sizeOf(MB + 'clip-960.mp4');
    const res = await fetch(url(), { headers: { Range: `bytes=${size}-` } });
    assert.equal(res.status, 416);
    assert.equal(res.headers.get('content-range'), `bytes */${size}`);
  });
});

describe('known deviation (P1)', () => {
  // Samples the doll base and the screen over one and a bit hop periods (1.6 s) and returns the largest overlap.
  async function overlap(w, h) {
    const page = await open({ viewport: { width: w, height: h } });
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      return await page.evaluate(() => new Promise((resolve) => {
        const base = document.querySelector('.dash-doll-r-base'), screen = document.getElementById('dash-screen');
        let ow = 0, oh = 0, minBottom = Infinity, maxBottom = -Infinity, n = 0;
        const t0 = performance.now();
        const tick = setInterval(() => {
          const b = base.getBoundingClientRect(), s = screen.getBoundingClientRect();
          ow = Math.max(ow, Math.min(b.right, s.right) - Math.max(b.left, s.left));
          oh = Math.max(oh, Math.min(b.bottom, s.bottom) - Math.max(b.top, s.top));
          minBottom = Math.min(minBottom, b.bottom); maxBottom = Math.max(maxBottom, b.bottom); n++;
          if (performance.now() - t0 > 1800) { clearInterval(tick); resolve({ ow, oh, hop: maxBottom - minBottom, n }); }
        }, 40);
      }));
    } finally {
      await done(page);
    }
  }
  test('known deviation (P1): doll base overlaps the screen corner at 1440x900, not at 1920x1080', async () => {
    const small = await overlap(1440, 900);
    const s = JSON.stringify(small);
    assert.ok(small.hop > 5, `the doll did not hop while sampled: ${s}`);
    assert.ok(small.ow > 0 && small.oh > 0, `no overlap at 1440x900 (the accepted deviation changed): ${s}`);
    assert.ok(small.ow <= 60 && small.oh <= 20, `overlap grew past 60 x 20 px: ${s}`);
    const big = await overlap(1920, 1080);
    assert.ok(big.hop > 5, `the doll did not hop while sampled: ${JSON.stringify(big)}`);
    assert.ok(big.ow <= 0 || big.oh <= 0, `overlap at 1920x1080: ${JSON.stringify(big)}`);
  });
});
