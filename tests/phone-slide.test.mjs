// Phone upright: the grid page slides up inside the short screen, so the filter row sits near the
// screen's top and thumbnails show (the page's top band is empty during the intro: the name and
// the menu are hidden there). During the push-in it slides back; the landing is the normal grid.
// Run from tests/: `node --test phone-slide.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, open, done, until, mounted, landed, enter, dashMode } from './helpers/intro-page.mjs';

before(start);
after(stop);

const GAP = 20; // page px between the screen's top edge and the filter row
const noCockpit = [['**/cockpit-*', (r) => r.fulfill({ status: 404, body: 'not found' })]];
const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} vs ${want}`);

// Where things are on the window right now. gap: from the screen's top edge down to the filter
// row, in page px (window px over the grid's scale). ty: the scroll box's own vertical shift.
const slideState = (page) => page.evaluate(() => {
  const H = document.documentElement;
  const portal = document.getElementById('portal');
  const scale = portal.getBoundingClientRect().width / portal.offsetWidth;
  const s = document.getElementById('dash-screen').getBoundingClientRect();
  const bar = document.querySelector('.grid-filter-bar').getBoundingClientRect();
  const box = document.getElementById('grid-scroll-container');
  const card = document.querySelector('.grid-container').children[0].getBoundingClientRect();
  return {
    scale, gap: (bar.top - s.top) / scale, barTop: bar.top, screenTop: s.top, screenBottom: s.bottom,
    cardTop: card.top, cardBottom: card.bottom, transform: getComputedStyle(box).transform,
    ty: new DOMMatrix(getComputedStyle(box).transform).m42, inline: H.style.getPropertyValue('--dash-slide'),
    scrollTop: box.scrollTop,
  };
});
const untilMode = (page, mode) => until(page, (mode) => {
  const h = document.documentElement;
  const now = h.classList.contains('dash-rendered') ? h.getAttribute('data-dash-mode') : 'drawn';
  if (now !== mode) return false;
  if (mode === 'drawn') return true;
  const o = window.DashIntro.layout(window.innerWidth, window.innerHeight);
  return Math.abs(parseFloat(h.style.getPropertyValue('--ck-w')) - o.ckW) < 0.01;
}, 4000, mode);

function assertSlid(s, label) {
  near(s.gap, GAP, 1, `${label}: page px from the screen's top edge to the filter row`);
  assert.ok(s.ty < -10, `${label}: the page did not slide up (shift ${s.ty})`);
  near(s.ty, -parseFloat(s.inline), 0.01, `${label}: the shift against --dash-slide`);
  assert.ok(s.cardTop >= s.screenTop && s.cardBottom <= s.screenBottom + 0.5,
    `${label}: the first thumbnail is not whole inside the screen: ${JSON.stringify(s)}`);
}
function assertNotSlid(s, label) {
  assert.equal(s.transform, 'none', `${label}: the scroll box is shifted`);
  assert.equal(s.inline, '', `${label}: --dash-slide is set`);
}

describe('phone upright: the page slides up inside the short screen', () => {
  // 760 wide puts the filter row at another height in the page (79px, not 136px): the slide is measured.
  for (const [w, h] of [[390, 844], [390, 664], [360, 800], [430, 932], [375, 553], [760, 1100]]) {
    test(`${w}x${h}: the filter row sits ${GAP} page px under the screen's top edge, the first thumbnail row is whole`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        assert.equal(await dashMode(page), 'tall');
        assertSlid(await slideState(page), `${w}x${h}`);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('390x844 push-in: the page slides back on the same clock, never above the screen; it lands as the normal grid', async (t) => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      const before = await slideState(page);
      assertSlid(before, 'before');
      await enter(page, 'Escape');
      await until(page, () => document.documentElement.classList.contains('dash-pushing'), 2000);
      const samples = await page.evaluate(() => new Promise((resolve) => {
        const H = document.documentElement, box = document.getElementById('grid-scroll-container');
        const portal = document.getElementById('portal'), screen = document.getElementById('dash-screen');
        const bar = document.querySelector('.grid-filter-bar');
        const out = [], t0 = performance.now();
        (function frame() {
          if (!H.classList.contains('dash-pushing') || performance.now() - t0 > 1500) return resolve(out);
          out.push({ ty: new DOMMatrix(getComputedStyle(box).transform).m42, bar: bar.getBoundingClientRect().top,
            screen: screen.getBoundingClientRect().top, scale: portal.getBoundingClientRect().width / portal.offsetWidth });
          requestAnimationFrame(frame);
        })();
      }));
      const mid = samples.filter((x) => x.scale < 0.995);
      assert.ok(mid.length >= 3, `too few mid-push frames: ${samples.length}`);
      t.diagnostic(`${mid.length} frames, shifts ${mid.map((x) => x.ty.toFixed(0)).join(' ')}`);
      for (let i = 1; i < mid.length; i++) assert.ok(mid[i].ty >= mid[i - 1].ty - 0.5, `the page slid up again: ${mid.map((x) => x.ty.toFixed(1)).join(' ')}`);
      assert.ok(mid[0].ty <= 0.5 * before.ty, `first shift ${mid[0].ty}, start ${before.ty}`);
      assert.ok(mid[mid.length - 1].ty >= 0.5 * before.ty, `last shift ${mid[mid.length - 1].ty}, start ${before.ty}`);
      // The filter row keeps at least its starting gap under the screen's top edge.
      for (const x of mid) assert.ok((x.bar - x.screen) / x.scale >= GAP - 1, `the filter row rose to ${((x.bar - x.screen) / x.scale).toFixed(1)}`);
      await landed(page);
      await page.waitForTimeout(200);
      const end = await slideState(page);
      assert.equal(end.transform, 'none', 'after landing the scroll box is still shifted');
      assert.equal(end.scrollTop, 0);
      near(end.barTop, 136, 1, 'after landing: the filter row in its normal place');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [label, opts, mode] of [
    ['laptop 1440x900', {}, 'wide'],
    ['phone on its side 844x390', { viewport: { width: 844, height: 390 } }, 'wide'],
    ['phone upright, cockpit 404 (drawn)', { viewport: { width: 390, height: 844 }, routes: noCockpit }, 'drawn'],
  ]) {
    test(`${label}: no slide`, async () => {
      const page = await open(opts);
      try {
        await mounted(page);
        await page.waitForTimeout(300);
        assert.equal(await dashMode(page), mode);
        assertNotSlid(await slideState(page), label);
      } finally {
        await done(page);
      }
    });
  }

  test('turning 390x844 to 844x390 drops the slide; turning back brings it again', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await page.waitForTimeout(300);
      assertSlid(await slideState(page), 'upright');
      await page.setViewportSize({ width: 844, height: 390 });
      await untilMode(page, 'wide');
      assertNotSlid(await slideState(page), 'on its side');
      await page.setViewportSize({ width: 390, height: 844 });
      await untilMode(page, 'tall');
      assertSlid(await slideState(page), 'upright again');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});
