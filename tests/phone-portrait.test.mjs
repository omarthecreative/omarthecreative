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
  withScene, NO_CLIP, SRC,
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
