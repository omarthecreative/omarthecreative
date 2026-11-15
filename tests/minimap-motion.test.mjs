// The moving minimap (plan 2026-11-14-rendered-cockpit-review-2, part B, section 4, moved here
// from cockpit-motion.test.mjs; and the fix pass after the review, items Y-4 and Y-5). The strip
// rolls only while the car moves (html.dash-moving, ruling R1), only in the rendered cockpit, and
// swaps in only if it loaded while the page was dark.
// Run from tests/: `node --test minimap-motion.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  start, stop, open, done, until, introStart, mounted, landed, css, rect, enter,
  SRC, STRIP, withScene, CLIP, NO_CLIP, SLOW, LATE,
} from './helpers/intro-page.mjs';

before(start);
after(stop);

const moving = (page) => page.evaluate(() => document.documentElement.classList.contains('dash-moving'));

const stripY = (page) => page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.dash-minimap-strip')).transform).f);

describe('minimap', { concurrency: 1 }, () => {
  test('the box holds the strip, 300% of its height, and the arrow, filling it', async () => {
    const page = await open({ routes: withScene(CLIP) });
    try {
      await mounted(page);
      const kids = await page.evaluate(() => [...document.querySelector('.dash-minimap').children]
        .map((el) => `${el.tagName}.${el.className} ${el.getAttribute('src')}`));
      assert.deepEqual(kids, [
        `IMG.dash-minimap-strip ${STRIP}`,
        'IMG.dash-minimap-arrow assets/dash/minimap-arrow.svg',
      ]);
      const m = await page.evaluate(() => {
        const box = document.querySelector('.dash-minimap');
        const b = box.getBoundingClientRect();
        const r = (sel) => { const x = box.querySelector(sel).getBoundingClientRect(); return { left: x.left, top: x.top, width: x.width, height: x.height }; };
        return {
          inner: { left: b.left + box.clientLeft, top: b.top + box.clientTop, width: box.clientWidth, height: box.clientHeight },
          strip: r('.dash-minimap-strip'), arrow: r('.dash-minimap-arrow'),
          loaded: [...box.querySelectorAll('img')].every((i) => i.complete && i.naturalWidth > 0),
        };
      });
      const s = JSON.stringify(m);
      assert.equal(m.loaded, true, s);
      assert.ok(Math.abs(m.strip.width - m.inner.width) <= 0.5, s);
      assert.ok(Math.abs(m.strip.height - 3 * m.inner.height) <= 1, s);
      for (const k of ['left', 'top', 'width', 'height']) assert.ok(Math.abs(m.arrow[k] - m.inner[k]) <= 0.5, `arrow ${k}: ${s}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('the strip is frozen before the clip plays, moves while it plays, frozen after it ends; the arrow stays', async () => {
    const page = await open({ routes: withScene(CLIP), init: [LATE] });
    try {
      await introStart(page);
      const arrow0 = await rect(page, '.dash-minimap-arrow');
      const a = await stripY(page);
      await page.waitForTimeout(500);
      const b = await stripY(page);
      assert.equal(await moving(page), false, 'moving before the clip plays');
      assert.equal(a, b, 'strip moved before the clip played');
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
      const c = await stripY(page);
      await page.waitForTimeout(500);
      const d = await stripY(page);
      assert.ok(d > c, `strip did not move down while playing: ${c} then ${d}`);
      assert.deepEqual(await rect(page, '.dash-minimap-arrow'), arrow0, 'arrow moved');
      await page.evaluate(() => { const c = document.getElementById('dash-clip'); c.currentTime = c.duration - 0.01; });
      await until(page, () => document.getElementById('dash-clip').ended, 4000);
      await page.waitForTimeout(100);
      const e = await stripY(page);
      await page.waitForTimeout(500);
      assert.equal(await stripY(page), e, 'strip moved after the clip ended');
      assert.deepEqual(await rect(page, '.dash-minimap-arrow'), arrow0, 'arrow moved');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  for (const [what, match] of [['strip', '**/minimap-strip.svg'], ['arrow', '**/minimap-arrow.svg']]) {
    test(`${what} 404: the inline minimap stays`, async () => {
      const page = await open({ routes: [[match, (r) => r.fulfill({ status: 404, body: 'not found' })]] });
      try {
        await introStart(page);
        await page.waitForTimeout(300);
        assert.equal(await page.locator('.dash-minimap img').count(), 0);
        assert.equal(await css(page, '.dash-minimap svg', 'display'), 'block');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('one loop is seamless: -66.6667% to 0, 24 s, linear, infinite, paused until the clip plays', async () => {
    const page = await open({ routes: withScene(NO_CLIP) });
    try {
      await mounted(page);
      const a = await page.evaluate(() => {
        const s = getComputedStyle(document.querySelector('.dash-minimap-strip'));
        const name = s.animationName;
        let frames = null;
        for (const sheet of document.styleSheets) {
          let rules;
          try { rules = sheet.cssRules; } catch (e) { continue; }
          for (const r of rules) {
            if (r.type === CSSRule.KEYFRAMES_RULE && r.name === name) {
              frames = [...r.cssRules].map((k) => `${k.keyText} ${k.style.transform}`);
            }
          }
        }
        return { name, frames, duration: s.animationDuration, timing: s.animationTimingFunction,
          count: s.animationIterationCount, state: s.animationPlayState };
      });
      const s = JSON.stringify(a);
      assert.deepEqual(a.frames, ['0% translateY(-66.6667%)', '100% translateY(0px)'], s);
      assert.equal(a.duration, '24s', s);
      assert.equal(a.timing, 'linear', s);
      assert.equal(a.count, 'infinite', s);
      assert.equal(a.state, 'paused', s);
    } finally {
      await done(page);
    }
  });

  test('reduced motion: the strip and the needles stand still', async () => {
    const page = await open({ routes: withScene(CLIP), init: [SLOW] });
    try {
      await introStart(page);
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const sel of ['.dash-minimap-strip', '#dash-gauges .dash-gauge-speed .dash-gauge-wander', '#dash-gauges .dash-gauge-revs .dash-gauge-wander']) {
        assert.equal(await css(page, sel, 'animationName'), 'none', sel);
      }
    } finally {
      await done(page);
    }
  });
});

describe('minimap: rendered cockpit only, loaded while dark or never', { concurrency: 1 }, () => {
  for (const [label, opts, rendered, rolls] of [
    ['drawn fallback (cockpit pictures blocked)', { drawn: true }, false, false],
    ['tall cockpit 390x844', { viewport: { width: 390, height: 844 } }, true, true],
  ]) {
    test(`${label}: with the clip playing the strip ${rolls ? 'rolls' : 'shows but stays still'}`, async () => {
      const page = await open({ ...opts, routes: withScene(CLIP), init: [SLOW] });
      try {
        await introStart(page);
        await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dash-rendered')), rendered);
        assert.equal(await page.locator('.dash-minimap img').count(), 2, 'strip and arrow');
        assert.notEqual(await css(page, '.dash-minimap-strip', 'display'), 'none');
        const a = await stripY(page);
        await page.waitForTimeout(600);
        const b = await stripY(page);
        assert.equal(await moving(page), true, 'clip still playing');
        if (rolls) assert.ok(b > a, `strip did not move: ${a} then ${b}`);
        else assert.equal(b, a, 'strip moved in the drawn fallback');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('a strip that arrives after the dark period leaves the inline minimap for the whole intro', async () => {
    let served = false;
    const late = ['**/minimap-strip.svg', async (r) => {
      await new Promise((res) => setTimeout(res, 2500));
      served = true;
      await r.continue();
    }];
    const SWAP_WATCH = () => {
      window.__mmSwapped = false;
      new MutationObserver(() => {
        if (document.querySelector('.dash-minimap img')) window.__mmSwapped = true;
      }).observe(document, { childList: true, subtree: true });
    };
    const page = await open({ routes: [...withScene(NO_CLIP), late], init: [SWAP_WATCH] });
    try {
      await mounted(page);
      const t0 = Date.now();
      while (!served && Date.now() - t0 < 6000) await page.waitForTimeout(100);
      assert.ok(served, 'the strip was never served');
      // Let it load and its promise settle, then look again after the push-in.
      await page.waitForTimeout(800);
      assert.equal(await page.locator('.dash-minimap img').count(), 0, 'the late strip swapped in');
      assert.equal(await css(page, '.dash-minimap svg', 'display'), 'block');
      await enter(page, 'Escape');
      await landed(page);
      assert.equal(await page.evaluate(() => window.__mmSwapped), false, 'swapped at some point');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('minimap files', () => {
  // The drawing only: no embedded metadata block (it was about 17 KB of the first load).
  for (const [file, shapes, limit] of [['assets/dash/minimap-arrow.svg', { polygon: 1 }, 400], [STRIP, { rect: 47, circle: 18, path: 2 }, 5200]]) {
    test(`${file}: no metadata block, the drawing is whole, at most ${limit} bytes`, async () => {
      const svg = await readFile(path.join(SRC, file), 'utf8');
      assert.ok(svg.startsWith('<svg ') && svg.trimEnd().endsWith('</svg>'), 'not one svg element');
      assert.ok(!/<metadata|c2pa|xpacket|<rdf/i.test(svg), 'metadata still in the file');
      for (const [tag, n] of Object.entries(shapes)) {
        assert.equal((svg.match(new RegExp(`<${tag}[ />]`, 'g')) || []).length, n, `<${tag}> count`);
      }
      assert.ok(Buffer.byteLength(svg) <= limit, `${Buffer.byteLength(svg)} bytes`);
    });
  }
});
