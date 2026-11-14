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
