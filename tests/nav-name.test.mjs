// The top-left name on the landing page: OMAR SILWANY becomes OMAR, THE CREATIVE once the
// visitor has viewed anything. Before that, a short ghost of ", THE CREATIVE" hints at it.
// Both must happen where the visitor can see them: not while the dashboard intro hides the
// name, and not only on the next page load.
// Run from tests/: `node --test nav-name.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, open, done, until, mounted, landed, enter } from './helpers/intro-page.mjs';

before(start);
after(stop);

// Samples the name every frame for `ms`: how visible SILWANY, ", THE CREATIVE" and the whole
// name are (0 to 1; a part with display none counts as 0).
const watch = (page, ms) => page.evaluate((ms) => new Promise((resolve) => {
  const out = [], t0 = performance.now();
  const part = (id) => { const c = getComputedStyle(document.getElementById(id)); return c.display === 'none' ? 0 : +c.opacity; };
  const head = document.querySelector('.header-name');
  (function frame() {
    out.push({ t: Math.round(performance.now() - t0), last: part('name-last'), suffix: part('name-suffix'), header: +getComputedStyle(head).opacity });
    if (performance.now() - t0 > ms) return resolve(out);
    requestAnimationFrame(frame);
  })();
}), ms);
const peak = (samples, k) => Math.max(...samples.map((x) => x[k]));
const viewedBefore = () => { try { localStorage.setItem('omar_viewed', JSON.stringify(['v-0'])); } catch (e) {} };
// The tests block the video host. A stand-in player (every method answers with a settled
// promise) lets the page open a project and mark it viewed, as it does for a visitor.
const standInPlayer = () => {
  window.Vimeo = { Player: function () {
    return new Proxy({}, { get: (t, k) => (k === 'then' ? undefined : () => Promise.resolve(0)) });
  } };
};
const gridShowing = () => document.body.classList.contains('grid-active') && !document.body.classList.contains('project-view')
  && !document.body.classList.contains('video-active');

describe('landing page: the top-left name', () => {
  test('new visitor: no ghost while the intro hides the name; the ghost plays once after landing, then SILWANY stays', async () => {
    const page = await open();
    try {
      await mounted(page);
      const hidden = await watch(page, 3500);
      assert.equal(peak(hidden, 'header'), 0, 'the name showed during the intro');
      assert.equal(peak(hidden, 'suffix'), 0, `the ghost played while the name was hidden (peak ${peak(hidden, 'suffix')})`);
      await enter(page, 'Escape');
      await landed(page);
      const shown = await watch(page, 5000);
      const ghost = shown.filter((x) => x.suffix >= 0.1);
      assert.ok(ghost.length > 0, `no ghost after landing (peak ${peak(shown, 'suffix')})`);
      assert.ok(peak(shown, 'suffix') <= 0.2, `the ghost is a hint, not the full words (peak ${peak(shown, 'suffix')})`);
      assert.ok(ghost.every((x) => x.header >= 0.5), 'the ghost played before the name had faded in');
      const end = shown[shown.length - 1];
      assert.deepEqual([end.last, end.suffix], [1, 0], `after the ghost: ${JSON.stringify(end)}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('new visitor opens a project and comes back: the name changes there and then, as a fade, not only on the next load', async () => {
    const page = await open({ init: [standInPlayer] });
    try {
      await mounted(page);
      await enter(page, 'Escape');
      await landed(page);
      await page.waitForTimeout(4000); // the ghost is over
      await page.locator('.grid-container > *').first().click();
      await until(page, () => JSON.parse(localStorage.getItem('omar_viewed') || '[]').length > 0, 5000);
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await until(page, gridShowing, 5000);
      const back = await watch(page, 4000);
      assert.ok(back[0].last >= 0.9 && back[0].suffix === 0, `it changed before the visitor was back: ${JSON.stringify(back[0])}`);
      const end = back[back.length - 1];
      assert.deepEqual([end.last, end.suffix], [0, 1], `back on the grid the name still reads OMAR SILWANY: ${JSON.stringify(end)}`);
      assert.ok(back.some((x) => x.suffix > 0.05 && x.suffix < 0.95), 'the new words did not fade in');
      assert.ok(back.every((x) => x.header >= 0.5), 'the name itself was hidden during the change');
    } finally {
      await done(page);
    }
  });

  test('a visitor who viewed something before: OMAR, THE CREATIVE from the first moment the name shows', async () => {
    const page = await open({ init: [viewedBefore] });
    try {
      await mounted(page);
      await enter(page, 'Escape');
      await landed(page);
      const shown = await watch(page, 1500);
      assert.ok(shown.every((x) => x.last === 0 && x.suffix === 1), `SILWANY showed: ${JSON.stringify(shown.find((x) => x.last !== 0 || x.suffix !== 1))}`);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('same session, intro already seen, nothing viewed: the ghost plays after load', async () => {
    const page = await open({ seen: true });
    try {
      const shown = await watch(page, 4500);
      assert.ok(peak(shown, 'suffix') >= 0.1 && peak(shown, 'suffix') <= 0.2, `ghost peak ${peak(shown, 'suffix')}`);
      const end = shown[shown.length - 1];
      assert.deepEqual([end.last, end.suffix], [1, 0], `after the ghost: ${JSON.stringify(end)}`);
    } finally {
      await done(page);
    }
  });
});
