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
      ...['still-1920.jpg', 'still-960.jpg', 'clip-1920.mp4', 'clip-960.mp4', 'fg-1920.webp', 'fg-960.webp',
          'fgclip-1920.webm', 'fgclip-960.webm', 'fgclip-1920.mov', 'fgclip-960.mov'].map((f) => 'assets/dash/scenes/miami-beach/' + f)];
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
// userAgent, init (extra init scripts, functions).
async function open({ viewport = { width: 1440, height: 900 }, routes = [], path: p = '/', seen = false, reduced = false, userAgent, init = [] } = {}) {
  const context = await browser.newContext({ viewport, userAgent, reducedMotion: reduced ? 'reduce' : 'no-preference' });
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
    test(`paint order at ${w}x${h}: mirror glass under the cockpit; minimap, doll, screen and Wire Omar over it`, async () => {
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
            mirror: centre('.dash-mirror-glass'),
            minimap: centre('.dash-minimap'),
            doll: [doll.left + doll.width / 2, doll.top + doll.height * (dollOn ? 0.92 : 0.75)],
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
              in: top ? ['.dash-minimap', '.dash-doll', '#dash-wire', '#dash-screen', '.dash-mirror-glass', '#dash-cockpit-img']
                .filter((s) => top.closest(s)) : [],
              imgAt: stack.indexOf(img),
              glassAt: stack.findIndex((el) => el.classList && el.classList.contains('dash-mirror-glass')),
            };
          }
          img.style.pointerEvents = '';
          return out;
        });
        const p = JSON.stringify(probes);
        assert.equal(probes.opaque.top, '#dash-cockpit-img', p);
        assert.ok(probes.opaque.alpha > 200, `cockpit not opaque at the probe: ${p}`);
        // Mirror glass: the cockpit image is on top, and see-through there, with the glass under it.
        assert.equal(probes.mirror.top, '#dash-cockpit-img', p);
        assert.ok(probes.mirror.alpha < 20, `mirror glass not see-through in the image: ${p}`);
        assert.ok(probes.mirror.glassAt > probes.mirror.imgAt, `glass not under the cockpit: ${p}`);
        assert.ok(probes.minimap.in.includes('.dash-minimap'), p);
        assert.ok(probes.doll.in.includes('.dash-doll'), p);
        assert.ok(probes.doll.imgAt > 0, `cockpit image not under the doll: ${p}`);
        assert.ok(probes.wire.in.includes('#dash-wire'), p);
        assert.equal(probes.screen.top, '#dash-screen', p);
        assert.equal(probes.screen.imgAt, -1, `cockpit image covers the screen: ${p}`);
        if (mode === 'wide') {
          assert.ok(probes.wire.alpha > 200, `Wire Omar not on an opaque button: ${p}`);
          assert.ok(probes.doll.alpha > 200, `doll not standing on the dash: ${p}`);
          assert.ok(probes.wire.imgAt > 0, `cockpit image not under Wire Omar: ${p}`);
        }
        // The mirror glass sits at the measured rect, in the shield's coordinates.
        const ck = await rect(page, '#dash-cockpit-img');
        const g = await rect(page, '.dash-mirror-glass');
        const want = mode === 'wide' ? [0.405, 0.046, 0.189, 0.076] : [0.362, 0.057, 0.275, 0.037];
        const got = [(g.left - ck.left) / ck.width, (g.top - ck.top) / ck.height, g.width / ck.width, g.height / ck.height];
        got.forEach((v, i) => assert.ok(Math.abs(v - want[i]) * (i % 2 ? ck.height : ck.width) <= 1, `mirror ${got} vs ${want}`));
        assert.equal(await css(page, '.dash-mirror-stem', 'display'), 'none');
        assert.equal(await css(page, '.dash-mirror-glass', 'borderTopWidth'), '0px');
        // Minimap: 7% of the cockpit's width in from the visible right edge of the image.
        const mm = await rect(page, '.dash-minimap');
        assert.ok(Math.abs(mm.right - (Math.min(w, ck.right) - 0.07 * ck.width)) <= 1, `minimap right ${mm.right}`);
        assert.notEqual(await css(page, '.dash-doll', 'display'), 'none');
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

// — Task 4: scene box, foreground cut-out, banner between them —
// Copied from scene-system.test.mjs and extended: serves .webp and .webm too.
const MEDIA_TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
function withScene(scene) {
  const body = `window.DashScenes = { scenes: [${JSON.stringify({ id: 'test-scene', timezone: 'America/New_York', ...scene })}], banners: [] };`;
  return [
    ['**/dashboard-scenes.js*', (r) => r.fulfill({ contentType: 'text/javascript', body })],
    ['**/test-media/**', async (r) => {
      const name = path.basename(new URL(r.request().url()).pathname).replace('-small', '');
      try {
        const buf = await fs.readFile(path.join(FIXTURES, name));
        const contentType = MEDIA_TYPES[path.extname(name)] || 'application/octet-stream';
        // Answer byte ranges as a real host does: without them Chrome cannot seek a video (Task 5 drift test).
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
const T4_FG = 'test-media/fg.webp';
const media = (page) => page.requested.filter((u) => /test-media/.test(u));
const noCockpit = [['**/cockpit-*', (r) => r.fulfill({ status: 404, body: 'not found' })]];
const fgReady = () => {
  const i = document.getElementById('dash-fg');
  return i.complete && i.naturalWidth > 0 && !i.hidden;
};

describe('scene box and foreground', { concurrency: 1 }, () => {
  test('rendered: still, then banner, then foreground, in that paint order', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, foreground: T4_FG }) });
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      await until(page, fgReady, 4000);
      assert.equal(await css(page, '#dash-drawn', 'display'), 'none');
      const fb = await rect(page, '#dash-fgbox');
      const sb = await rect(page, '#dash-scenebox');
      for (const k of ['left', 'top', 'width']) assert.ok(Math.abs(fb[k] - sb[k]) <= 0.5, `${k}: ${fb[k]} vs ${sb[k]}`);
      assert.ok(Math.abs(fb.height - sb.height) <= 0.5, 'boxes share height');
      const fg = await rect(page, '#dash-fg');
      assert.ok(Math.abs(fg.height - 0.62136 * sb.height) <= 1, `fg height ${fg.height} vs ${0.62136 * sb.height}`);
      assert.ok(Math.abs(fg.left - sb.left) <= 0.5 && Math.abs(fg.width - sb.width) <= 0.5 && Math.abs(fg.top - sb.top) <= 0.5);
      const order = await page.evaluate(() => [...document.getElementById('dash-view').children].map((el) => el.id || el.className));
      assert.deepEqual(order, ['dash-scenebox', 'dash-banner', 'dash-fgbox']);
      const view = await rect(page, '#dash-view');
      assert.ok(sb.left <= view.left + 0.5 && sb.top <= view.top + 0.5 && sb.right >= view.right - 0.5 && sb.bottom >= view.bottom - 0.5,
        `scene box ${JSON.stringify(sb)} covers view ${JSON.stringify(view)}`);
      // Paint order by hit-testing: park the plane in the middle of the view, on a
      // point where the foreground is opaque, and read the stack top-down.
      const stacks = await page.evaluate(async () => {
        const fgEl = document.getElementById('dash-fg');
        const c = document.createElement('canvas');
        c.width = fgEl.naturalWidth; c.height = fgEl.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(fgEl, 0, 0);
        const r = fgEl.getBoundingClientRect();
        const v = document.getElementById('dash-view').getBoundingClientRect();
        let opaque = null, clear = null;
        for (let y = 0; y < c.height && !(opaque && clear); y += 8) {
          for (let x = 0; x < c.width && !(opaque && clear); x += 8) {
            const a = cx.getImageData(x, y, 1, 1).data[3];
            const px = r.left + (x / c.width) * r.width, py = r.top + (y / c.height) * r.height;
            if (px < v.left + 2 || px > v.right - 2 || py < v.top + 2 || py > v.bottom - 2) continue;
            // Stay clear of the mirror and minimap, which sit over the scene.
            const hit = document.elementsFromPoint(px, py).map((e) => e.id || e.className);
            if (hit.some((h) => /mirror|minimap|doll/.test(String(h)))) continue;
            if (a === 255 && !opaque) opaque = { px, py };
            if (a === 0 && !clear) clear = { px, py };
          }
        }
        // Freeze the banner so that it covers both points.
        const fly = document.querySelector('.dash-fly');
        const banner = document.querySelector('.dash-banner');
        const bb = banner.getBoundingClientRect();
        fly.style.animation = 'none';
        fly.style.left = '0';
        fly.style.transform = 'none';
        const names = (p) => p && document.elementsFromPoint(p.px, p.py).map((e) => e.id || (typeof e.className === 'string' ? e.className : ''));
        // Point inside the banner box, over the headline.
        const hl = document.querySelector('.dash-headline').getBoundingClientRect();
        const over = { px: hl.left + hl.width / 2, py: hl.top + hl.height / 2 };
        return { opaque: names(opaque), clear: names(clear), banner: names(over), bb: { l: bb.left, t: bb.top }, hasOpaque: !!opaque, hasClear: !!clear, over };
      });
      assert.ok(stacks.hasOpaque && stacks.hasClear, 'fixture has opaque and transparent pixels in view');
      const idx = (list, re) => list.findIndex((n) => re.test(n));
      // Where the foreground is opaque it is above the still; the still is the element under it.
      assert.ok(idx(stacks.opaque, /^dash-fg$/) !== -1 && idx(stacks.opaque, /^dash-still$/) !== -1, JSON.stringify(stacks.opaque));
      assert.ok(idx(stacks.opaque, /^dash-fg$/) < idx(stacks.opaque, /^dash-still$/), 'foreground above still');
      // Computed stacking guarantees banner between: banner above the scene box, fg box above banner.
      const z = await page.evaluate(() => {
        const get = (s) => {
          const el = document.querySelector(s);
          const cs = getComputedStyle(el);
          return { z: cs.zIndex, pos: cs.position };
        };
        const all = [...document.querySelectorAll('#dash-scenebox, .dash-banner, #dash-fgbox')];
        return { scene: get('#dash-scenebox'), banner: get('.dash-banner'), fg: get('#dash-fgbox'), order: all.map((e) => e.id || e.className) };
      });
      assert.equal(z.banner.z, '1');
      assert.equal(z.fg.z, '1');
      assert.equal(z.fg.pos, 'absolute');
      assert.equal(z.scene.z, 'auto');
      // Banner headline sits above the still in the hit stack, and below the foreground box (same z, later in DOM).
      assert.ok(idx(stacks.banner, /dash-headline|dash-fly|dash-banner/) !== -1);
      assert.ok(idx(stacks.banner, /dash-headline|dash-fly|dash-banner/) < idx(stacks.banner, /^dash-still$/), 'banner above still');
      // Where the foreground is opaque and a banner passes, the foreground wins: put the plane under an opaque point.
      const wins = await page.evaluate(() => {
        const fgEl = document.getElementById('dash-fg');
        const c = document.createElement('canvas');
        c.width = fgEl.naturalWidth; c.height = fgEl.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(fgEl, 0, 0);
        const r = fgEl.getBoundingClientRect();
        const banner = document.querySelector('.dash-banner').getBoundingClientRect();
        const hl = document.querySelector('.dash-headline').getBoundingClientRect();
        // Scan the headline's box for a point where the foreground is opaque.
        for (let py = hl.top + 2; py < hl.bottom - 2; py += 3) {
          for (let px = Math.max(hl.left, banner.left) + 2; px < Math.min(hl.right, banner.right) - 2; px += 3) {
            const x = Math.floor(((px - r.left) / r.width) * c.width), y = Math.floor(((py - r.top) / r.height) * c.height);
            if (y < 0 || y >= c.height || x < 0 || x >= c.width) continue;
            if (cx.getImageData(x, y, 1, 1).data[3] === 255) {
              const names = document.elementsFromPoint(px, py).map((e) => e.id || (typeof e.className === 'string' ? e.className : ''));
              return { found: true, names };
            }
          }
        }
        return { found: false };
      });
      if (wins.found) {
        const iFg = wins.names.findIndex((n) => /^dash-fg$|dash-fgbox/.test(n));
        const iBn = wins.names.findIndex((n) => /dash-headline|dash-fly|dash-banner/.test(n));
        assert.ok(iFg !== -1 && iFg < iBn, `foreground over banner: ${JSON.stringify(wins.names)}`);
      }
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('foreground 404: still stays, no page errors', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, foreground: 'test-media/missing.webp' }) });
    try {
      await mounted(page);
      await assertRendered(page, 'wide');
      await page.waitForTimeout(500);
      const s = await page.evaluate(() => {
        const still = document.getElementById('dash-still');
        return { fgHidden: document.getElementById('dash-fg').hidden, stillShown: still.complete && still.naturalWidth > 0 && !still.hidden };
      });
      assert.equal(s.fgHidden, true);
      assert.equal(s.stillShown, true);
      assert.equal(await css(page, '#dash-drawn', 'display'), 'none');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('fallback (cockpit 404): #dash-fgbox display none, still fills the shield as on main', async () => {
    const page = await open({ routes: [...noCockpit, ...withScene({ still: T4_STILL, foreground: T4_FG })] });
    try {
      await mounted(page);
      await page.waitForTimeout(400);
      await assertDrawn(page);
      assert.equal(await css(page, '#dash-fgbox', 'display'), 'none');
      assert.equal(await css(page, '#dash-fgclip', 'display'), 'none');
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
      // The banner still paints against the mirror, doll and minimap as on main: same z as before, one stacking level.
      assert.equal(await css(page, '.dash-banner', 'zIndex'), '1');
      assert.equal(await page.evaluate(() => document.querySelector('.dash-banner').parentElement.id), 'dash-view');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('window too small for the cockpit: drawn dashboard, foreground never requested', async () => {
    const page = await open({ viewport: { width: 1280, height: 1024 }, routes: withScene({ still: T4_STILL, foreground: T4_FG }) });
    try {
      await mounted(page);
      await page.waitForTimeout(400);
      await assertDrawn(page);
      assert.equal(await css(page, '#dash-fgbox', 'display'), 'none');
      assert.deepEqual(media(page).filter((u) => /fg/.test(u)), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('phone uses stillSmall and foregroundSmall', async () => {
    const page = await open({
      viewport: { width: 390, height: 844 },
      routes: withScene({ still: 'test-media/missing-big.jpg', stillSmall: T4_STILL, foreground: 'test-media/missing-big.webp', foregroundSmall: T4_FG }),
    });
    try {
      await mounted(page);
      await assertRendered(page, 'tall');
      await until(page, fgReady, 4000);
      const got = await page.evaluate(() => [document.getElementById('dash-still').currentSrc, document.getElementById('dash-fg').currentSrc]);
      assert.match(got[0], /test-media\/still\.jpg$/);
      assert.match(got[1], /test-media\/fg\.webp$/);
      assert.deepEqual(media(page).filter((u) => /big/.test(u)), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('desktop ignores stillSmall and foregroundSmall', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, stillSmall: 'test-media/missing-small.jpg', foreground: T4_FG, foregroundSmall: 'test-media/missing-small.webp' }) });
    try {
      await mounted(page);
      await until(page, fgReady, 4000);
      assert.deepEqual(media(page).filter((u) => /missing/.test(u)), []);
    } finally {
      await done(page);
    }
  });

  for (const [w, h, mode] of [[1440, 900, 'wide'], [390, 844, 'tall']]) {
    test(`banner headline is in view at some point in the hold, rendered, ${w}x${h}`, async () => {
      const page = await open({ viewport: { width: w, height: h }, routes: withScene({ still: T4_STILL, foreground: T4_FG }) });
      try {
        await mounted(page);
        await assertRendered(page, mode);
        const seen = await page.evaluate(() => new Promise((resolve) => {
          const t0 = performance.now();
          const hl = document.querySelector('.dash-headline');
          const banner = document.querySelector('.dash-banner');
          (function tick() {
            const a = hl.getBoundingClientRect(), b = banner.getBoundingClientRect();
            const vis = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const visH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (vis > 0.5 * a.width && visH > 0.5 * a.height && b.width > 0) return resolve({ ok: true, t: performance.now() - t0 });
            if (performance.now() - t0 > 4000) return resolve({ ok: false, a: [a.left, a.right, a.top, a.bottom], b: [b.left, b.right, b.top, b.bottom] });
            requestAnimationFrame(tick);
          })();
        }));
        assert.ok(seen.ok, JSON.stringify(seen));
        const b = await rect(page, '.dash-banner');
        const shield = await rect(page, '#dash-shield');
        assert.ok(b.top >= shield.top && b.bottom <= shield.bottom, `banner ${b.top}-${b.bottom} inside shield ${shield.top}-${shield.bottom}`);
      } finally {
        await done(page);
      }
    });
  }
});

// Task 5: the moving cut-out gates the clip.
// Fixtures: clip.webm is the clip; fgclip.webm has alpha, fgclip-opaque.webm has none. foregroundClip is a path
// without extension: the page asks for .webm here (Chromium) and .mov on WebKit.
const T5 = { still: T4_STILL, foreground: T4_FG, clip: 'test-media/clip.webm', foregroundClip: 'test-media/fgclip' };
const isClip = (u) => /\/test-media\/clip\.webm$/.test(u);
const isCut = (u) => /\/test-media\/[^/]*fgclip/.test(u);
const clipRequests = (page) => page.requested.filter(isClip);
const cutRequests = (page) => page.requested.filter(isCut);
// The fixtures are 1s long. Stretch them (test only) so there is time to act while they play.
const SLOW = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.playbackRate = 0.2; return play.call(this); };
};
const pairPlaying = () => {
  const c = document.getElementById('dash-clip'), f = document.getElementById('dash-fgclip');
  return !c.hidden && !f.hidden && c.currentTime > 0 && f.currentTime > 0;
};
async function videos(page) {
  return page.evaluate(() => {
    const v = (id) => {
      const el = document.getElementById(id);
      return { hidden: el.hidden, src: el.getAttribute('src'), t: el.currentTime, d: el.duration, paused: el.paused, ended: el.ended, loop: el.loop };
    };
    const still = document.getElementById('dash-still');
    const fg = document.getElementById('dash-fg');
    return {
      clip: v('dash-clip'), cut: v('dash-fgclip'),
      fgShown: fg.complete && fg.naturalWidth > 0 && !fg.hidden,
      stillShown: still.complete && still.naturalWidth > 0 && !still.hidden,
    };
  });
}
// Still and poster cut-out on screen, both videos hidden, the clip never requested.
async function assertStillStays(page) {
  const v = await videos(page);
  const s = JSON.stringify(v);
  assert.equal(v.stillShown, true, s);
  assert.equal(v.fgShown, true, s);
  assert.equal(v.clip.hidden, true, s);
  assert.equal(v.cut.hidden, true, s);
  assert.equal(v.clip.src, null, s);
  assert.deepEqual(clipRequests(page), []);
  assert.deepEqual(page.errors, []);
}

describe('moving cut-out', { concurrency: 1 }, () => {
  test('rendered: cut-out and clip start together and play once', async () => {
    const page = await open({ routes: withScene(T5) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      const run = await page.evaluate(() => new Promise((resolve) => {
        const c = document.getElementById('dash-clip'), f = document.getElementById('dash-fgclip');
        const fg = document.getElementById('dash-fg');
        const t0 = performance.now();
        (function wait() {
          const on = !c.hidden && !f.hidden && c.currentTime > 0 && f.currentTime > 0;
          if (!on) {
            if (performance.now() - t0 > 4000) return resolve({ started: null });
            return requestAnimationFrame(wait);
          }
          const started = performance.now() - window.__marks.introStart;
          const samples = [];
          (function sample() {
            samples.push({ diff: Math.abs(c.currentTime - f.currentTime), clipShown: !c.hidden, cutShown: !f.hidden, fgHidden: fg.hidden, t: c.currentTime });
            if (samples.length < 5) setTimeout(sample, 60); else resolve({ started, samples, loop: [c.loop, f.loop] });
          })();
        })();
      }));
      const r = JSON.stringify(run);
      assert.ok(run.started !== null && run.started <= 3000, `pair not playing within 3s of intro start: ${r}`);
      assert.deepEqual(run.loop, [false, false], r);
      for (const s of run.samples) {
        assert.ok(s.diff < 0.1, `clip and cut-out apart: ${r}`);
        assert.ok(s.clipShown && s.cutShown && s.fgHidden, `layers while playing: ${r}`);
      }
      // The moving cut-out fills the poster's box: top 62.136% of the scene box, stretched to it.
      const fb = await rect(page, '#dash-fgbox');
      const fc = await rect(page, '#dash-fgclip');
      for (const k of ['left', 'top', 'width']) assert.ok(Math.abs(fc[k] - fb[k]) <= 0.5, `fgclip ${k}: ${fc[k]} vs ${fb[k]}`);
      assert.ok(Math.abs(fc.height - 0.62136 * fb.height) <= 1, `fgclip height ${fc.height}`);
      assert.equal(await css(page, '#dash-fgclip', 'objectFit'), 'fill');
      // Request order: the cut-out first, the clip only after it passed.
      const reqs = page.requested;
      const iCut = reqs.findIndex(isCut), iClip = reqs.findIndex(isClip);
      assert.ok(iCut !== -1 && iClip !== -1 && iCut < iClip, `request order: ${media(page).join(' ')}`);
      assert.match(reqs[iCut], /\/test-media\/fgclip\.webm$/);
      // Plays once: both end, and stay at the end.
      await until(page, () => document.getElementById('dash-clip').ended && document.getElementById('dash-fgclip').ended, 4000);
      await page.waitForTimeout(400);
      const v = await videos(page);
      for (const x of [v.clip, v.cut]) assert.ok(x.ended && !x.loop && x.t >= x.d - 0.05, JSON.stringify(v));
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('opaque cut-out: clip never requested, still and #dash-fg stay', async () => {
    const page = await open({ routes: withScene({ ...T5, foregroundClip: 'test-media/fgclip-opaque' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      await until(page, () => performance.now() - window.__marks.introStart > 2500, 5000);
      assert.ok(cutRequests(page).some((u) => /fgclip-opaque\.webm$/.test(u)), 'cut-out was not requested');
      await assertStillStays(page);
    } finally {
      await done(page);
    }
  });

  test('cut-out 404: clip never requested', async () => {
    const page = await open({ routes: withScene({ ...T5, foregroundClip: 'test-media/missing-fgclip' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      await until(page, () => performance.now() - window.__marks.introStart > 2500, 5000);
      assert.ok(cutRequests(page).some((u) => /missing-fgclip\.webm$/.test(u)), 'cut-out was not requested');
      await assertStillStays(page);
    } finally {
      await done(page);
    }
  });

  test('cut-out without loadeddata for 4000ms: given up, clip never requested', async () => {
    // The cut-out answers after 4500ms: it would pass the check if the page still waited for it.
    const late = ['**/test-media/late-fgclip*', async (r) => {
      await new Promise((res) => setTimeout(res, 4500));
      const body = await fs.readFile(path.join(FIXTURES, 'fgclip.webm'));
      await r.fulfill({ body, contentType: 'video/webm' }).catch(() => {});
    }];
    const page = await open({ routes: [...withScene({ ...T5, foregroundClip: 'test-media/late-fgclip' }), late] });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      await until(page, () => performance.now() - window.__marks.introStart > 4700, 8000);
      assert.ok(cutRequests(page).length >= 1, 'cut-out was not requested');
      assert.equal(await page.getAttribute('#dash-fgclip', 'src'), null, 'cut-out still loading after the 4000ms cap');
      await page.waitForTimeout(600);
      await assertStillStays(page);
    } finally {
      await done(page);
    }
  });

  test('scene with clip and foreground but no foregroundClip: clip never requested in rendered mode', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, foreground: T4_FG, clip: 'test-media/clip.webm' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      await until(page, () => performance.now() - window.__marks.introStart > 2500, 5000);
      await assertStillStays(page);
      assert.deepEqual(cutRequests(page), []);
    } finally {
      await done(page);
    }
  });

  test('rendered, scene with a clip and neither foreground field: clip plays as on main', async () => {
    const page = await open({ routes: withScene({ still: T4_STILL, clip: 'test-media/clip.webm' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      await until(page, () => { const c = document.getElementById('dash-clip'); return !c.hidden && c.currentTime > 0; }, 4000);
      assert.deepEqual(cutRequests(page), []);
      assert.equal(await page.getAttribute('#dash-fgclip', 'src'), null);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('fallback mode: clip plays as on main, cut-out never requested', async () => {
    const page = await open({ routes: [...noCockpit, ...withScene(T5)] });
    try {
      await introStart(page);
      await assertDrawn(page);
      await until(page, () => { const c = document.getElementById('dash-clip'); return !c.hidden && c.currentTime > 0; }, 4000);
      await until(page, () => document.getElementById('dash-clip').ended, 4000);
      const v = await videos(page);
      assert.equal(v.clip.loop, false);
      assert.equal(v.cut.hidden, true);
      assert.equal(v.cut.src, null);
      assert.deepEqual(cutRequests(page), []);
      assert.equal(await css(page, '#dash-fgbox', 'display'), 'none');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [label, opts] of [['?p=0', { path: '/?p=0' }], ['?filter=films', { path: '/?filter=films' }],
    ['reduced motion', { reduced: true }], ['second visit in the session', { seen: true }]]) {
    test(`skipped intro (${label}) requests neither clip nor cut-out`, async () => {
      const page = await open({ ...opts, routes: withScene(T5) });
      try {
        await until(page, () => document.body.classList.contains('grid-active') || document.body.classList.contains('project-view'), 8000);
        await page.waitForTimeout(1500);
        assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played');
        assert.deepEqual(media(page).filter((u) => /clip/.test(u)), []);
        assert.equal(await page.getAttribute('#dash-clip', 'src'), null);
        assert.equal(await page.getAttribute('#dash-fgclip', 'src'), null);
      } finally {
        await done(page);
      }
    });
  }

  test('push-in pauses both videos', async () => {
    const page = await open({ routes: withScene(T5), init: [SLOW] });
    try {
      await introStart(page);
      await until(page, pairPlaying, 4000);
      await page.keyboard.press('Enter');
      await landed(page);
      const v = await videos(page);
      for (const x of [v.clip, v.cut]) assert.ok(x.paused && !x.ended && x.t < x.d - 0.05, JSON.stringify(v));
      await page.waitForTimeout(300);
      const later = await videos(page);
      assert.equal(later.clip.t, v.clip.t, 'clip moved after the push-in');
      assert.equal(later.cut.t, v.cut.t, 'cut-out moved after the push-in');
      await assertEndState(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('drift: after forcing fgclip.currentTime back by 0.5s, the two are within 0.1s again inside 600ms', async () => {
    const page = await open({ routes: withScene(T5), init: [SLOW] });
    try {
      await introStart(page);
      await until(page, pairPlaying, 4000);
      await until(page, () => document.getElementById('dash-clip').currentTime >= 0.55, 6000);
      const r = await page.evaluate(() => new Promise((resolve) => {
        const c = document.getElementById('dash-clip'), f = document.getElementById('dash-fgclip');
        f.currentTime = c.currentTime - 0.5;
        const forced = c.currentTime - f.currentTime;
        const t0 = performance.now();
        (function poll() {
          const diff = Math.abs(c.currentTime - f.currentTime);
          const el = performance.now() - t0;
          if (diff < 0.1) return resolve({ forced, ms: el, diff, clipT: c.currentTime, ended: c.ended });
          if (el > 600) return resolve({ forced, ms: null, diff });
          setTimeout(poll, 20);
        })();
      }));
      const s = JSON.stringify(r);
      assert.ok(r.forced >= 0.45, `drift not forced: ${s}`);
      assert.ok(r.ms !== null, `still apart after 600ms: ${s}`);
      assert.equal(r.ended, false, `realigned only because the clip ended: ${s}`);
      assert.equal(await page.evaluate(() => document.getElementById('dash-fg').hidden), true);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  // Hidden while the pair would start: hide the tab the moment the hold starts (before the cut-out has loaded),
  // show it 1500ms later. The page sees document.hidden and visibilitychange as a real tab switch delivers them.
  const HIDE_AT_HOLD = () => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
    window.__setHidden = (h) => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); };
    let armed = true;
    new MutationObserver(() => {
      if (armed && document.body && document.body.classList.contains('intro-active')) {
        armed = false;
        window.__hiddenAt = performance.now();
        // Both videos still hidden (not yet started) at this moment.
        window.__atHide = { clip: document.getElementById('dash-clip').hidden, cut: document.getElementById('dash-fgclip').hidden };
        window.__setHidden(true);
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  };

  test('tab hidden when the pair would start, then shown: the two play together, no page errors', async () => {
    const page = await open({ routes: withScene(T5), init: [SLOW, HIDE_AT_HOLD] });
    try {
      await introStart(page);
      await until(page, () => window.__hiddenAt !== undefined, 2000);
      assert.deepEqual(await page.evaluate(() => window.__atHide), { clip: true, cut: true }, 'pair already showing when the tab hid');
      await until(page, () => performance.now() - window.__hiddenAt > 1500, 4000);
      await page.evaluate(() => window.__setHidden(false));
      await page.waitForTimeout(400);
      const v = await videos(page);
      const s = JSON.stringify(v);
      // One consistent picture: the pair playing over the still, the poster cut-out out of the way.
      assert.equal(v.clip.hidden, false, s);
      assert.equal(v.cut.hidden, false, s);
      assert.equal(v.fgShown, false, s);
      assert.ok(!v.clip.paused && !v.cut.paused, s);
      assert.ok(Math.abs(v.clip.t - v.cut.t) < 0.1, s);
      await landed(page);
      await assertEndState(page);
      const end = await videos(page);
      assert.ok(end.clip.paused && end.cut.paused, JSON.stringify(end));
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('tab hidden when the pair would start, play() refused while hidden: still and poster cut-out, nothing stuck', async () => {
    const REFUSE_HIDDEN = () => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (document.hidden) return Promise.reject(new DOMException('play() refused in a hidden tab', 'NotAllowedError'));
        return play.call(this);
      };
    };
    const page = await open({ routes: withScene(T5), init: [HIDE_AT_HOLD, REFUSE_HIDDEN] });
    try {
      await introStart(page);
      await until(page, () => window.__hiddenAt !== undefined, 2000);
      // The pair tried to start while hidden (the clip was requested), and was refused.
      await until(page, () => performance.now() - window.__hiddenAt > 1500, 4000);
      assert.ok(clipRequests(page).length >= 1, 'pair never tried to start while hidden');
      await page.evaluate(() => window.__setHidden(false));
      await page.waitForTimeout(400);
      const v = await videos(page);
      const s = JSON.stringify(v);
      assert.equal(v.clip.hidden, true, s);
      assert.equal(v.cut.hidden, true, s);
      assert.ok(v.clip.paused && v.cut.paused, s);
      assert.equal(v.stillShown, true, s);
      assert.equal(v.fgShown, true, s);
      await landed(page);
      await assertEndState(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  // Engine pick. Only Chromium runs here, so the .mov is answered with 404 (no such fixture): the pick is what is tested.
  const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
  const IOS = (tail) => `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${tail}`;
  for (const [label, ua, ext] of [
    ['Safari', SAFARI, 'mov'],
    ['Chrome on iOS (CriOS)', IOS('CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1'), 'mov'],
    ['Firefox on iOS (FxiOS)', IOS('FxiOS/120.0 Mobile/15E148 Safari/605.1.15'), 'mov'],
    ['Edge on iOS (EdgiOS)', IOS('EdgiOS/120.0.2210.126 Version/17.0 Mobile/15E148 Safari/604.1'), 'mov'],
    ['Edge on desktop (Chrome/ and Edg/)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91', 'webm'],
  ]) {
    test(`engine pick, ${label}: cut-out requested as .${ext}`, async () => {
      const page = await open({ userAgent: ua, routes: withScene(T5) });
      try {
        await introStart(page);
        await assertRendered(page, 'wide');
        await until(page, () => performance.now() - window.__marks.introStart > 2000, 5000);
        const cuts = cutRequests(page).map((u) => u.split('/').pop());
        assert.ok(cuts.length >= 1, 'cut-out not requested');
        assert.ok(cuts.every((u) => u === `fgclip.${ext}`), cuts.join(' '));
        if (ext === 'mov') await assertStillStays(page);
      } finally {
        await done(page);
      }
    });
  }

  test('phone uses foregroundClipSmall', async () => {
    const page = await open({ viewport: { width: 390, height: 844 },
      routes: withScene({ ...T5, foregroundClip: 'test-media/missing-big', foregroundClipSmall: 'test-media/fgclip' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'tall');
      await until(page, pairPlaying, 4000);
      assert.deepEqual(cutRequests(page).map((u) => u.split('/').pop()), ['fgclip.webm']);
      assert.deepEqual(media(page).filter((u) => /big/.test(u)), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('rendered, still 404, foreground 200: #dash-fg hidden for good, drawn scene shows', async () => {
    const page = await open({ routes: withScene({ ...T5, still: 'test-media/missing.jpg' }) });
    try {
      await introStart(page);
      await assertRendered(page, 'wide');
      for (const wait of [0, 1500]) {
        await page.waitForTimeout(wait);
        const s = await page.evaluate(() => {
          const fg = document.getElementById('dash-fg');
          return { fgLoaded: fg.complete && fg.naturalWidth > 0, fgHidden: fg.hidden, stillHidden: document.getElementById('dash-still').hidden };
        });
        assert.deepEqual(s, { fgLoaded: true, fgHidden: true, stillHidden: true }, `after ${wait}ms`);
        assert.equal(await css(page, '#dash-fg', 'display'), 'none');
        assert.notEqual(await css(page, '#dash-drawn', 'display'), 'none');
      }
      // As on main, no still means no clip; and so no cut-out either.
      assert.deepEqual(media(page).filter((u) => /clip/.test(u)), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
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
      assert.equal((await dollBox(page).catch(() => ({ rendered: false }))).rendered, false);
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
