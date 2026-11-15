// A phone held upright shows a slice of the wide cockpit (part of the steering wheel) and a
// short, wide screen like a car's; the push-in still lands on the full grid page.
// Plan 2026-11-14-rendered-cockpit-review-3; rulings Z1 to Z13 in its brief.
// Run from tests/: `node --test phone-portrait.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  start, stop, open, done, until, introStart, mounted, landed, rect, css, enter, frameFitsGrid, visibleRect, dashMode,
  withScene, NO_CLIP, SRC, PUSH_SAMPLES,
} from './helpers/intro-page.mjs';

before(start);
after(stop);

const PHONE = 'cockpit-phone-1620.webp';
const WIDE = 'cockpit-wide-2560.webp';
const layoutOf = (page, w, h) => page.evaluate(([w, h]) => window.DashIntro.layout(w, h), [w, h]);
const cockpitFiles = (page) => page.requested.filter((u) => /\/cockpit-/.test(u)).map((u) => u.split('/').pop());
const frameVar = (page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--dash-frame-h'));
const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} vs ${want}`);

async function resize(page, w, h) {
  await page.setViewportSize({ width: w, height: h });
  page.vw = w;
  page.vh = h;
}
// The dashboard for this window is up: the mode, and the layout variables of this window's size.
async function untilMode(page, mode, timeout = 4000) {
  await until(page, (mode) => {
    const h = document.documentElement;
    if (!h.classList.contains('dash-rendered') || h.getAttribute('data-dash-mode') !== mode) return false;
    const o = window.DashIntro.layout(window.innerWidth, window.innerHeight);
    return Math.abs(parseFloat(h.style.getPropertyValue('--ck-w')) - o.ckW) < 0.01;
  }, timeout, mode);
}
// The cockpit picture: file, decoded, box.
const picture = (page) => page.evaluate(() => {
  const i = document.getElementById('dash-cockpit-img');
  const r = i.getBoundingClientRect();
  return { file: (i.currentSrc || '').split('/').pop(), ok: i.complete && i.naturalWidth > 0,
    left: r.left, top: r.top, width: r.width, height: r.height, right: r.right };
});
// Portrait, rendered: the phone picture in its slice of the cockpit box, covering the window; the
// short screen where layout() puts it; frame and grid coincide; --dash-frame-h inline.
async function assertPortrait(page, label) {
  assert.equal(await dashMode(page), 'tall', `${label}: mode`);
  const o = await layoutOf(page, page.vw, page.vh);
  const img = await picture(page);
  assert.equal(img.file, PHONE, `${label}: picture`);
  assert.ok(img.ok, `${label}: picture not decoded`);
  for (const [k, want] of [['left', o.ckX + 0.25 * o.ckW], ['top', 0], ['width', 0.39 * o.ckW], ['height', o.ckH]]) {
    near(img[k], want, 1, `${label}: picture ${k}`);
  }
  assert.ok(img.left <= 0 && img.right >= page.vw, `${label}: picture does not cover the window: ${JSON.stringify(img)}`);
  const s = await rect(page, '#dash-screen');
  for (const [k, want] of [['left', o.left], ['top', o.top], ['width', o.k * page.vw], ['height', o.frameH]]) {
    near(s[k], want, 1, `${label}: screen ${k}`);
  }
  await frameFitsGrid(page, `${label}: `);
  near(parseFloat(await frameVar(page)), o.frameH, 0.01, `${label}: --dash-frame-h`);
  return o;
}
// Wide, rendered: the wide picture, the screen k * h tall, frame and grid coincide, no --dash-frame-h.
async function assertWide(page, label) {
  assert.equal(await dashMode(page), 'wide', `${label}: mode`);
  const o = await layoutOf(page, page.vw, page.vh);
  const img = await picture(page);
  assert.equal(img.file, WIDE, `${label}: picture`);
  for (const [k, want] of [['left', o.ckX], ['width', o.ckW], ['height', o.ckH]]) near(img[k], want, 1, `${label}: picture ${k}`);
  const s = await rect(page, '#dash-screen');
  near(s.height, o.k * page.vh, 1, `${label}: screen height`);
  near(o.frameH, o.k * page.vh, 1e-9, `${label}: layout().frameH`);
  await frameFitsGrid(page, `${label}: `);
  assert.equal(await frameVar(page), '', `${label}: --dash-frame-h set inline`);
}

describe('layout() in portrait', () => {
  // [w, h, want] (±0.6 px, ±0.002 for k): the plan's five rows, then ruling Z1's.
  const ROWS = [
    [390, 844, { mode: 'tall', k: 0.578, left: 156.4, top: 400.1, shield: 347.7, ckX: -532.8, frameH: 139.9 }],
    [390, 664, { mode: 'tall', k: 0.450, left: 206.7, top: 314.7, shield: 273.6, ckX: -336.0, frameH: 108.7 }],
    [412, 732, { mode: 'tall', k: 0.472, left: 209.7, top: 347.0, shield: 301.6, ckX: -388.3, frameH: 120.5 }],
    [360, 800, { mode: 'tall', k: 0.593, left: 138.7, top: 379.2, shield: 329.6, ckX: -514.7, frameH: 132.2 }],
    [430, 932, { mode: 'tall', k: 0.582, left: 171.9, top: 441.8, shield: 384.0, ckX: -589.0, frameH: 155.1 }],
    [375, 553, { mode: 'tall', k: 0.4506, left: 198.0, ckX: -254.2 }],
    [600, 800, { mode: 'none' }],
    [700, 800, { mode: 'none' }],
  ];
  let page;
  before(async () => {
    page = await open({ seen: true });
    await until(page, () => !!window.DashIntro, 8000);
  });
  after(() => done(page));

  test('the plan\'s five rows and ruling Z1\'s rows', async () => {
    for (const [w, h, want] of ROWS) {
      const o = await layoutOf(page, w, h);
      assert.equal(o.mode, want.mode, `${w}x${h} mode`);
      if (want.mode === 'none') continue;
      for (const key of ['left', 'top', 'shield', 'ckX', 'frameH']) {
        if (key in want) near(o[key], want[key], 0.6, `${w}x${h} ${key}`);
      }
      near(o.k, want.k, 0.002, `${w}x${h} k`);
      near(o.ckW, h * 16 / 9, 1e-6, `${w}x${h} ckW`);
      near(o.ckH, h, 1e-6, `${w}x${h} ckH`);
      assert.equal(o.cropR, 0, `${w}x${h} cropR`);
    }
    // 375x553: X0 is 0.64 - w/ckW, so the slice's right edge is the window's.
    const o = await layoutOf(page, 375, 553);
    near(-o.ckX / o.ckW, 0.2586, 0.0001, '375x553 X0');
    near(o.ckX + 0.64 * o.ckW, 375, 1e-6, '375x553 slice right edge');
  });

  test('frameH in wide mode is k * h (1440x900, 844x390)', async () => {
    for (const [w, h] of [[1440, 900], [844, 390]]) {
      const o = await layoutOf(page, w, h);
      assert.equal(o.mode, 'wide', `${w}x${h}`);
      near(o.frameH, o.k * h, 1e-9, `${w}x${h} frameH`);
    }
  });

  test('mode none for k under 0.40 (200x317); the height rule never decides alone in portrait', async (t) => {
    // The plan's formula, step by step, to name which rule decides.
    const parts = (w, h) => {
      const ckW = h * 16 / 9;
      let x0 = Math.min(0.40, Math.max(0.26, 0.615 - w / ckW));
      if (x0 + w / ckW > 0.64) x0 = 0.64 - w / ckW;
      const left = -x0 * ckW + 0.458 * ckW + 2;
      const k = (w - left - 8) / w;
      return { x0, k, tall: 0.474 * h + 0.62 * k * w <= h - 24 };
    };
    const p = parts(200, 317);
    assert.ok(p.x0 >= 0.25 && p.k < 0.40 && p.tall, JSON.stringify(p));
    assert.equal((await layoutOf(page, 200, 317)).mode, 'none', '200x317');
    // Every portrait window from 100 to 760 wide and up to 2400 tall: where the slice covers it
    // and k >= 0.40, the frame always fits above h - 24. (k * w is at most about 0.28 * h - 10, so
    // top + frameH is at most about 0.65 * h; it passes h - 24 only under 70 px tall.)
    const alone = await page.evaluate(`(() => {
      const out = [];
      for (let w = 100; w <= 760; w += 3) for (let h = w + 1; h <= 2400; h += 7) {
        const ckW = h * 16 / 9;
        let x0 = Math.min(0.40, Math.max(0.26, 0.615 - w / ckW));
        if (x0 + w / ckW > 0.64) x0 = 0.64 - w / ckW;
        const k = (w - (-x0 * ckW + 0.458 * ckW + 2) - 8) / w;
        const mode = window.DashIntro.layout(w, h).mode;
        const want = x0 >= 0.25 && k >= 0.40 && 0.474 * h + 0.62 * k * w <= h - 24 ? 'tall' : 'none';
        if (mode !== want || (x0 >= 0.25 && k >= 0.40 && want === 'none')) out.push([w, h, mode, want]);
      }
      return out;
    })()`);
    t.diagnostic(`windows where layout() disagrees or the height rule decides alone: ${alone.length}`);
    assert.deepEqual(alone.slice(0, 5), []);
  });

  test('the scene box covers the window for every tall row (ruling Z9)', async () => {
    for (const [w, h, want] of ROWS) {
      if (want.mode !== 'tall') continue;
      const o = await layoutOf(page, w, h);
      near(o.sbH, o.shield, 1e-6, `${w}x${h} sbH`);
      near(o.sbW, o.sbH * 1920 / 824, 1e-6, `${w}x${h} sbW`);
      assert.equal(o.sbY, 0, `${w}x${h} sbY`);
      near(o.sbX, -o.ckX + w / 2 - 0.6 * o.sbW, 1e-6, `${w}x${h} sbX`);
      assert.ok(o.ckX + o.sbX <= 0 && o.ckX + o.sbX + o.sbW >= w, `${w}x${h} scene box does not cover the window: ${JSON.stringify(o)}`);
    }
  });
});

describe('the phone picture', { concurrency: 1 }, () => {
  for (const [w, h] of [[390, 844], [390, 664]]) {
    test(`load at ${w}x${h}: the phone slice, decoded, in its box, covering the window; no other cockpit file; no floor`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await assertPortrait(page, `${w}x${h}`);
        assert.deepEqual(cockpitFiles(page), [PHONE]);
        assert.deepEqual(page.requested.filter((u) => /cockpit-(tall|wide)/.test(u)), []);
        assert.equal(await page.locator('.dash-cockpit-floor').count(), 0);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('the short screen and the push-in', { concurrency: 1 }, () => {
  test('390x844 before the push-in: the screen is the short frame, the grid shows exactly in it and nowhere below', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      const o = await assertPortrait(page, '390x844');
      near(o.frameH, 139.9, 0.6, 'frameH');
      const s = await rect(page, '#dash-screen');
      const g = await visibleRect(page, '#portal');
      for (const k of ['left', 'top', 'right', 'bottom']) near(g[k], s[k], 1, `visible grid ${k}`);
      const hits = await page.evaluate(([cx, bottom, h]) => {
        const portal = document.getElementById('portal');
        const img = document.getElementById('dash-cockpit-img');
        const inGrid = (y) => document.elementsFromPoint(cx, y).some((el) => portal.contains(el));
        img.style.pointerEvents = 'auto';
        const inImg = (y) => document.elementsFromPoint(cx, y).includes(img);
        const r = { gridIn: inGrid(bottom - 6), gridBelow: inGrid(bottom + 6), gridFoot: inGrid(h - 4),
          holeIn: inImg(bottom - 3), holeBelow: inImg(bottom + 3) };
        img.style.pointerEvents = '';
        return r;
      }, [s.left + s.width / 2, s.bottom, 844]);
      const j = JSON.stringify(hits);
      assert.equal(hits.gridIn, true, `the grid does not show inside the frame: ${j}`);
      assert.equal(hits.gridBelow, false, `the grid shows 6 px below the frame: ${j}`);
      assert.equal(hits.gridFoot, false, `the grid shows at the window's foot: ${j}`);
      assert.equal(hits.holeIn, false, `the cockpit covers the frame: ${j}`);
      assert.equal(hits.holeBelow, true, `the cockpit's hole runs past the frame: ${j}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('390x844 mid push-in: frame and grid edges coincide, the visible height grows toward the window; then the grid is normal', async (t) => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      const o = await assertPortrait(page, '390x844');
      await enter(page, 'Escape');
      await until(page, () => document.documentElement.classList.contains('dash-pushing'), 2000);
      const samples = await page.evaluate(PUSH_SAMPLES);
      const mid = samples.filter((x) => x.scale < 0.995);
      assert.ok(mid.length >= 3, `too few mid-push frames: ${samples.length}`);
      let worst = 0;
      for (const x of mid) {
        for (const k of ['left', 'top', 'right', 'bottom']) {
          const d = Math.abs(x.s[k] - x.p[k]);
          worst = Math.max(worst, d);
          assert.ok(d <= 1.5, `at scale ${x.scale.toFixed(3)} ${k}: frame ${x.s[k].toFixed(2)} vs grid ${x.p[k].toFixed(2)}`);
        }
      }
      const heights = mid.map((x) => x.p.bottom - x.p.top);
      t.diagnostic(`${mid.length} mid-push frames, worst edge gap ${worst.toFixed(3)} px, heights ${heights.map((v) => v.toFixed(0)).join(' ')}`);
      for (let i = 1; i < heights.length; i++) assert.ok(heights[i] >= heights[i - 1] - 0.5, `the visible height shrank: ${heights.join(' ')}`);
      assert.ok(Math.min(...heights) <= o.frameH + 0.2 * (844 - o.frameH), `first heights ${heights.slice(0, 3)}`);
      assert.ok(Math.max(...heights) >= o.frameH + 0.6 * (844 - o.frameH), `last heights ${heights.slice(-3)}`);
      await landed(page);
      await page.waitForTimeout(200);
      assert.equal(await css(page, '#portal', 'transform'), 'none');
      assert.equal(await css(page, '#portal', 'clipPath'), 'none');
      assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
      const p = await rect(page, '#portal');
      assert.ok(p.left === 0 && p.top === 0 && Math.abs(p.width - 390) <= 1, JSON.stringify(p));
      const scrolled = await page.evaluate(() => {
        const c = document.getElementById('grid-scroll-container');
        c.scrollTop = 400;
        return c.scrollTop;
      });
      assert.equal(scrolled, 400, 'the grid does not scroll');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('phone details', { concurrency: 1 }, () => {
  test('390x844: Wire Omar is the knight on the rendered start button', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      const o = await assertPortrait(page, '390x844');
      const wire = await rect(page, '#dash-wire');
      near(wire.width, 0.0333 * o.ckW, 1, 'button width');
      near(wire.height, 0.0333 * o.ckW, 1, 'button height');
      near(wire.left + wire.width / 2, o.ckX + 0.428 * o.ckW, 1, 'button centre x');
      near(wire.top + wire.height / 2, 0.674 * o.ckH, 1, 'button centre y');
      assert.equal(await page.evaluate(() => document.querySelector('#dash-wire span').getClientRects().length), 0, 'words shown');
      assert.equal(await css(page, '#dash-wire', 'borderTopWidth'), '0px');
      assert.equal(await css(page, '#dash-wire', 'backgroundColor'), 'rgba(0, 0, 0, 0)');
      assert.equal(await css(page, '#dash-wire', 'boxShadow'), 'none');
      near((await rect(page, '#dash-wire svg')).height, 0.46 * wire.height, 1, 'knight height');
      assert.equal(await page.getAttribute('#dash-wire', 'aria-label'), 'Wire Omar');
      assert.equal(await page.getAttribute('#dash-wire', 'title'), 'Wire Omar');
      const RED = 'rgb(255, 0, 21)', WHITE = 'rgb(255, 255, 255)';
      await page.mouse.move(2, 2);
      assert.equal(await css(page, '#dash-wire svg', 'fill'), WHITE);
      await page.mouse.move(wire.left + wire.width / 2, wire.top + wire.height / 2);
      assert.equal(await css(page, '#dash-wire svg', 'fill'), RED, 'on hover');
      await page.mouse.move(2, 2);
      for (let i = 0; i < 40 && await page.evaluate(() => document.activeElement?.id) !== 'dash-wire'; i++) {
        await page.keyboard.press('Tab');
      }
      assert.equal(await page.evaluate(() => document.querySelector('#dash-wire').matches(':focus-visible')), true, 'no keyboard focus');
      assert.equal(await css(page, '#dash-wire svg', 'fill'), RED, 'on keyboard focus');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('390x844: a tap on Wire Omar goes to about.html and does not start the push-in', async () => {
    // The intro page is gone after the tap, so it notes a push-in in sessionStorage, which the
    // next page of this tab can read.
    const NOTE = () => new MutationObserver(() => {
      if (document.documentElement.classList.contains('dash-pushing')) sessionStorage.setItem('__pushed', '1');
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
    const page = await open({ viewport: { width: 390, height: 844 }, touch: true, init: [NOTE] });
    try {
      await mounted(page);
      await page.tap('#dash-wire');
      await page.waitForURL(/about\.html$/, { timeout: 5000 });
      assert.equal(await page.evaluate(() => sessionStorage.getItem('__pushed')), null, 'the tap started the push-in');
    } finally {
      await done(page);
    }
  });

  test('390x844 drawn fallback (pictures blocked): the old phone button, with its words', async () => {
    const page = await open({ viewport: { width: 390, height: 844 }, drawn: true });
    try {
      await mounted(page);
      assert.equal(await dashMode(page), 'drawn');
      const wire = await rect(page, '#dash-wire');
      near(wire.width, 54, 0.5, 'button width');
      near(wire.left, (0.19 * 390 - 7) / 2 - 27, 0.5, 'button left');
      assert.equal(await css(page, '#dash-wire', 'borderTopWidth'), '2px');
      const words = await rect(page, '#dash-wire span');
      assert.ok(words.width > 0 && words.height > 0, `words not shown: ${JSON.stringify(words)}`);
      near((await rect(page, '#dash-wire svg')).height, 11, 0.5, 'knight height');
      near((await rect(page, '#dash-screen')).height, 0.62 * 844, 1, 'drawn screen height');
      assert.equal(await frameVar(page), '');
      await frameFitsGrid(page, 'drawn 390x844: ');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [w, h] of [[390, 844], [390, 664]]) {
    test(`${w}x${h}: the gauges take the cockpit box; the right hub ring on its hub`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        const o = await assertPortrait(page, `${w}x${h}`);
        assert.equal(await css(page, '#dash-gauges', 'display'), 'block');
        const svg = await rect(page, '#dash-gauges');
        for (const [k, want] of [['left', o.ckX], ['top', 0], ['width', o.ckW], ['height', o.ckH]]) near(svg[k], want, 1, `gauges ${k}`);
        const ring = await page.evaluate(() => {
          const b = document.querySelector('#dash-gauges .dash-gauge-revs').parentNode.querySelector(':scope > circle').getBoundingClientRect();
          return [b.left + b.width / 2, b.top + b.height / 2];
        });
        near(ring[0], o.ckX + 0.3115 * o.ckW, 1, 'revs hub x');
        near(ring[1], 0.5384 * o.ckH, 1, 'revs hub y');
      } finally {
        await done(page);
      }
    });
  }

  for (const [w, h] of [[390, 844], [390, 664]]) test(`${w}x${h}: the needles sweep to 0.6 and come to rest (speed 0, revs 0.14), as in wide mode`, async () => {
    const READ = () => {
      const angle = (el) => {
        const t = getComputedStyle(el).transform;
        if (!t || t === 'none') return 0;
        const m = new DOMMatrixReadOnly(t);
        return Math.atan2(m.b, m.a) * 180 / Math.PI;
      };
      window.__v = (which) => {
        const g = document.querySelector('#dash-gauges .dash-gauge-' + which);
        let a = angle(g) + angle(g.querySelector('.dash-gauge-wander'));
        a = ((a % 360) + 360) % 360;
        if (a < 90) a += 360;
        return (a - 138) / 260;
      };
    };
    const page = await open({ viewport: { width: w, height: h }, routes: withScene(NO_CLIP), init: [READ] });
    try {
      await introStart(page);
      const peak = await page.evaluate(() => new Promise((resolve) => {
        let best = 0;
        const t0 = performance.now();
        (function f() {
          best = Math.max(best, window.__v('revs'));
          if (performance.now() - t0 < 1400) requestAnimationFrame(f); else resolve(best);
        })();
      }));
      assert.ok(peak >= 0.55 && peak <= 0.605, `revs peak ${peak}`);
      await until(page, () => performance.now() - window.__marks.introStart > 2600, 8000);
      near(await page.evaluate(() => window.__v('speed')), 0, 0.003, 'speed at rest');
      near(await page.evaluate(() => window.__v('revs')), 0.14, 0.008, 'revs at rest');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('390x844: the rendered doll, 0.15 of the cockpit tall, centre 0.43, feet 0.42', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      const o = await assertPortrait(page, '390x844');
      await until(page, () => document.querySelector('.dash-doll').classList.contains('dash-doll-rendered'), 4000);
      const d = await page.evaluate(() => {
        const el = document.querySelector('.dash-doll');
        const keep = el.style.animation;
        el.style.animation = 'none';
        const r = el.getBoundingClientRect();
        el.style.animation = keep;
        return { bottom: r.bottom, height: r.height, cx: r.left + r.width / 2 };
      });
      near(d.height, 0.15 * o.ckH, 2, 'doll height');
      near(d.cx, o.ckX + 0.43 * o.ckW, 2, 'doll centre x');
      near(d.bottom, 0.42 * o.ckH, 2, 'doll feet');
    } finally {
      await done(page);
    }
  });

  test('390x844: the minimap 10 px from the window\'s left, 0.16 of the cockpit down, 56 x 56', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      const o = await assertPortrait(page, '390x844');
      const m = await rect(page, '.dash-minimap');
      near(m.left, 10, 0.5, 'minimap left');
      near(m.top, 0.16 * o.ckH, 0.5, 'minimap top');
      near(m.width, 56, 0.5, 'minimap width');
      near(m.height, 56, 0.5, 'minimap height');
    } finally {
      await done(page);
    }
  });
});

describe('rotation', { concurrency: 1 }, () => {
  test('load at 390x844, turn to 844x390: the wide cockpit loads then, wide geometry; back: the phone picture and the short screen', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await assertPortrait(page, 'load 390x844');
      await resize(page, 844, 390);
      await untilMode(page, 'wide');
      await assertWide(page, 'turned to 844x390');
      await resize(page, 390, 844);
      await untilMode(page, 'tall', 1000);
      await assertPortrait(page, 'back at 390x844');
      assert.deepEqual(cockpitFiles(page), [PHONE, WIDE]);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('load at 844x390, turn to 390x844: the phone picture loads then, the short screen; back: wide again', async () => {
    const page = await open({ viewport: { width: 844, height: 390 } });
    try {
      await mounted(page);
      await assertWide(page, 'load 844x390');
      await resize(page, 390, 844);
      await untilMode(page, 'tall');
      await assertPortrait(page, 'turned to 390x844');
      await resize(page, 844, 390);
      await untilMode(page, 'wide', 1000);
      await assertWide(page, 'back at 844x390');
      assert.deepEqual(cockpitFiles(page), [WIDE, PHONE]);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('wide mode untouched', { concurrency: 1 }, () => {
  test('1440x900: the screen is k * h tall, the visible grid equals it, no --dash-frame-h inline', async () => {
    const page = await open();
    try {
      await mounted(page);
      await assertWide(page, '1440x900');
      near((await rect(page, '#dash-screen')).height, 0.48 * 900, 1, 'screen height');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('files', () => {
  test('phone first-load weight: phone picture + still-960 + the doll <= 400,000 bytes; the tall picture is gone', async (t) => {
    const size = async (f) => (await fs.stat(path.join(SRC, f))).size;
    const parts = ['assets/dash/cockpit-phone-1620.webp', 'assets/dash/scenes/miami-beach/still-960.jpg',
      'assets/dash/doll-top.webp', 'assets/dash/doll-base.webp'];
    let total = 0;
    for (const f of parts) total += await size(f);
    t.diagnostic(`phone first load ${total} bytes`);
    assert.ok(total <= 400_000, `phone ${total} bytes`);
    await assert.rejects(fs.access(path.join(SRC, 'assets/dash/cockpit-tall-1080.webp')));
  });
});
