// The doll follows the cursor (plan 2026-11-14-rendered-cockpit-review-2, part C, section 5).
// With a mouse the doll leans toward the cursor on a spring (--doll-lean on .dash-doll, ruling R8).
// Touch, and no movement: the dance stays. The loop stops when the push-in starts (R15).
// Run from tests/: `node --test doll-follow.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, open, done, until, mounted, landed, rect, enter } from './helpers/intro-page.mjs';

before(start);
after(stop);

// In the page:
//   __lean()          --doll-lean read from .dash-doll's inline style, in degrees (NaN if unset)
//   __rot(sel)        the rotation of sel's computed transform, in degrees
//   __gap()           gaps to #dash-screen grown by its bezel, 11px * --dash-fit, from the doll:
//                     { all: smallest over its box and both rendered pieces, as transformed;
//                       top: from the rendered top piece alone }. Negative: they intersect.
//   __frames(ms, g)   every frame for ms: { t (page clock), lean, gap (if g) }
//   __loopRuns        requestAnimationFrame callbacks run that dashboard-motion.js asked for
const PROBE = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__loopRuns = 0;
  window.requestAnimationFrame = (cb) => (/dashboard-motion\.js/.test(new Error().stack || '')
    ? raf((t) => { window.__loopRuns++; cb(t); })
    : raf(cb));
  window.__lean = () => {
    const v = document.querySelector('.dash-doll').style.getPropertyValue('--doll-lean');
    return v ? parseFloat(v) : NaN;
  };
  window.__rot = (sel) => {
    const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(document.querySelector(sel)).transform);
    if (!m) return 0;
    const [a, b] = m[1].split(',').map(Number);
    return Math.atan2(b, a) * 180 / Math.PI;
  };
  window.__gap = () => {
    const doll = document.querySelector('.dash-doll');
    const screen = document.getElementById('dash-screen');
    const fit = parseFloat(getComputedStyle(screen).getPropertyValue('--dash-fit')) || 1;
    const bezel = 11 * fit;
    const s = screen.getBoundingClientRect();
    const gap = (el) => {
      const b = el.getBoundingClientRect();
      const gx = Math.max(s.left - bezel - b.right, b.left - (s.right + bezel));
      const gy = Math.max(s.top - bezel - b.bottom, b.top - (s.bottom + bezel));
      return Math.max(gx, gy);
    };
    return {
      all: Math.min(...[doll, ...doll.querySelectorAll('.dash-doll-r')].map(gap)),
      top: gap(doll.querySelector('.dash-doll-r-top')),
    };
  };
  window.__frames = (ms, gap = false) => new Promise((resolve) => {
    const out = [];
    let t0 = null;
    const f = (t) => {
      if (t0 === null) t0 = t;
      const s = { t, lean: window.__lean() };
      if (gap) s.gap = window.__gap();
      out.push(s);
      if (t - t0 < ms) raf(f); else resolve(out);
    };
    raf(f);
  });
};

const TOP_R = '.dash-doll-r-top';
const TOP_D = '.dash-doll-top';

// Open the home page with the probe and wait for the dashboard and the doll's look.
// page.top is the doll's top piece for that look.
async function openDoll({ drawn = false, viewport, mode = 'wide' } = {}) {
  const page = await open({ viewport, drawn, init: [PROBE] });
  await mounted(page);
  if (drawn) {
    await until(page, () => !document.documentElement.classList.contains('dash-rendered')
      && getComputedStyle(document.querySelector('.dash-doll-top')).display !== 'none', 4000);
  } else {
    await until(page, (mode) => document.documentElement.classList.contains('dash-rendered')
      && document.documentElement.dataset.dashMode === mode
      && document.querySelector('.dash-doll').classList.contains('dash-doll-rendered'), 8000, mode);
  }
  page.top = drawn ? TOP_D : TOP_R;
  return page;
}
const LOOKS = [['rendered', false], ['drawn (cockpit picture blocked)', true]];

// The doll's box, with its centre.
async function dollAt(page) {
  const r = await rect(page, '.dash-doll');
  return { ...r, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}
// The plan's target lean for a pointer at x.
const aimFor = (page, d, x) => Math.max(-1, Math.min(1, (x - d.cx) / (0.35 * page.vw))) * 12;
// A height well over 90 px from the doll, so moves along it never kick.
function farY(page, d) {
  const y = Math.min(page.vh - 10, d.bottom + 300);
  assert.ok(y - d.bottom > 90, `no room below the doll: ${y} ${d.bottom}`);
  return y;
}
const frames = (page, ms, gap = false) => page.evaluate(([ms, gap]) => window.__frames(ms, gap), [ms, gap]);
const now = (page) => page.evaluate(() => performance.now());
const anims = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  return { name: getComputedStyle(el).animationName, running: el.getAnimations().filter((a) => a.playState === 'running').length };
}, sel);

describe('the spring', { concurrency: 1 }, () => {
  test('DashMotion.springStep: one 1/60 s step; to 12 from rest it peaks at 17.0 to 17.5 and ends at 12', async () => {
    const page = await open();
    try {
      const r = await page.evaluate(() => {
        const s0 = { lean: 0, v: 0 };
        const first = DashMotion.springStep(s0, 12);
        let s = s0, max = -Infinity;
        for (let i = 0; i < 600; i++) {
          s = DashMotion.springStep(s, 12);
          max = Math.max(max, s.lean);
        }
        return { s0, first, max, end: s.lean };
      });
      assert.deepEqual(r.s0, { lean: 0, v: 0 }, 'the state passed in is not changed');
      assert.ok(Math.abs(r.first.v - 0.96) < 1e-9 && Math.abs(r.first.lean - 0.96) < 1e-9, JSON.stringify(r.first));
      assert.ok(r.max >= 17.0 && r.max <= 17.5, `max ${r.max}`);
      assert.ok(Math.abs(r.end - 12) < 0.01, `end ${r.end}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('follow mode', { concurrency: 1 }, () => {
  for (const [look, drawn] of LOOKS) {
    test(`${look} 1440x900: far right settles between 10 and 12, far left between -12 and -10, overshooting each time; the top piece turns by --doll-lean`, async () => {
      const page = await openDoll({ drawn });
      try {
        const d = await dollAt(page);
        const y = farY(page, d);
        for (const [x, sign] of [[page.vw - 10, 1], [10, -1]]) {
          assert.equal(aimFor(page, d, x), 12 * sign, 'the pointer is past full reach');
          const sampling = frames(page, 2500);
          await page.mouse.move(x, y);
          const fr = (await sampling).map((f) => f.lean).filter((l) => !Number.isNaN(l));
          const end = fr[fr.length - 1];
          const peak = sign > 0 ? Math.max(...fr) : Math.min(...fr);
          assert.ok(sign * peak > 12.5, `${sign > 0 ? 'right' : 'left'}: never passed the target: peak ${peak}`);
          assert.ok(sign * end >= 10 && sign * end <= 12.01, `${sign > 0 ? 'right' : 'left'}: settled at ${end}`);
          const r = await page.evaluate((sel) => ({ lean: window.__lean(), rot: window.__rot(sel) }), page.top);
          assert.ok(Math.abs(r.rot - r.lean) < 0.5, `top piece turned ${r.rot}, --doll-lean ${r.lean}`);
        }
        if (drawn) assert.equal((await anims(page, '.dash-doll-wave')).name, 'dash-wave', 'the arm keeps waving');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });

    test(`${look}: the dance runs until a mouse moves; a touch move changes nothing; then hop and dance are off`, async () => {
      const page = await openDoll({ drawn });
      try {
        const check = async (when) => {
          const hop = await anims(page, '.dash-doll');
          const dance = await anims(page, page.top);
          assert.equal(hop.name, 'dash-hop', `${when}: hop`);
          assert.equal(dance.name, 'dash-dance', `${when}: dance`);
          assert.ok(hop.running > 0 && dance.running > 0, `${when}: running ${JSON.stringify([hop, dance])}`);
          const s = await page.evaluate(() => ({
            follow: document.querySelector('.dash-doll').classList.contains('dash-doll-follow'),
            lean: window.__lean(),
          }));
          assert.equal(s.follow, false, `${when}: follow mode`);
          assert.ok(Number.isNaN(s.lean), `${when}: --doll-lean ${s.lean}`);
        };
        await page.waitForTimeout(1000);
        await check('no movement');
        const d = await dollAt(page);
        await page.evaluate(([x, y]) => {
          for (let i = 0; i < 5; i++) {
            document.body.dispatchEvent(new PointerEvent('pointermove', {
              pointerType: 'touch', clientX: x + 40 * i, clientY: y, bubbles: true,
            }));
          }
        }, [d.cx, d.cy]);
        await page.waitForTimeout(500);
        await check('after a touch move');
        await page.mouse.move(page.vw - 10, farY(page, d));
        await until(page, () => document.querySelector('.dash-doll').classList.contains('dash-doll-follow'), 2000);
        await page.waitForTimeout(100);
        const hop = await anims(page, '.dash-doll');
        const dance = await anims(page, page.top);
        assert.equal(hop.name, 'none', 'follow: hop');
        assert.equal(dance.name, 'none', 'follow: dance');
        assert.equal(hop.running + dance.running, 0, 'follow: nothing running on the doll or its top piece');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });

    test(`${look}: push-in in follow mode runs dash-sway-hard and --doll-lean stops changing`, async () => {
      const page = await openDoll({ drawn });
      try {
        const d = await dollAt(page);
        const y = farY(page, d);
        await page.mouse.move(page.vw - 10, y);
        await page.waitForTimeout(300);
        // At the moment dash-pushing is set, then every frame while it stays.
        const watching = page.evaluate((sel) => new Promise((resolve) => {
          const h = document.documentElement;
          const out = { l0: null, anims: [], leans: [] };
          const f = () => {
            if (!h.classList.contains('dash-pushing')) { resolve(out); return; }
            out.leans.push(window.__lean());
            out.anims.push(getComputedStyle(document.querySelector(sel)).animationName);
            requestAnimationFrame(f);
          };
          const mo = new MutationObserver(() => {
            if (!h.classList.contains('dash-pushing')) return;
            mo.disconnect();
            out.l0 = window.__lean();
            f();
          });
          mo.observe(h, { attributes: true, attributeFilter: ['class'] });
          window.__watching = true;
        }), page.top);
        await until(page, () => window.__watching === true, 2000);
        const before = await page.evaluate(() => window.__lean());
        await enter(page, 'Escape');
        for (let i = 0; i < 5; i++) {
          await page.mouse.move(10 + 200 * i, y);
          await page.waitForTimeout(80);
        }
        const r = await watching;
        await landed(page);
        assert.ok(Number.isFinite(before) && Number.isFinite(r.l0), `lean ${before} ${r.l0}`);
        assert.ok(r.leans.length > 10, `frames while pushing: ${r.leans.length}`);
        assert.deepEqual([...new Set(r.anims)], ['dash-sway-hard']);
        assert.deepEqual([...new Set(r.leans)], [r.l0], '--doll-lean changed during the push-in');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('after landing: no loop and no pointermove listener; moving the mouse leaves --doll-lean as it was', async () => {
    const page = await openDoll();
    try {
      const cdp = await page.context().newCDPSession(page);
      const moveListeners = async () => {
        let n = 0;
        for (const expression of ['document', 'window']) {
          const { result } = await cdp.send('Runtime.evaluate', { expression });
          const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
          n += listeners.filter((l) => l.type === 'pointermove').length;
        }
        return n;
      };
      const d = await dollAt(page);
      const y = farY(page, d);
      assert.ok(await moveListeners() > 0, 'a pointermove listener while the intro shows');
      await page.mouse.move(page.vw - 10, y);
      await page.waitForTimeout(500);
      assert.ok(await page.evaluate(() => window.__loopRuns) > 10, 'the loop ran while following');
      await enter(page, 'Escape');
      await landed(page);
      const s0 = await page.evaluate(() => ({ runs: window.__loopRuns, lean: window.__lean() }));
      for (let i = 0; i < 6; i++) {
        await page.mouse.move(10 + 250 * i, d.cy);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(500);
      const s1 = await page.evaluate(() => ({ runs: window.__loopRuns, lean: window.__lean() }));
      assert.deepEqual(s1, s0, 'the loop ran, or the lean changed, after landing');
      assert.equal(await moveListeners(), 0, 'pointermove listeners after landing');
      await cdp.detach();
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('the doll and the screen', { concurrency: 1 }, () => {
  for (const [w, h] of [[1440, 900], [1024, 768]]) {
    test(`${w}x${h}: leaning right, settled and at the overshoot's peak, the doll stays clear of the screen and its bezel`, async (t) => {
      const page = await openDoll({ viewport: { width: w, height: h } });
      try {
        const d = await dollAt(page);
        const y = farY(page, d);
        const right = page.vw - 10;
        const left = 10;
        // Settled far right.
        let sampling = frames(page, 2000, true);
        await page.mouse.move(right, y);
        const settled = (await sampling).slice(-10);
        // From far left, settled, to far right: the largest overshoot.
        await page.mouse.move(left, y);
        await page.waitForTimeout(2000);
        sampling = frames(page, 1000, true);
        await page.mouse.move(right, y);
        const jump = await sampling;
        const peak = jump.reduce((a, f) => (f.lean > a.lean ? f : a));
        const r = {
          aim: [aimFor(page, d, left), aimFor(page, d, right)],
          settledLean: settled[settled.length - 1].lean,
          settledGap: Math.min(...settled.map((f) => f.gap.all)),
          settledTopGap: Math.min(...settled.map((f) => f.gap.top)),
          peakLean: peak.lean,
          peakTopGap: peak.gap.top,
          minGapInJump: Math.min(...jump.map((f) => f.gap.all)),
          minTopGapInJump: Math.min(...jump.map((f) => f.gap.top)),
        };
        const s = JSON.stringify(r);
        t.diagnostic(s);
        assert.ok(Math.abs(r.settledLean - 12) < 0.05, `not settled: ${s}`);
        assert.ok(r.peakLean > 20, `no overshoot: ${s}`);
        assert.ok(r.settledGap > 0, `settled, the doll reaches the screen's bezel: ${s}`);
        assert.ok(r.minGapInJump > 0, `overshooting, the doll reaches the screen's bezel: ${s}`);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});
