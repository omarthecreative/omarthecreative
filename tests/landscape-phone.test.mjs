// A phone in landscape shows the rendered wide cockpit.
// - layout(): the tall cockpit only when w <= 760 and h > w; every other window takes the wide path.
// - Rotation: when a resize changes the mode to one whose cockpit picture is not loaded, it is
//   loaded then, and the dashboard switches when it arrives. The doll's pieces too. The rule that
//   ignores a late picture stays for the first load.
// - The phone rules (max-width: 760px) are for portrait: none of them applies to a short
//   landscape window.
// Run from tests/: `node --test landscape-phone.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { start, stop, open, done, until, mounted, landed, rect, css, enter, frameFitsGrid, dashMode } from './helpers/intro-page.mjs';

before(start);
after(stop);

const layoutOf = (page, w, h) => page.evaluate(([w, h]) => window.DashIntro.layout(w, h), [w, h]);
const cockpitFiles = (page) => page.requested.filter((u) => /\/cockpit-/.test(u)).map((u) => u.split('/').pop());
const dollFiles = (page) => page.requested.filter((u) => /\/doll-(top|base)\./.test(u)).map((u) => u.split('/').pop()).sort();

async function resize(page, w, h) {
  await page.setViewportSize({ width: w, height: h });
  page.vw = w;
  page.vh = h;
}
// The dashboard for this window is up: the mode, and the layout variables of this window's size.
async function untilMode(page, mode, timeout = 4000) {
  await until(page, (mode) => {
    const h = document.documentElement;
    const now = h.classList.contains('dash-rendered') ? h.getAttribute('data-dash-mode') : 'drawn';
    if (now !== mode) return false;
    if (mode === 'drawn') return true;
    const o = window.DashIntro.layout(window.innerWidth, window.innerHeight);
    return Math.abs(parseFloat(h.style.getPropertyValue('--ck-w')) - o.ckW) < 0.01;
  }, timeout, mode);
}
const FILE = { wide: 'cockpit-wide-2560.webp', tall: 'cockpit-tall-1080.webp' };
const DOLL = { wide: { h: 0.18, cx: 0.43, feet: 0.42 }, tall: { h: 0.14, cx: 0.20, feet: 0.31 } };

// Rendered in `mode`: the right picture is in the cockpit, in the box layout() gives; the screen
// is where layout() puts it; frame and grid coincide; the rendered doll stands on the picture.
async function assertCockpit(page, mode, label) {
  assert.equal(await dashMode(page), mode, `${label}: mode`);
  const o = await layoutOf(page, page.vw, page.vh);
  assert.equal(o.mode, mode, `${label}: layout() mode`);
  const img = await page.evaluate(() => {
    const i = document.getElementById('dash-cockpit-img');
    const r = i.getBoundingClientRect();
    return { file: (i.currentSrc || '').split('/').pop(), ok: i.complete && i.naturalWidth > 0, left: r.left, top: r.top, width: r.width, height: r.height };
  });
  assert.equal(img.file, FILE[mode], `${label}: cockpit picture`);
  assert.ok(img.ok, `${label}: cockpit picture not decoded`);
  for (const [k, want] of [['left', o.ckX], ['top', 0], ['width', o.ckW], ['height', o.ckH]]) {
    assert.ok(Math.abs(img[k] - want) <= 1, `${label}: picture ${k} ${img[k]} vs ${want}`);
  }
  const s = await rect(page, '#dash-screen');
  for (const [k, want] of [['left', o.left], ['top', o.top], ['width', o.k * page.vw], ['height', o.k * page.vh]]) {
    assert.ok(Math.abs(s[k] - want) <= 1, `${label}: screen ${k} ${s[k]} vs ${want}`);
  }
  await frameFitsGrid(page, `${label}: `);
  const d = await page.evaluate(() => {
    const el = document.querySelector('.dash-doll');
    const keep = el.style.animation;
    el.style.animation = 'none';
    const r = el.getBoundingClientRect();
    el.style.animation = keep;
    return { rendered: el.classList.contains('dash-doll-rendered'), bottom: r.bottom, height: r.height, cx: r.left + r.width / 2 };
  });
  const k = DOLL[mode];
  assert.equal(d.rendered, true, `${label}: rendered doll`);
  assert.ok(Math.abs(d.height - k.h * o.ckH) <= 2, `${label}: doll height ${d.height} vs ${k.h * o.ckH}`);
  assert.ok(Math.abs(d.bottom - k.feet * o.ckH) <= 2, `${label}: doll feet ${d.bottom} vs ${k.feet * o.ckH}`);
  assert.ok(Math.abs(d.cx - (o.ckX + k.cx * o.ckW)) <= 2, `${label}: doll centre ${d.cx} vs ${o.ckX + k.cx * o.ckW}`);
}

describe('layout(): tall only when w <= 760 and h > w', () => {
  test('landscape phones take the wide path and clear the k floor; portrait phones stay tall', async (t) => {
    const page = await open({ seen: true });
    try {
      await until(page, () => !!window.DashIntro, 8000);
      // [w, h, mode, k]
      const cases = [
        [844, 390, 'wide', 0.4263], [844, 340, 'wide', 0.3692], [812, 320, 'wide', 0.3600], [667, 320, 'wide', 0.4383],
        [740, 360, 'wide', 0.4472], [932, 430, 'wide', 0.4274], [700, 500, 'wide', 0.3956],
        [390, 844, 'tall', 0.5784], [412, 732, 'tall', 0.4716], [760, 1400, 'tall', 0.5010],
        [600, 600, 'none'], [761, 1400, 'none'],
        // Real phones on their side: the page has viewport-fit=cover, so the window is the full
        // width, and the browser's bars leave 290 to 360 px of height. Under 500 px tall the k
        // floor is 0.25.
        [852, 343, 'wide', 0.3691], [852, 310, 'wide', 0.3318], [844, 307, 'wide', 0.3315], [874, 319, 'wide', 0.3334],
        [932, 347, 'wide', 0.3416], [956, 357, 'wide', 0.3431], [812, 292, 'wide', 0.3268], [915, 356, 'wide', 0.3574],
        [800, 304, 'wide', 0.3462], [932, 300, 'wide', 0.2930], [1400, 499, 'wide', 0.3320],
        // Still too flat, or 500 px tall and up with k under 0.36: the drawn dashboard.
        [1600, 400, 'none'], [1400, 500, 'none'],
      ];
      for (const [w, h, mode, k] of cases) {
        const o = await layoutOf(page, w, h);
        assert.equal(o.mode, mode, `${w}x${h} mode`);
        if (mode === 'none') continue;
        t.diagnostic(`${w}x${h}: ${o.mode}, k ${o.k.toFixed(4)}`);
        assert.ok(Math.abs(o.k - k) <= 0.0006, `${w}x${h} k ${o.k} vs ${k}`);
        if (mode === 'wide') assert.ok(o.k >= (h < 500 ? 0.25 : 0.36), `${w}x${h} under the k floor: ${o.k}`);
        assert.ok(o.top >= o.shield, `${w}x${h} screen top above the windshield's foot`);
        // frameH: the screen's height before the push-in (k * h in wide mode, short in portrait).
        assert.ok(o.left + o.k * w <= w && o.top + o.frameH <= h, `${w}x${h} screen outside the window`);
      }
    } finally {
      await done(page);
    }
  });
});

describe('load in landscape', { concurrency: 1 }, () => {
  for (const [w, h] of [[844, 390], [844, 340], [812, 320], [667, 320], [852, 310], [932, 300]]) {
    test(`load at ${w}x${h}: the rendered wide cockpit, frame and grid coincide`, async () => {
      const page = await open({ viewport: { width: w, height: h } });
      try {
        await mounted(page);
        await assertCockpit(page, 'wide', `${w}x${h}`);
        assert.deepEqual(cockpitFiles(page), [FILE.wide]);
        await enter(page, 'Escape');
        await landed(page);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('rotation', { concurrency: 1 }, () => {
  test('load at 390x844, turn to 844x390: the wide cockpit loads then and takes over; back: tall again', async () => {
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await assertCockpit(page, 'tall', 'load 390x844');
      assert.deepEqual(cockpitFiles(page), [FILE.tall]);
      await resize(page, 844, 390);
      await untilMode(page, 'wide');
      await assertCockpit(page, 'wide', 'turned to 844x390');
      await resize(page, 390, 844);
      await untilMode(page, 'tall', 1000);
      await assertCockpit(page, 'tall', 'back at 390x844');
      await resize(page, 844, 390);
      await untilMode(page, 'wide', 1000);
      await assertCockpit(page, 'wide', 'at 844x390 again');
      // Each picture asked for once.
      assert.deepEqual(cockpitFiles(page), [FILE.tall, FILE.wide]);
      await enter(page, 'Escape');
      await landed(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('load at 393x659 (phone upright, bars showing), turn to 852x310: the wide cockpit takes over; back: tall again', async () => {
    const page = await open({ viewport: { width: 393, height: 659 } });
    try {
      await mounted(page);
      await assertCockpit(page, 'tall', 'load 393x659');
      await resize(page, 852, 310);
      await untilMode(page, 'wide');
      await assertCockpit(page, 'wide', 'turned to 852x310');
      await resize(page, 393, 659);
      await untilMode(page, 'tall', 1000);
      await assertCockpit(page, 'tall', 'back at 393x659');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('load at 844x390, turn to 390x844: the tall cockpit loads then and takes over; back: wide again', async () => {
    const page = await open({ viewport: { width: 844, height: 390 } });
    try {
      await mounted(page);
      await assertCockpit(page, 'wide', 'load 844x390');
      await resize(page, 390, 844);
      await untilMode(page, 'tall');
      await assertCockpit(page, 'tall', 'turned to 390x844');
      await resize(page, 844, 390);
      await untilMode(page, 'wide', 1000);
      await assertCockpit(page, 'wide', 'back at 844x390');
      assert.deepEqual(cockpitFiles(page), [FILE.wide, FILE.tall]);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('a cockpit picture that is late at first load is still ignored; a turn loads the other one, and a turn back loads it again', async () => {
    const slow = ['**/assets/dash/cockpit-tall-*', (r) => setTimeout(() => r.continue().catch(() => {}), 2500)];
    const page = await open({ viewport: { width: 390, height: 844 }, routes: [slow] });
    try {
      await mounted(page);
      // Past the picture's arrival: still the drawn dashboard.
      await page.waitForTimeout(3200);
      assert.equal(await dashMode(page), 'drawn', 'a late first-load picture swapped in');
      await frameFitsGrid(page, 'drawn 390x844: ');
      await resize(page, 844, 390);
      await untilMode(page, 'wide');
      await assertCockpit(page, 'wide', 'turned to 844x390');
      await resize(page, 390, 844);
      await untilMode(page, 'tall', 6000);
      await assertCockpit(page, 'tall', 'back at 390x844');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('load at a size the cockpit does not fit (1000x900), widen to 1440x900: cockpit and doll load then', async () => {
    const page = await open({ viewport: { width: 1000, height: 900 } });
    try {
      await mounted(page);
      assert.equal(await dashMode(page), 'drawn');
      assert.deepEqual(cockpitFiles(page), []);
      assert.deepEqual(dollFiles(page), []);
      await resize(page, 1440, 900);
      await untilMode(page, 'wide');
      await until(page, () => document.querySelector('.dash-doll').classList.contains('dash-doll-rendered'), 4000);
      await assertCockpit(page, 'wide', 'widened to 1440x900');
      assert.deepEqual(cockpitFiles(page), [FILE.wide]);
      assert.deepEqual(dollFiles(page), ['doll-base.webp', 'doll-top.webp']);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('a turn whose picture fails (404): the drawn dashboard stays, frame and grid coincide, no page error', async () => {
    const gone = ['**/assets/dash/cockpit-wide-*', (r) => r.fulfill({ status: 404, body: 'not found' })];
    const page = await open({ viewport: { width: 390, height: 844 }, routes: [gone] });
    try {
      await mounted(page);
      await resize(page, 844, 390);
      await page.waitForTimeout(1200);
      assert.equal(await dashMode(page), 'drawn');
      await frameFitsGrid(page, 'drawn 844x390: ');
      await resize(page, 390, 844);
      await untilMode(page, 'tall', 1000);
      await assertCockpit(page, 'tall', 'back at 390x844');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('no picture is asked for on a turn when the intro is skipped, or after landing', async () => {
    const seen = await open({ viewport: { width: 390, height: 844 }, seen: true });
    try {
      await until(seen, () => document.body.classList.contains('grid-active'), 8000);
      await resize(seen, 844, 390);
      await seen.waitForTimeout(800);
      assert.deepEqual(cockpitFiles(seen), []);
      assert.deepEqual(dollFiles(seen), []);
    } finally {
      await done(seen);
    }
    const page = await open({ viewport: { width: 390, height: 844 } });
    try {
      await mounted(page);
      await enter(page, 'Escape');
      await landed(page);
      await resize(page, 844, 390);
      await page.waitForTimeout(800);
      assert.deepEqual(cockpitFiles(page), [FILE.tall]);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});

describe('667x320: no phone rule applies in the wide cockpit', { concurrency: 1 }, () => {
  test('knight button, doll, minimap and screen bezel are the wide ones', async () => {
    const page = await open({ viewport: { width: 667, height: 320 } });
    try {
      await mounted(page);
      await assertCockpit(page, 'wide', '667x320'); // the doll: rendered, wide constants
      const o = await layoutOf(page, 667, 320);
      const fit = Math.min(667 / 1440, 320 / 900);
      const ss = o.shield / 400;
      const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} vs ${want}`);

      // Knight button: 0.0333 of the picture's width, centred on (0.428, 0.674); no words, no ring.
      const wire = await rect(page, '#dash-wire');
      near(wire.width, 0.0333 * o.ckW, 0.5, 'button width');
      near(wire.height, 0.0333 * o.ckW, 0.5, 'button height');
      near(wire.left + wire.width / 2, o.ckX + 0.428 * o.ckW, 1, 'button centre x');
      near(wire.top + wire.height / 2, 0.674 * o.ckH, 1, 'button centre y');
      assert.equal(await css(page, '#dash-wire span', 'display'), 'none', 'the words show');
      assert.equal(await css(page, '#dash-wire', 'boxShadow'), 'none');
      near((await rect(page, '#dash-wire svg')).height, 0.46 * wire.height, 0.5, 'knight height');

      // Minimap: the laptop's sizes on the windshield scale, 7% of the picture in from its right edge.
      const map = await rect(page, '.dash-minimap');
      near(map.width, 96 * ss, 0.5, 'minimap width');
      near(map.height, 96 * ss, 0.5, 'minimap height');
      near(map.top, 44 * ss, 0.5, 'minimap top');
      near(map.right, o.ckX + o.ckW - o.cropR - 0.07 * o.ckW, 1, 'minimap right edge');
      near(parseFloat(await css(page, '.dash-minimap', 'borderTopWidth')), 4 * ss, 0.5, 'minimap border');
      near(parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dash-ss'))), ss, 0.005, '--dash-ss');

      // Bezel: the laptop's three shadows, scaled by the window's fit (the phone's are 6, 7 and 16/32/7 px).
      const shadow = (await css(page, '#dash-screen', 'boxShadow')).split(/,\s*(?=rgb)/).map((s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat));
      assert.equal(shadow.length, 3, 'three shadows');
      near(shadow[0][3], 10 * fit, 0.2, 'black ring');
      near(shadow[1][3], 11 * fit, 0.2, 'grey line');
      near(shadow[2][1], 24 * fit, 0.2, 'drop shadow offset');
      near(shadow[2][2], 48 * fit, 0.2, 'drop shadow blur');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('drawn fallback at 667x320 (cockpit pictures blocked): the laptop\'s drawn dashboard, frame and grid coincide', async () => {
    const page = await open({ viewport: { width: 667, height: 320 }, drawn: true });
    try {
      await mounted(page);
      assert.equal(await dashMode(page), 'drawn');
      assert.equal(await css(page, '.dash-furniture', 'display'), 'block', 'phone rule hides the furniture');
      await frameFitsGrid(page, 'drawn 667x320: ');
      const s = await rect(page, '#dash-screen');
      assert.ok(s.left >= 0 && s.top >= 0 && s.right <= 667 && s.bottom <= 320, `screen outside the window: ${JSON.stringify(s)}`);
      await enter(page, 'Escape');
      await landed(page);
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });

  test('portrait phone 390x844, drawn fallback: the phone rules still apply', async () => {
    const page = await open({ viewport: { width: 390, height: 844 }, drawn: true });
    try {
      await mounted(page);
      assert.equal(await dashMode(page), 'drawn');
      assert.equal(await css(page, '.dash-furniture', 'display'), 'none');
      const shadow = (await css(page, '#dash-screen', 'boxShadow')).split(/,\s*(?=rgb)/).map((s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat));
      assert.equal(shadow[1][3], 7, 'phone bezel line');
      await frameFitsGrid(page, 'drawn 390x844: ');
      assert.deepEqual(page.errors, []);
    } finally {
      await done(page);
    }
  });
});
