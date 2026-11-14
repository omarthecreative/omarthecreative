// The doll's switch from the dance to follow mode (fix pass after the review of the whole
// change, item Y-2). On the first mouse move the loop starts at once and takes over on the first
// frame the doll is on the ground and its top piece is not stretched or squashed: the spring
// starts from the dance's turn of that frame, so nothing jumps.
// Run from tests/: `node --test doll-switch.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, open, done, until, mounted, rect } from './helpers/intro-page.mjs';

before(start);
after(stop);

// Headless Chromium draws this page at about 30 frames a second, often slower (frames 33 to 130 ms
// apart), and between two such frames the dance on its own turns more than 3 degrees. So the jump
// is measured against a ghost: a hidden copy of the doll placed on the same spot, whose hop and
// dance are set to the same start time as the real doll's. It keeps dancing after the real doll
// switches, so at any frame it shows the pose the real doll would have had. The switch adds
// nothing if, at the first frame in follow mode, the real doll's top piece matches the ghost's.
// The literal frame-to-frame figures come from real Chrome (fix-report.md).
//
// In the page: __switchAt(name, phase, x, y, sel) adds the ghost, waits for the frame where the
// animation `name` (dash-dance on the top piece sel, or dash-hop on .dash-doll) is at `phase` of
// its 1.6 s loop, sends one mouse pointermove at (x, y), and samples every frame until 300 ms after
// follow mode is on (or 1500 ms): { t (ms since the move), follow, rot and top (the real top
// piece: turn in degrees, top edge in px), grot and gtop (the ghost's) }. The first sample is the
// frame of the move, before it.
const SWITCH = () => {
  window.__switchAt = (name, phase, x, y, sel) => new Promise((resolve) => {
    const doll = document.querySelector('.dash-doll');
    const top = doll.querySelector(sel);
    const ghost = doll.cloneNode(true);
    ghost.style.visibility = 'hidden';
    ghost.setAttribute('aria-hidden', 'true');
    doll.after(ghost);
    const gtop = ghost.querySelector(sel);
    for (const [a, b] of [[doll, ghost], [top, gtop]]) {
      for (const an of a.getAnimations()) {
        const bn = b.getAnimations().find((x) => x.animationName === an.animationName);
        if (bn) bn.startTime = an.startTime;
      }
    }
    const anim = [doll, top].flatMap((el) => el.getAnimations()).find((a) => a.animationName === name);
    const out = [];
    let moved = null;
    let on = null;
    const turn = (el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.atan2(m.b, m.a) * 180 / Math.PI;
    };
    const sample = (t) => {
      const s = {
        t: moved === null ? 0 : t - moved,
        follow: doll.classList.contains('dash-doll-follow'),
        rot: turn(top),
        top: top.getBoundingClientRect().top,
        grot: turn(gtop),
        gtop: gtop.getBoundingClientRect().top,
      };
      out.push(s);
      return s;
    };
    const f = (t) => {
      if (moved === null) {
        const p = (anim.currentTime % 1600) / 1600;
        if (p >= phase && p < phase + 0.012) {
          sample(t);
          moved = t;
          document.body.dispatchEvent(new PointerEvent('pointermove', {
            pointerType: 'mouse', clientX: x, clientY: y, bubbles: true,
          }));
        }
        requestAnimationFrame(f);
        return;
      }
      const s = sample(t);
      if (s.follow && on === null) on = s.t;
      if ((on !== null && s.t - on > 300) || s.t > 1500) resolve({ out, on }); else requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
};

// Where the first move starts, and the lean it aims at: near the dance's turn at the moment
// follow mode can take over, so the spring itself barely moves after the switch.
const STARTS = [
  ['at rest', 'dash-dance', 0, 0],
  ['at a wiggle peak (-13 degrees)', 'dash-dance', 0.08, -12],
  ['at a wiggle peak (+13 degrees)', 'dash-dance', 0.18, 12],
  ['mid-hop', 'dash-hop', 0.5, -5],
  ['mid-squash', 'dash-dance', 0.62, -5],
  ['at the settle wobble (+5 degrees)', 'dash-dance', 0.86, 5],
];

async function openDoll(drawn) {
  const page = await open({ drawn, init: [SWITCH] });
  await mounted(page);
  if (drawn) {
    await until(page, () => !document.documentElement.classList.contains('dash-rendered')
      && getComputedStyle(document.querySelector('.dash-doll-top')).display !== 'none', 4000);
  } else {
    await until(page, () => document.documentElement.classList.contains('dash-rendered')
      && document.querySelector('.dash-doll').classList.contains('dash-doll-rendered'), 8000);
  }
  return page;
}

describe('the switch to follow mode', { concurrency: 1 }, () => {
  for (const [look, drawn, sel] of [['rendered', false, '.dash-doll-r-top'], ['drawn (cockpit picture blocked)', true, '.dash-doll-top']]) {
    for (const [when, name, phase, aim] of STARTS) {
      test(`${look}: first mouse move ${when}: at the switch the top piece is within 3 degrees and 3 px of the dance; then under 3 degrees and 3 px a 1/60 s; follow within 700 ms`, async (t) => {
        const page = await openDoll(drawn);
        try {
          const d = await rect(page, '.dash-doll');
          const x = d.left + d.width / 2 + (aim / 12) * 0.35 * page.vw;
          const y = Math.min(page.vh - 10, d.bottom + 300);
          const r = await page.evaluate(([name, phase, x, y, sel]) => window.__switchAt(name, phase, x, y, sel), [name, phase, x, y, sel]);
          const first = r.out.findIndex((s) => s.follow);
          assert.ok(first > 0, `follow mode never came on: ${JSON.stringify(r.out.slice(-3))}`);
          const sw = r.out[first];
          const dance = r.out.slice(0, first);
          // The ghost matches the dancing doll until the switch (the method works).
          const sync = Math.max(...dance.map((f) => Math.max(Math.abs(f.rot - f.grot), Math.abs(f.top - f.gtop))));
          // The switch itself: the real doll against the pose the dance has at that frame.
          const jump = { turn: Math.abs(sw.rot - sw.grot), edge: Math.abs(sw.top - sw.gtop) };
          // Follow mode from the switch on, per 1/60 s.
          const follow = r.out.slice(first);
          let turn = 0;
          let edge = 0;
          for (let i = 1; i < follow.length; i++) {
            const n = Math.max(1, (follow[i].t - follow[i - 1].t) / (1000 / 60));
            turn = Math.max(turn, Math.abs(follow[i].rot - follow[i - 1].rot) / n);
            edge = Math.max(edge, Math.abs(follow[i].top - follow[i - 1].top) / n);
          }
          const s = JSON.stringify({ on: Math.round(r.on), sync: +sync.toFixed(2),
            jump: { turn: +jump.turn.toFixed(2), edge: +jump.edge.toFixed(2) },
            follow: { turn: +turn.toFixed(2), edge: +edge.toFixed(2) },
            at: [+sw.rot.toFixed(2), +sw.grot.toFixed(2), +sw.top.toFixed(1), +sw.gtop.toFixed(1)] });
          t.diagnostic(s);
          assert.ok(sync <= 0.5, `the ghost is not in step with the doll: ${s}`);
          assert.ok(r.on <= 700, `follow mode ${r.on} ms after the move: ${s}`);
          assert.ok(jump.turn <= 3, `at the switch the top piece turned ${jump.turn} degrees off the dance: ${s}`);
          assert.ok(jump.edge <= 3, `at the switch the top edge moved ${jump.edge} px off the dance: ${s}`);
          assert.ok(turn <= 3 && edge <= 3, `follow mode moves too fast after the switch: ${s}`);
          assert.deepEqual(page.errors, []);
        } finally {
          await done(page);
        }
      });
    }
  }

  test('rendered: once follow mode is on, no computed style is read per frame', async () => {
    const page = await open({ init: [() => {
      const gcs = window.getComputedStyle;
      window.__gcsFromMotion = 0;
      window.getComputedStyle = function () {
        if (/dashboard-motion\.js/.test(new Error().stack || '')) window.__gcsFromMotion++;
        return gcs.apply(this, arguments);
      };
    }] });
    try {
      await mounted(page);
      await until(page, () => document.querySelector('.dash-doll').classList.contains('dash-doll-rendered'), 8000);
      const d = await rect(page, '.dash-doll');
      await page.mouse.move(page.vw - 10, Math.min(page.vh - 10, d.bottom + 300));
      await until(page, () => document.querySelector('.dash-doll').classList.contains('dash-doll-follow'), 2000);
      const n0 = await page.evaluate(() => window.__gcsFromMotion);
      await page.waitForTimeout(1000);
      assert.equal(await page.evaluate(() => window.__gcsFromMotion), n0, 'computed style read in follow mode');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});
