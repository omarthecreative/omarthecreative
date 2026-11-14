// The intro waits for the visitor (plan 2026-11-14-rendered-cockpit-review-2, part A, section 1).
// No timer: the dashboard stays until the visitor clicks, taps, scrolls, swipes or presses
// one of the start keys (ruling R3). Run from tests/: `node --test intro-input.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  start, stop, serverUrl, open, done, until, introStart, mounted, landed, css, rect,
  countPushIns, pushCounts, enter, START_EVENT,
} from './helpers/intro-page.mjs';

before(start);
after(stop);

// Wide rendered cockpit, the drawn fallback (cockpit pictures 404), and a phone.
const MODES = [
  ['rendered wide 1440x900', { viewport: { width: 1440, height: 900 } }],
  ['drawn 1440x900', { viewport: { width: 1440, height: 900 }, drawn: true }],
];
const PHONE = ['phone 390x844', { viewport: { width: 390, height: 844 }, touch: true }];

// Every keydown as it reaches window (after the document's listeners): key and defaultPrevented.
const KEYLOG = () => {
  window.__keys = [];
  window.addEventListener('keydown', (e) => window.__keys.push({ key: e.key, prevented: e.defaultPrevented }));
};

const STARTERS = ['click-screen', 'click-intro', 'wheel', 'swipe', 'Escape', 'Enter', 'Space',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageDown', 'Shift+Space'];
const NON_STARTERS = ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'a', 'Meta+ArrowLeft', 'Control+Enter'];
const isKey = (how) => !(how in START_EVENT);

async function assertStillWaiting(page, label = '') {
  const s = await page.evaluate(() => ({
    intro: document.body.classList.contains('intro-active'),
    mounted: document.documentElement.classList.contains('dash-intro'),
    pushing: document.documentElement.classList.contains('dash-pushing'),
    pushStart: 'pushStart' in window.__marks,
  }));
  assert.deepEqual(s, { intro: true, mounted: true, pushing: false, pushStart: false }, `${label}${JSON.stringify(s)}`);
}
async function assertLanded(page) {
  const s = await page.evaluate(() => ({
    intro: document.body.classList.contains('intro-active'),
    html: /dash-intro|dash-pushing/.test(document.documentElement.className),
    splash: getComputedStyle(document.getElementById('standoff-splash')).display,
  }));
  assert.deepEqual(s, { intro: false, html: false, splash: 'none' }, JSON.stringify(s));
}

describe('waits for the visitor', { concurrency: 1 }, () => {
  for (const [label, opts] of [...MODES, PHONE]) {
    test(`${label}: no push-in after 12 seconds with no input, no countdown on the page`, async () => {
      const page = await open(opts);
      try {
        await mounted(page);
        await countPushIns(page);
        await until(page, () => performance.now() - window.__marks.introStart > 12000, 15000);
        await assertStillWaiting(page, '12s: ');
        assert.equal((await pushCounts(page)).pushIns, 0);
        assert.equal(await page.locator('#intro-timer').count(), 0, '#intro-timer still in the page');
        assert.equal(await page.evaluate(() => /DISPATCH IN/.test(document.body.textContent)), false);
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('each listed input starts the push-in, once', { concurrency: 1 }, () => {
  for (const [label, opts] of MODES) {
    for (const how of STARTERS) {
      test(`${label}: ${how} starts it`, async () => {
        const page = await open({ ...opts, touch: how === 'swipe', init: [KEYLOG] });
        try {
          await mounted(page);
          await countPushIns(page);
          await enter(page, how);
          await landed(page);
          const c = await pushCounts(page);
          assert.equal(c.pushIns, 1, JSON.stringify(c));
          assert.deepEqual(c.by, [isKey(how) ? 'keydown' : START_EVENT[how]], JSON.stringify(c));
          assert.equal(c.landings, 1, JSON.stringify(c));
          if (isKey(how)) {
            const keys = await page.evaluate(() => window.__keys);
            const last = keys[keys.length - 1];
            assert.equal(last.prevented, true, `accepted key not prevented: ${JSON.stringify(keys)}`);
          }
          await assertLanded(page);
          assert.ok(!/\?p=|project/.test(page.url()), page.url());
          // The landing is the screenful the visitor saw: the input did not also scroll the grid
          // (a smooth scroll would still be running, so wait for one to show).
          await page.waitForTimeout(300);
          assert.equal(await page.evaluate(() => document.getElementById('grid-scroll-container').scrollTop), 0,
            'the grid scrolled under the push-in');
          assert.deepEqual(page.errors, []);
        } finally {
          await done(page);
        }
      });
    }
  }

  for (const [label, opts] of [PHONE]) {
    for (const how of ['tap', 'swipe']) {
      test(`${label}: ${how} starts it`, async () => {
        const page = await open(opts);
        try {
          await mounted(page);
          await countPushIns(page);
          await enter(page, how);
          await landed(page);
          const c = await pushCounts(page);
          assert.deepEqual(c, { pushIns: 1, by: [START_EVENT[how]], landings: 1 });
          await assertLanded(page);
          assert.deepEqual(page.errors, []);
        } finally {
          await done(page);
        }
      });
    }
  }

  test('rendered wide: after landing, ArrowDown scrolls the grid again', async () => {
    const page = await open();
    try {
      await mounted(page);
      await enter(page, 'Escape');
      await landed(page);
      await enter(page, 'ArrowDown');
      await until(page, () => document.getElementById('grid-scroll-container').scrollTop > 0, 2000);
    } finally {
      await done(page);
    }
  });

  for (const [label, opts] of MODES) {
    test(`${label}: two inputs in a row run pushIn once and land once`, async () => {
      const page = await open(opts);
      try {
        await mounted(page);
        await countPushIns(page);
        // Two in the same task, then more while the push-in runs.
        await page.evaluate(() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          document.getElementById('dash-screen').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        await enter(page, 'Enter');
        await enter(page, 'click-screen');
        await enter(page, 'wheel');
        await landed(page);
        await page.waitForTimeout(400);
        const c = await pushCounts(page);
        assert.equal(c.pushIns, 1, JSON.stringify(c));
        assert.equal(c.landings, 1, JSON.stringify(c));
        await assertLanded(page);
      } finally {
        await done(page);
      }
    });
  }
});

describe('these do not start it', { concurrency: 1 }, () => {
  for (const [label, opts] of MODES) {
    for (const how of NON_STARTERS) {
      test(`${label}: ${how} does nothing`, async () => {
        const page = await open({ ...opts, init: [KEYLOG] });
        try {
          await mounted(page);
          await countPushIns(page);
          await enter(page, how);
          await page.waitForTimeout(500);
          await assertStillWaiting(page);
          assert.equal((await pushCounts(page)).pushIns, 0);
          // Left to the browser: not prevented.
          const keys = await page.evaluate(() => window.__keys);
          assert.ok(keys.length >= 1, 'no keydown seen');
          assert.ok(keys.every((k) => !k.prevented), `prevented: ${JSON.stringify(keys)}`);
          // The intro still listens.
          await enter(page, 'Escape');
          await landed(page);
          assert.equal((await pushCounts(page)).pushIns, 1);
        } finally {
          await done(page);
        }
      });
    }
  }
});

describe('Wire Omar', { concurrency: 1 }, () => {
  // Marks a push-in in sessionStorage, which outlives the navigation to about.html.
  const PUSH_SEEN = () => {
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('dash-pushing')) sessionStorage.setItem('__test_pushed', '1');
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  };
  const pushed = (page) => page.evaluate(() => sessionStorage.getItem('__test_pushed'));

  for (const [label, opts] of [...MODES, PHONE]) {
    test(`${label}: a ${opts.touch ? 'tap' : 'click'} on Wire Omar navigates to about.html, no push-in`, async () => {
      const page = await open({ ...opts, init: [PUSH_SEEN] });
      try {
        await mounted(page);
        if (opts.touch) await page.tap('#dash-wire'); else await page.click('#dash-wire');
        await page.waitForURL(/about\.html$/, { timeout: 5000 });
        assert.equal(await pushed(page), null, 'the push-in started');
      } finally {
        await done(page);
      }
    });
  }

  for (const [label, opts] of MODES) {
    test(`${label}: Enter on Wire Omar navigates to about.html, no push-in`, async () => {
      const page = await open({ ...opts, init: [PUSH_SEEN] });
      try {
        await mounted(page);
        await page.focus('#dash-wire');
        await page.keyboard.press('Enter');
        await page.waitForURL(/about\.html$/, { timeout: 5000 });
        assert.equal(await pushed(page), null, 'the push-in started');
      } finally {
        await done(page);
      }
    });
  }

  // A link does nothing with Space or the arrows, so with Wire Omar focused they start the push-in.
  for (const key of ['Space', 'ArrowDown']) {
    test(`rendered wide: ${key} with Wire Omar focused starts the push-in, stays on the page`, async () => {
      const page = await open();
      try {
        await mounted(page);
        await countPushIns(page);
        await page.focus('#dash-wire');
        await page.keyboard.press(key);
        await landed(page);
        assert.equal((await pushCounts(page)).pushIns, 1);
        assert.ok(!/about\.html/.test(page.url()), page.url());
      } finally {
        await done(page);
      }
    });
  }
});

describe('a hint for assistive technology', { concurrency: 1 }, () => {
  const HINT = 'Press Enter, or click, to open the site.';
  for (const [label, opts] of [...MODES, PHONE]) {
    test(`${label}: a visually hidden line says how to enter, right after the heading; gone after landing`, async () => {
      const page = await open(opts);
      try {
        await mounted(page);
        const s = await page.evaluate(() => {
          const p = document.querySelector('#standoff-splash > h1.dash-headline + p.dash-hint');
          if (!p) return null;
          const r = p.getBoundingClientRect();
          const c = getComputedStyle(p);
          return { text: p.textContent, w: r.width, h: r.height, display: c.display, clip: c.clipPath, overflow: c.overflow };
        });
        assert.ok(s, 'no p.dash-hint right after the heading');
        assert.equal(s.text, HINT);
        assert.ok(s.w <= 1 && s.h <= 1, `not clipped to 1px: ${JSON.stringify(s)}`);
        assert.equal(s.clip, 'inset(50%)');
        assert.notEqual(s.display, 'none');
        assert.ok((await page.locator('#standoff-splash').ariaSnapshot()).includes(HINT), 'not in the accessibility tree');
        await enter(page, 'Escape');
        await landed(page);
        assert.ok(!(await page.locator('body').ariaSnapshot()).includes(HINT), 'still in the accessibility tree after landing');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('screen hover', { concurrency: 1 }, () => {
  const GREY = 'rgb(94, 99, 107)';   // #5E636B
  const LIGHT = 'rgb(201, 205, 211)'; // #C9CDD3
  for (const [label, opts] of [...MODES, ['phone 390x844', { viewport: { width: 390, height: 844 } }]]) {
    test(`${label}: pointer cursor, the grey line brightens to #C9CDD3 over 150ms, nothing else changes`, async () => {
      const page = await open(opts);
      try {
        await mounted(page);
        await page.mouse.move(2, 2);
        await page.waitForTimeout(300);
        assert.equal(await css(page, '#dash-screen', 'cursor'), 'pointer');
        assert.equal(await css(page, '#dash-screen', 'transitionProperty'), 'box-shadow');
        assert.equal(await css(page, '#dash-screen', 'transitionDuration'), '0.15s');
        const before = await css(page, '#dash-screen', 'boxShadow');
        assert.ok(before.includes(GREY), before);
        const r = await rect(page, '#dash-screen');
        await page.mouse.move(r.left + r.width / 2, r.top + r.height / 2);
        await page.waitForTimeout(300);
        const after = await css(page, '#dash-screen', 'boxShadow');
        // Only the grey line changes: the black ring and the drop shadow stay as they were.
        assert.equal(after, before.replace(GREY, LIGHT), `before ${before} / after ${after}`);
        // No hover effect once the push-in starts.
        await enter(page, 'Escape');
        await until(page, () => document.documentElement.classList.contains('dash-pushing'), 2000);
        await until(page, () => performance.now() - window.__marks.pushStart > 300, 2000);
        const pushing = await page.evaluate(() => {
          const s = getComputedStyle(document.getElementById('dash-screen'));
          return { on: document.documentElement.classList.contains('dash-pushing'), shadow: s.boxShadow, cursor: s.cursor };
        });
        assert.equal(pushing.on, true, 'push-in already over: nothing to check');
        assert.equal(pushing.shadow, before, `while pushing: ${pushing.shadow}`);
        assert.notEqual(pushing.cursor, 'pointer');
        assert.deepEqual(page.errors, []);
      } finally {
        await done(page);
      }
    });
  }
});

describe('the skips still skip, with no input', { concurrency: 1 }, () => {
  for (const [label, opts] of [['reduced motion', { reduced: true }], ['?p=0', { path: '/?p=0' }], ['?filter=films', { path: '/?filter=films' }]]) {
    test(`${label}: no intro`, async () => {
      const page = await open(opts);
      try {
        await until(page, () => document.body.classList.contains('grid-active') || document.body.classList.contains('project-view'), 8000);
        await page.waitForTimeout(800);
        assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played');
        assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dash-intro')), false);
      } finally {
        await done(page);
      }
    });
  }

  test('second visit in the same session: no intro', async () => {
    const page = await open();
    try {
      await mounted(page);
      await enter(page, 'Escape');
      await landed(page);
      await page.goto(serverUrl() + '/');
      await until(page, () => document.body.classList.contains('grid-active'), 8000);
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => 'introStart' in window.__marks), false, 'intro played again');
      assert.equal(await css(page, '#standoff-splash', 'display'), 'none');
    } finally {
      await done(page);
    }
  });
});
