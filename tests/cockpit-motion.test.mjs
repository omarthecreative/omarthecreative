// Gauges and the moving minimap (plan 2026-11-14-rendered-cockpit-review-2, part B, sections 3
// and 4). The car moves only while the scene's clip is playing: html.dash-moving (ruling R1).
// Run from tests/: `node --test cockpit-motion.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  start, stop, open, done, until, introStart, landed, enter, FIXTURES,
} from './helpers/intro-page.mjs';

before(start);
after(stop);

// — Test scenes —
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

// The fixture clip is 1 s long. Slow it down (test only) so there is time to watch it play.
const SLOW = () => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.playbackRate = 0.1; return play.call(this); };
};
// In the page: window.__v(which) is a needle's value v (which: 'speed' or 'revs'), read from the
// computed transforms of the needle's group and its inner wander group: angle a, v = (a - 138) / 260.
// window.__samples: every frame from the intro's start for 2.5 s, { t (ms since start), s, r }.
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
    if (now - t0 < 2500) requestAnimationFrame(frame);
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

const moving = (page) => page.evaluate(() => document.documentElement.classList.contains('dash-moving'));
const sinceStart = (page, ms, timeout = ms + 8000) =>
  until(page, (ms) => performance.now() - window.__marks.introStart > ms, timeout, ms);

describe('html.dash-moving', { concurrency: 1 }, () => {
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
});
