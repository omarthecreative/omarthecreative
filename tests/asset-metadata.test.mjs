// The scene assets carry no provenance metadata, and the clean New York files are the ones in place.
// The transfer to this Mac adds a C2PA record (a JPEG APP11 JUMBF segment, an MP4 uuid box) to every
// image and clip. It ships to visitors for no reason and bloats each file by about 5.8 KB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const DASH = path.join(SRC, 'assets', 'dash');
const OG = path.join(SRC, 'assets', 'og');

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

test('no file under src/assets/dash/ holds a c2pa or jumb record', async () => {
  const files = await walk(DASH);
  assert.ok(files.length > 20, `found the assets (${files.length} files)`);
  const dirty = [];
  for (const f of files) {
    const b = await fs.readFile(f);
    for (const needle of ['c2pa', 'jumb']) if (b.includes(Buffer.from(needle))) dirty.push(`${path.relative(SRC, f)} has "${needle}"`);
  }
  assert.deepEqual(dirty, [], 'files with provenance metadata');
});

test('no file under src/assets/og/ holds a c2pa or jumb record', async () => {
  const files = await walk(OG);
  assert.ok(files.length >= 1, `found the link-preview images (${files.length} files)`);
  const dirty = [];
  for (const f of files) {
    const b = await fs.readFile(f);
    for (const needle of ['c2pa', 'jumb']) if (b.includes(Buffer.from(needle))) dirty.push(`${path.relative(SRC, f)} has "${needle}"`);
  }
  assert.deepEqual(dirty, [], 'files with provenance metadata');
});

test('the six scene stills are plain JPEGs with no APP11 segment', async () => {
  for (const city of ['miami-beach', 'new-york', 'tokyo']) {
    for (const name of ['still-1920.jpg', 'still-960.jpg']) {
      const b = await fs.readFile(path.join(DASH, 'scenes', city, name));
      assert.equal(b[0], 0xFF); assert.equal(b[1], 0xD8, `${city}/${name} is a JPEG`);
      let i = 2; const markers = [];
      while (i < b.length && b[i] === 0xFF && b[i + 1] !== 0xDA) { markers.push(b[i + 1]); i += 2 + b.readUInt16BE(i + 2); }
      assert.ok(!markers.includes(0xEB), `${city}/${name} has no APP11 (JUMBF) segment`);
    }
  }
});

test('the clean New York scene is in place', async () => {
  // Exact sizes of the clean export (docs/superpowers/plans/2026-11-20-new-york-clean-swap.md).
  const want = { 'still-1920.jpg': 221554, 'still-960.jpg': 63621, 'clip-1920.mp4': 1864204, 'clip-960.mp4': 708332 };
  for (const [name, size] of Object.entries(want)) {
    assert.equal((await fs.stat(path.join(DASH, 'scenes', 'new-york', name))).size, size, `new-york/${name} bytes`);
  }
});

test('index.html asks for the new scenes file, so returning visitors refetch it', async () => {
  const html = await fs.readFile(path.join(SRC, 'index.html'), 'utf8');
  assert.match(html, /src="dashboard-scenes\.js\?v=6"/);
});
