// New York and Tokyo in the scene rotation (plan 2026-11-19-new-york-tokyo-scenes.md).
// Run from tests/: `node --test city-scenes.test.mjs`.
// Playwright's Chromium may not decode H.264, so the clip tests assert on requests, not on playback.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { start, stop, open, done, introStart, until, withScene, pinScene, getBrowser, serverUrl, SRC, BLOCKED, NO_CLIP } from './helpers/intro-page.mjs';

before(start);
after(stop);

const CITIES = ['miami-beach', 'new-york', 'tokyo'];
const FOCUS = { 'miami-beach': 0.60, 'new-york': 0.52, tokyo: 0.58 }; // miami-beach: the default, no field
const LAPTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const SCENE_FILES = ['still-1920.jpg', 'still-960.jpg', 'clip-1920.mp4', 'clip-960.mp4', 'minimap-strip.svg'];

const layoutOf = (page, w, h) => page.evaluate(([w, h]) => window.DashIntro.layout(w, h), [w, h]);
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const sizeOf = async (f) => (await fs.stat(path.join(SRC, f))).size;

// State of the windshield at the moment the page stops being dark.
const firstShownStill = () => {
  let sawLoading = false;
  new MutationObserver((_, obs) => {
    const h = document.documentElement;
    if (h.classList.contains('dash-loading')) { sawLoading = true; return; }
    if (!sawLoading) return;
    const still = document.getElementById('dash-still');
    window.__firstStill = {
      ready: still.complete && still.naturalWidth > 0 && !still.hidden,
      src: still.getAttribute('src'),
      rendered: h.classList.contains('dash-rendered'),
    };
    obs.disconnect();
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
};
// A seeded Math.random for one page load (mulberry32), so a run of intros is the same every time.
const seedRandom = (seed) => {
  let a = (seed * 2654435761) >>> 0;
  Math.random = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe('the files', { concurrency: 1 }, () => {
  for (const id of ['new-york', 'tokyo']) {
    test(`${id}: five files under src/assets/dash/scenes/${id}/, served, and tracked by git`, async () => {
      for (const f of SCENE_FILES) {
        const res = await fetch(serverUrl() + `/assets/dash/scenes/${id}/${f}`);
        assert.equal(res.status, 200, f);
        assert.match(res.headers.get('content-type'), /^(image|video)\//, f);
        assert.ok((await res.arrayBuffer()).byteLength > 1000, `${f} is empty`);
      }
      // *.mp4 is git-ignored repo-wide: the clips must be added with -f or the deploy has none.
      const tracked = execFileSync('git', ['ls-files', '-z', `src/assets/dash/scenes/${id}`],
        { cwd: path.join(SRC, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
      assert.deepEqual(tracked.map((f) => path.basename(f)).sort(), [...SCENE_FILES].sort());
    });
  }

  test('the scenes file lists all three, with the focus of each', async () => {
    const page = await open({ seen: true });
    try {
      const scenes = await page.evaluate(() => window.DashScenes.scenes);
      assert.deepEqual(scenes.map((s) => s.id), CITIES);
      const by = Object.fromEntries(scenes.map((s) => [s.id, s]));
      assert.equal(by['miami-beach'].focus, undefined, 'miami-beach needs no focus entry');
      assert.equal(by['new-york'].focus, 0.52);
      assert.equal(by.tokyo.focus, 0.58);
      for (const id of CITIES) {
        const s = by[id];
        const dir = `assets/dash/scenes/${id}/`;
        assert.deepEqual(
          { still: s.still, stillSmall: s.stillSmall, clip: s.clip, clipSmall: s.clipSmall, minimap: s.minimap },
          { still: dir + 'still-1920.jpg', stillSmall: dir + 'still-960.jpg', clip: dir + 'clip-1920.mp4',
            clipSmall: dir + 'clip-960.mp4', minimap: dir + 'minimap-strip.svg' }, id);
      }
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('focus: where the landmark stands in the phone crop', { concurrency: 1 }, () => {
  for (const id of CITIES) {
    test(`${id}: at 390x844 the scene box centres on focus ${FOCUS[id]}, in layout() and in the page`, async () => {
      const page = await open({ viewport: PHONE, routes: [pinScene(id)] });
      try {
        await introStart(page);
        assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), id);
        await until(page, () => document.documentElement.classList.contains('dash-rendered'), 8000);
        const o = await layoutOf(page, 390, 844);
        assert.equal(o.mode, 'tall');
        near(o.sbX, -o.ckX + 390 / 2 - FOCUS[id] * o.sbW, 1e-6, `${id} sbX`);
        // What the page uses is what layout() says.
        const inline = await page.evaluate(() => parseFloat(document.documentElement.style.getPropertyValue('--sb-x')));
        near(inline, o.sbX, 0.01, `${id} --sb-x`);
      } finally {
        await done(page);
      }
    });
  }

  test('the three focus values give three different boxes', async () => {
    const xs = [];
    for (const id of CITIES) {
      const page = await open({ viewport: PHONE, routes: [pinScene(id)] });
      try {
        await introStart(page);
        xs.push((await layoutOf(page, 390, 844)).sbX);
      } finally {
        await done(page);
      }
    }
    assert.equal(new Set(xs.map((x) => x.toFixed(3))).size, 3, xs.join(' '));
  });

  test('a scene without focus gives the sbX it gave before: 0.60', async () => {
    const page = await open({ viewport: PHONE, routes: withScene(NO_CLIP) });
    try {
      await introStart(page);
      const o = await layoutOf(page, 390, 844);
      near(o.sbX, -o.ckX + 390 / 2 - 0.60 * o.sbW, 1e-6, 'sbX');
    } finally {
      await done(page);
    }
  });

  for (const bad of ['left', 1.5, -0.2, null]) {
    test(`a focus of ${JSON.stringify(bad)} is not a fraction of the scene: 0.60, no page errors`, async () => {
      const page = await open({ viewport: PHONE, routes: withScene({ ...NO_CLIP, focus: bad }) });
      try {
        await introStart(page);
        const o = await layoutOf(page, 390, 844);
        near(o.sbX, -o.ckX + 390 / 2 - 0.60 * o.sbW, 1e-6, 'sbX');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }

  for (const id of CITIES) {
    for (const [w, h] of [[1440, 900], [1920, 1080]]) {
      test(`${id}: wide mode at ${w}x${h} ignores focus`, async () => {
        const page = await open({ viewport: { width: w, height: h }, routes: [pinScene(id)] });
        try {
          await introStart(page);
          const o = await layoutOf(page, w, h);
          assert.equal(o.mode, 'wide');
          near(o.sbX, (o.ckW - o.sbW) * 0.62, 1e-6, 'sbX');
          near(o.sbY, (o.shield - o.sbH) * 0.35, 1e-6, 'sbY');
        } finally {
          await done(page);
        }
      });
    }
  }
});

describe('rotation', { concurrency: 1 }, () => {
  test('ten intros in a row on one browser: never the same scene twice running, and all three appear', async () => {
    const context = await getBrowser().newContext({ viewport: LAPTOP });
    await context.route((url) => BLOCKED.some((h) => url.hostname === h || url.hostname.endsWith('.' + h)), (r) => r.abort());
    const shown = [];
    try {
      for (let i = 1; i <= 10; i++) {
        // A new tab is a new session (the intro plays); localStorage, with the last scene, is the browser's.
        const page = await context.newPage();
        await page.addInitScript(seedRandom, i);
        await page.goto(serverUrl() + '/');
        shown.push(await page.getAttribute('#dash-shield', 'data-scene'));
        await page.close();
      }
    } finally {
      await context.close();
    }
    for (let i = 1; i < shown.length; i++) assert.notEqual(shown[i], shown[i - 1], `repeat at intro ${i + 1}: ${shown.join(' ')}`);
    assert.deepEqual([...new Set(shown)].sort(), [...CITIES].sort(), shown.join(' '));
  });
});

for (const id of CITIES) {
  for (const [label, viewport, small] of [['1440x900', LAPTOP, false], ['390x844', PHONE, true]]) {
    const dir = `assets/dash/scenes/${id}/`;
    const size = small ? '960' : '1920';
    const other = small ? '1920' : '960';
    const isClip = (u) => new RegExp(`/${id}/clip-\\d+\\.mp4$`).test(u);

    describe(`${id} at ${label}`, { concurrency: 1 }, () => {
      test(`the still shows on the first lit frame: still-${size}`, async () => {
        const page = await open({ viewport, routes: [pinScene(id)], init: [firstShownStill] });
        try {
          await introStart(page);
          assert.equal(await page.getAttribute('#dash-shield', 'data-scene'), id);
          assert.deepEqual(await page.evaluate(() => window.__firstStill), { ready: true, src: `${dir}still-${size}.jpg`, rendered: true });
          assert.deepEqual(page.errors, []);
        } finally {
          await done(page);
        }
      });

      test(`the clip requested is clip-${size}, and no file of the other size`, async () => {
        const page = await open({ viewport, routes: [pinScene(id)] });
        try {
          await introStart(page);
          const t0 = Date.now();
          while (!page.requested.some(isClip) && Date.now() - t0 < 5000) await page.waitForTimeout(50);
          const clips = page.requested.filter(isClip);
          assert.ok(clips.length > 0, 'no clip requested');
          for (const u of clips) assert.match(u, new RegExp(`/clip-${size}\\.mp4$`));
          const wrong = page.requested.filter((u) => new RegExp(`/${id}/(still|clip)-${other}\\.`).test(u));
          assert.deepEqual(wrong, []);
          if (small) assert.deepEqual(page.requested.filter((u) => /1920|2560|3840/.test(new URL(u).pathname)), [], 'a large file on a phone');
        } finally {
          await done(page);
        }
      });

      test('the minimap strip is the scene file, loaded, with the arrow', async () => {
        const page = await open({ viewport, routes: [pinScene(id)] });
        try {
          await introStart(page);
          assert.match(await page.getAttribute('.dash-minimap img.dash-minimap-strip', 'src'), new RegExp(`${id}/minimap-strip\\.svg$`));
          assert.equal(await page.locator('.dash-minimap img').count(), 2);
          assert.ok(await page.evaluate(() => [...document.querySelectorAll('.dash-minimap img')].every((i) => i.naturalWidth > 0)));
          assert.equal(await page.locator('.dash-minimap svg').count(), 0);
          assert.deepEqual(page.errors, []);
        } finally {
          await done(page);
        }
      });
    });
  }

  describe(`${id}: first-load weight and a skipped intro`, { concurrency: 1 }, () => {
    // Limits in decimal bytes. Cockpit, still and the doll's two pieces.
    test('laptop <= 700,000 bytes, phone <= 400,000 bytes', async (t) => {
      const dash = 'assets/dash/';
      const dir = `${dash}scenes/${id}/`;
      const doll = (await sizeOf(dash + 'doll-top.webp')) + (await sizeOf(dash + 'doll-base.webp'));
      const laptop = (await sizeOf(dash + 'cockpit-wide-2560.webp')) + (await sizeOf(dir + 'still-1920.jpg')) + doll;
      const phone = (await sizeOf(dash + 'cockpit-phone-1620.webp')) + (await sizeOf(dir + 'still-960.jpg')) + doll;
      t.diagnostic(`${id}: laptop ${laptop} bytes, phone ${phone} bytes`);
      assert.ok(laptop <= 700_000, `laptop ${laptop} bytes`);
      assert.ok(phone <= 400_000, `phone ${phone} bytes`);
    });

    for (const [label, opts] of [['?p=0', { path: '/?p=0' }], ['reduced motion', { reduced: true }]]) {
      test(`intro skipped (${label}): no clip requested`, async () => {
        const page = await open({ ...opts, routes: [pinScene(id)] });
        try {
          await until(page, () => document.body.classList.contains('grid-active') || document.body.classList.contains('project-view'), 8000);
          await page.waitForTimeout(1500);
          assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played');
          assert.deepEqual(page.requested.filter((u) => /\/clip-\d+\./.test(u)), []);
          assert.equal(await page.getAttribute('#dash-clip', 'src'), null);
        } finally {
          await done(page);
        }
      });
    }
  });
}
