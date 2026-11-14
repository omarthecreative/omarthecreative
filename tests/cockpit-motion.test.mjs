// Gauges and the moving minimap (plan 2026-11-14-rendered-cockpit-review-2, part B, sections 3
// and 4). The car moves only while the scene's clip is playing: html.dash-moving (ruling R1).
// Run from tests/: `node --test cockpit-motion.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  start, stop, open, done, until, introStart, mounted, landed, css, rect, enter, SRC, FIXTURES,
} from './helpers/intro-page.mjs';

before(start);
after(stop);

// Test scenes.
// Scene media under test-media/ come from tests/fixtures/. The minimap is the real strip.
const MEDIA_TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg' };
const STRIP = 'assets/dash/scenes/miami-beach/minimap-strip.svg';
function withScene(scene) {
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
const STILL = 'test-media/still.jpg';
const CLIP = { still: STILL, clip: 'test-media/clip.webm' };
const NO_CLIP = { still: STILL };

// The fixture clip is 1 s long. Slow it down (test only) so there is time to watch it play.
const SLOW = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.playbackRate = 0.1; return play.call(this); };
};
// play() starts 1.5 s late, then plays at a fifth of the speed.
const LATE = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    return new Promise((r) => setTimeout(r, 1500)).then(() => { this.playbackRate = 0.2; return play.call(this); });
  };
};
const REFUSE = () => {
  HTMLMediaElement.prototype.play = function () {
    return Promise.reject(new DOMException('play() refused', 'NotAllowedError'));
  };
};

// In the page: window.__v(which) is a needle's value v (which: 'speed' or 'revs'), read from the
// computed transforms of the needle's group and its inner wander group: angle a, v = (a - 138) / 260.
// window.__samples: every frame from the intro's start for 3 s, { t (ms since start), s, r }.
// window.__mv: html.dash-moving going 'on' and 'off', and the clip's events, in order.
const PROBE = () => {
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
  window.__samples = [];
  let t0 = null;
  const frame = (now) => {
    try {
      window.__samples.push({ t: now - t0, s: window.__v('speed'), r: window.__v('revs') });
    } catch (e) {
      window.__samples.push({ t: now - t0, error: String(e) });
    }
    if (now - t0 < 3000) requestAnimationFrame(frame);
  };
  window.__mv = [];
  let was = false;
  new MutationObserver(() => {
    const now = document.documentElement.classList.contains('dash-moving');
    if (now !== was) { was = now; window.__mv.push(now ? 'on' : 'off'); }
    if (t0 === null && document.body && document.body.classList.contains('intro-active')) {
      t0 = performance.now();
      requestAnimationFrame(frame);
    }
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  for (const type of ['playing', 'waiting', 'pause', 'ended', 'error', 'emptied']) {
    document.addEventListener(type, (e) => { if (e.target.id === 'dash-clip') window.__mv.push(type); }, true);
  }
};

const v = (page, which) => page.evaluate((w) => window.__v(w), which);
const moving = (page) => page.evaluate(() => document.documentElement.classList.contains('dash-moving'));
const sinceStart = (page, ms, timeout = ms + 8000) =>
  until(page, (ms) => performance.now() - window.__marks.introStart > ms, timeout, ms);
// Sample both needles every 50 ms for ms milliseconds.
async function sample(page, ms) {
  return page.evaluate((ms) => new Promise((resolve) => {
    const out = [];
    const t0 = performance.now();
    const tick = () => {
      out.push({ s: window.__v('speed'), r: window.__v('revs') });
      if (performance.now() - t0 >= ms) resolve(out); else setTimeout(tick, 50);
    };
    tick();
  }), ms);
}
const span = (xs) => Math.max(...xs) - Math.min(...xs);
// Times the direction of travel changes (equal neighbours ignored).
function reversals(xs) {
  let n = 0, dir = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = Math.sign(xs[i] - xs[i - 1]);
    if (d !== 0 && dir !== 0 && d !== dir) n++;
    if (d !== 0) dir = d;
  }
  return n;
}
const near = (x, want, tol) => Math.abs(x - want) <= tol;
const TOL = 0.008; // the wander's 0.006 plus 0.002

// Hub of a gauge on screen, from the cockpit picture's rect.
const HUBS = { speed: [0.1786, 0.5394], revs: [0.3115, 0.5384] };
const hubAt = (img, which) => [img.left + HUBS[which][0] * img.width, img.top + HUBS[which][1] * img.height];

describe('gauges', { concurrency: 1 }, () => {
  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    test(`${w}x${h}: needles on the hubs, turning about them, drawn as specified`, async () => {
      const page = await open({ viewport: { width: w, height: h }, init: [PROBE] });
      try {
        await mounted(page);
        const img = await rect(page, '#dash-cockpit-img');
        const svg = await rect(page, '#dash-gauges');
        for (const k of ['left', 'top', 'width', 'height']) {
          assert.ok(Math.abs(svg[k] - img[k]) <= 1, `gauges ${k} ${svg[k]}, picture ${img[k]}`);
        }
        assert.equal(await css(page, '#dash-gauges', 'pointerEvents'), 'none');
        for (const which of ['speed', 'revs']) {
          const g = `#dash-gauges .dash-gauge-${which}`;
          assert.equal(await page.locator(`${g} line`).count(), 1, `${which} needle`);
          // The ring is the hub circle beside the needle's group.
          const ring = await page.evaluate((g) => {
            const c = document.querySelector(g).parentNode.querySelector(':scope > circle');
            const b = c.getBoundingClientRect();
            const s = getComputedStyle(c);
            return { x: b.left + b.width / 2, y: b.top + b.height / 2, fill: s.fill, stroke: s.stroke };
          }, g);
          const [hx, hy] = hubAt(img, which);
          assert.ok(Math.abs(ring.x - hx) <= 1 && Math.abs(ring.y - hy) <= 1, `${which} ring at ${ring.x},${ring.y}, hub ${hx},${hy}`);
          assert.equal(ring.fill, 'rgb(10, 14, 24)', `${which} ring fill`);
          // Line: colour, caps, stroke 1.5 at 1600 wide.
          const line = await page.evaluate((g) => {
            const l = document.querySelector(`${g} line`);
            const s = getComputedStyle(l);
            const m = l.getScreenCTM();
            return { stroke: s.stroke, cap: s.strokeLinecap, px: parseFloat(s.strokeWidth) * Math.hypot(m.a, m.b) };
          }, g);
          assert.equal(line.stroke, 'rgb(236, 238, 242)', `${which} stroke`);
          assert.equal(line.cap, 'round', `${which} caps`);
          assert.ok(Math.abs(line.px - 1.5 * img.width / 1600) <= 0.2, `${which} stroke ${line.px}px`);
          // At a known v the far tip is 0.0307 of the picture's width from the hub, along the angle.
          for (const want of [0.12, 0.45]) {
            const box = await page.evaluate(([g, want]) => {
              const el = document.querySelector(g);
              const inner = el.querySelector('.dash-gauge-wander');
              el.style.transition = 'none';
              el.style.transform = `rotate(${138 + 260 * want}deg)`;
              inner.style.animation = 'none';
              inner.style.transition = 'none';
              inner.style.transform = 'none';
              const b = el.querySelector('line').getBoundingClientRect();
              return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, v: window.__v(g.endsWith('speed') ? 'speed' : 'revs') };
            }, [g, want]);
            assert.ok(near(box.v, want, 0.001), `${which} v read back ${box.v}`);
            const a = (138 + 260 * want) * Math.PI / 180;
            const L = 0.0307 * img.width;
            const tip = [hx + L * Math.cos(a), hy + L * Math.sin(a)];
            const got = [Math.cos(a) < 0 ? box.left : box.right, Math.sin(a) > 0 ? box.bottom : box.top];
            assert.ok(Math.hypot(got[0] - tip[0], got[1] - tip[1]) <= 1.5,
              `${which} at v=${want}: tip ${got.map((n) => n.toFixed(1))}, want ${tip.map((n) => n.toFixed(1))}`);
          }
        }
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  test('sweep: 0 to 0.6 and back to rest in about 1400 ms, never past 0.6 (scene with no clip)', async () => {
    const page = await open({ routes: withScene(NO_CLIP), init: [PROBE] });
    try {
      await introStart(page);
      await until(page, () => window.__samples.length && window.__samples.at(-1).t >= 3000, 6000);
      const all = await page.evaluate(() => window.__samples);
      const errs = all.filter((x) => x.error);
      assert.deepEqual(errs.slice(0, 1), [], 'needles not readable');
      const first = all[0];
      assert.ok(near(first.s, 0, 0.003) && near(first.r, 0, 0.003), `starts at 0: ${JSON.stringify(first)}`);
      for (const k of ['s', 'r']) {
        const peak = Math.max(...all.map((x) => x[k]));
        assert.ok(peak <= 0.605, `${k} passed 0.6: ${peak}`);
        assert.ok(peak >= 0.55, `${k} only reached ${peak}`);
      }
      // Over by about 1400 ms after the needles first move (the first frame after the page shows
      // can come 100 to 200 ms late): from 1500 ms after that, at rest. No clip, so speed rests at 0.
      const moved = all.find((x) => x.s > 0.001 || x.r > 0.001);
      assert.ok(moved && moved.t < 400, `needles first moved at ${moved && moved.t} ms`);
      const late = all.filter((x) => x.t >= moved.t + 1500);
      assert.ok(late.length >= 5, `${late.length} late samples`);
      for (const x of late) {
        assert.ok(near(x.s, 0, 0.003), `speed at ${x.t.toFixed(0)} ms: ${x.s}`);
        assert.ok(near(x.r, 0.14, TOL), `revs at ${x.t.toFixed(0)} ms: ${x.r}`);
      }
      assert.equal(await moving(page), false);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('clip playing: speed 0.05 and revs 0.14 with a slow wander; after ended speed eases to 0 and stays', async () => {
    const page = await open({ routes: withScene(CLIP), init: [SLOW, PROBE] });
    try {
      await introStart(page);
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
      await sinceStart(page, 3000);
      const playing = await sample(page, 5000);
      assert.equal(await moving(page), true, 'clip still playing');
      for (const x of playing) {
        assert.ok(near(x.s, 0.05, TOL), `speed ${x.s}`);
        assert.ok(near(x.r, 0.14, TOL), `revs ${x.r}`);
      }
      const revs = playing.map((x) => x.r);
      assert.ok(span(revs) > 0.0005, `revs constant over 5 s: ${span(revs)}`);
      assert.ok(reversals(revs) <= 6, `revs reversed ${reversals(revs)} times in 5 s`);
      assert.ok(reversals(playing.map((x) => x.s)) <= 6, 'speed wanders too fast');
      // Play to the end.
      await page.evaluate(() => { const c = document.getElementById('dash-clip'); c.currentTime = c.duration - 0.01; });
      await until(page, () => document.getElementById('dash-clip').ended, 4000);
      const tEnded = Date.now();
      assert.equal(await moving(page), false, 'html.dash-moving after ended');
      await until(page, () => Math.abs(window.__v('speed')) <= 0.003, 2000);
      assert.ok(Date.now() - tEnded <= 2100, `speed took ${Date.now() - tEnded} ms`);
      // The 1500 ms ease is over by 2 s after ended; from then on the speed needle is still.
      await page.waitForTimeout(Math.max(0, tEnded + 2000 - Date.now()));
      const after = await sample(page, 2000);
      assert.ok(span(after.map((x) => x.s)) <= 0.0005, `speed moves after ended: ${span(after.map((x) => x.s))}`);
      for (const x of after) assert.ok(near(x.s, 0, 0.003) && near(x.r, 0.14, TOL), JSON.stringify(x));
      assert.ok(span(after.map((x) => x.r)) > 0.0005, 'revs stopped wandering');
      // html.dash-moving: never before the first playing, on while playing, off after ended.
      const log = await page.evaluate(() => window.__mv);
      const s = log.join(' ');
      assert.ok(log.indexOf('playing') !== -1 && log.indexOf('on') > log.indexOf('playing'), `on only after playing: ${s}`);
      assert.ok(log.lastIndexOf('off') > log.lastIndexOf('on'), `off after ended: ${s}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('play() refused: never moving, speed ends at 0 and revs at 0.14', async () => {
    const page = await open({ routes: withScene(CLIP), init: [REFUSE, PROBE] });
    try {
      await introStart(page);
      await sinceStart(page, 3000);
      assert.ok(near(await v(page, 'speed'), 0, 0.003), `speed ${await v(page, 'speed')}`);
      assert.ok(near(await v(page, 'revs'), 0.14, TOL), `revs ${await v(page, 'revs')}`);
      assert.deepEqual(await page.evaluate(() => window.__mv.filter((k) => k === 'on')), []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('html.dash-moving: off after a pause, on again when it plays, off after an error', async () => {
    const page = await open({ routes: withScene(CLIP), init: [SLOW, PROBE] });
    try {
      await introStart(page);
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
      await page.evaluate(() => document.getElementById('dash-clip').pause());
      await until(page, () => !document.documentElement.classList.contains('dash-moving'), 1000);
      await page.evaluate(() => document.getElementById('dash-clip').play());
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 2000);
      await page.evaluate(() => document.getElementById('dash-clip').dispatchEvent(new Event('error')));
      await page.waitForTimeout(100);
      assert.equal(await moving(page), false, (await page.evaluate(() => window.__mv)).join(' '));
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('after landing: not moving, nothing running on the needles or the minimap, no page errors', async () => {
    const page = await open({ routes: withScene(CLIP), init: [SLOW, PROBE] });
    try {
      await introStart(page);
      await until(page, () => document.documentElement.classList.contains('dash-moving'), 4000);
      await sinceStart(page, 2000);
      await enter(page, 'Escape');
      await landed(page);
      await page.waitForTimeout(300);
      assert.equal(await moving(page), false);
      const running = await page.evaluate(() => [
        ...document.querySelectorAll('#dash-gauges, #dash-gauges *, .dash-minimap, .dash-minimap *'),
      ].flatMap((el) => el.getAnimations().map((a) => `${el.getAttribute('class') || el.id}: ${a.animationName || a.transitionProperty || a.id} ${a.playState}`)));
      assert.deepEqual(running, []);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('no gauges in the tall cockpit (390x844)', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-dash-mode')), 'tall');
      assert.equal(await css(page, '#dash-gauges', 'display'), 'none');
      const r = await rect(page, '#dash-gauges');
      assert.equal(r.width + r.height, 0);
    } finally {
      await done(page);
    }
  });

  test('no gauges in the drawn fallback (cockpit picture blocked)', async () => {
    const page = await open({ drawn: true });
    try {
      await mounted(page);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dash-rendered')), false);
      assert.equal(await css(page, '#dash-gauges', 'display'), 'none');
      const r = await rect(page, '#dash-gauges');
      assert.equal(r.width + r.height, 0);
    } finally {
      await done(page);
    }
  });
});

// Minimap.
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

describe('files', () => {
  test('the old minimap.svg is gone; the scene points at minimap-strip.svg; the new pictures are in', async () => {
    await assert.rejects(fs.access(path.join(SRC, 'assets/dash/scenes/miami-beach/minimap.svg')));
    const scenes = await fs.readFile(path.join(SRC, 'dashboard-scenes.js'), 'utf8');
    assert.match(scenes, /minimap: 'assets\/dash\/scenes\/miami-beach\/minimap-strip\.svg'/);
    await fs.access(path.join(SRC, STRIP));
    await fs.access(path.join(SRC, 'assets/dash/minimap-arrow.svg'));
  });

  test('index.html: motion files right after the intro files, start() next to startClip()', async () => {
    const html = await fs.readFile(path.join(SRC, 'index.html'), 'utf8');
    // assert.ok, not assert.match: a failing match would print the whole page.
    assert.ok(/href="dashboard-intro\.css\?v=8">\s*<link rel="stylesheet" href="dashboard-motion\.css\?v=1">/.test(html),
      'dashboard-motion.css?v=1 right after dashboard-intro.css');
    assert.ok(/src="dashboard-intro\.js\?v=7"><\/script>\s*<script src="dashboard-motion\.js\?v=1"><\/script>/.test(html),
      'dashboard-motion.js?v=1 right after dashboard-intro.js');
    assert.ok(/DashIntro\.startClip\(\);\s*\n\s*if \(window\.DashMotion\) DashMotion\.start\(\);/.test(html),
      'DashMotion.start() right after DashIntro.startClip()');
  });
});
