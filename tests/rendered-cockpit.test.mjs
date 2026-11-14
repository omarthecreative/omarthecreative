// Rendered cockpit tests (spec 2026-11-13-rendered-cockpit-design.md). Run from tests/: `node --test rendered-cockpit.test.mjs`.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { startServer } from './serve.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src');
const FIXTURES = path.join(HERE, 'fixtures');

let server;
let browser;

before(async () => {
  server = await startServer(SRC);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  await server?.close();
});

describe('assets', () => {
  test('every Spec 3 asset is served with a media type', async () => {
    const files = ['assets/dash/cockpit-wide-2560.webp', 'assets/dash/cockpit-wide-3840.webp', 'assets/dash/cockpit-tall-1080.webp',
      'assets/dash/doll-top.webp', 'assets/dash/doll-base.webp',
      ...['still-1920.jpg', 'still-960.jpg', 'clip-1920.mp4', 'clip-960.mp4', 'fg-1920.webp', 'fg-960.webp',
          'fgclip-1920.webm', 'fgclip-960.webm', 'fgclip-1920.mov', 'fgclip-960.mov'].map((f) => 'assets/dash/scenes/miami-beach/' + f)];
    for (const f of files) {
      const res = await fetch(server.url + '/' + f);
      assert.equal(res.status, 200, f);
      assert.match(res.headers.get('content-type'), /^(image|video)\//, f);
    }
  });
});

describe('layout', () => {
  const cases = [
    [1440, 900,  { mode: 'wide', k: 0.48,   left: 712,    top: 387,    shield: 370.8, ckX: 0,   ckW: 1600,    cropR: 160 }],
    [1920, 1080, { mode: 'wide', k: 0.48,   left: 940.8,  top: 464.4,  shield: 445,   ckX: 0,   ckW: 1920,    cropR: 0 }],
    [1024, 768,  { mode: 'wide', k: 0.391,  left: 607.6,  top: 330.2,  shield: 316.4, ckX: 0,   ckW: 1365.3,  cropR: 341.3 }],
    [2560, 1080, { mode: 'wide', k: 0.41,   left: 1174.4, top: 464.4,  shield: 445,   ckX: 320, ckW: 1920,    cropR: 0 }],
    [1280, 500,  { mode: 'wide', k: 0.373,  left: 591.1,  top: 215,    shield: 206,   ckX: 195.6, ckW: 888.9, cropR: 0 }],
    [1280, 1024, { mode: 'none' }],
    [768, 1024,  { mode: 'none' }],
    [390, 844,   { mode: 'tall', k: 0.62,   left: 74.1,   top: 270.1,  shield: 190.7, ckX: 0,   ckW: 390,     cropR: 0 }],
    [412, 732,   { mode: 'tall', k: 0.62,   left: 78.3,   top: 234.2,  shield: 201.4, ckX: 0,   ckW: 412,     cropR: 0 }],
    [740, 360,   { mode: 'none' }],
  ];

  test('layout(w, h) matches the table and holds its invariants', async () => {
    const page = await browser.newPage();
    try {
      await page.goto(server.url + '/');
      await page.waitForFunction(() => window.DashIntro);
      const results = await page.evaluate((cs) => cs.map(([w, h]) => window.DashIntro.layout(w, h)), cases);
      cases.forEach(([w, h, want], i) => {
        const got = results[i];
        const name = `${w}x${h}`;
        assert.equal(got.mode, want.mode, `${name} mode`);
        if (want.mode === 'none') return;
        for (const key of ['left', 'top', 'shield', 'ckX', 'ckW', 'cropR']) {
          assert.ok(Math.abs(got[key] - want[key]) <= 0.6, `${name} ${key}: got ${got[key]}, want ${want[key]}`);
        }
        assert.ok(Math.abs(got.k - want.k) <= 0.002, `${name} k: got ${got.k}, want ${want.k}`);
        assert.ok(got.top >= got.shield, `${name} top below windshield edge`);
        assert.ok(got.left + got.k * w <= w, `${name} screen inside the width`);
        assert.ok(got.top + got.k * h <= h, `${name} screen inside the height`);
        assert.ok(got.sbX <= 0 && got.sbY <= 0, `${name} scene box starts at or before the view`);
        assert.ok(got.sbX + got.sbW >= got.ckW - 0.5, `${name} scene box covers the view width`);
        assert.ok(got.sbY + got.sbH >= got.shield - 0.5, `${name} scene box covers the view height`);
      });
    } finally {
      await page.close();
    }
  });
});
