// Every page that sets a link-preview image points at a real file by absolute URL, and Twitter/X sees
// the same image. The pages that used the old shootout preview now use the dashboard image
// (docs/superpowers/plans/2026-11-20-link-preview-image.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const ORIGIN = 'https://omarthecreative.com/';
const DASH_IMAGE = `${ORIGIN}assets/og/og-dashboard-miami-v2-1200x630.jpg`;
const DASH_PAGES = ['index.html', 'films.html'];

async function htmlFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// All <meta> tags, keyed by property or name. Attribute order does not matter.
function metas(html) {
  const m = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = (n) => tag.match(new RegExp(`\\b${n}\\s*=\\s*"([^"]*)"`, 'i'))?.[1];
    const key = attr('property') ?? attr('name');
    if (key) m[key] = attr('content');
  }
  return m;
}

async function pagesWithPreview() {
  const pages = [];
  for (const f of await htmlFiles(SRC)) {
    const m = metas(await fs.readFile(f, 'utf8'));
    if (m['og:image']) pages.push({ rel: path.relative(SRC, f), m });
  }
  return pages;
}

test('every og:image is absolute, exists under src/, and matches twitter:image', async () => {
  const pages = await pagesWithPreview();
  assert.ok(pages.length >= 2, `found pages with a preview image (${pages.length})`);
  for (const { rel, m } of pages) {
    const url = m['og:image'];
    assert.ok(url.startsWith(ORIGIN), `${rel}: og:image is absolute on ${ORIGIN} (${url})`);
    const file = path.join(SRC, decodeURIComponent(url.slice(ORIGIN.length)));
    await assert.doesNotReject(fs.access(file), `${rel}: ${url} exists under src/`);
    assert.equal(m['twitter:image'], url, `${rel}: twitter:image matches og:image`);
    assert.equal(m['twitter:card'], 'summary_large_image', `${rel}: twitter:card`);
    assert.ok(m['og:url']?.startsWith(ORIGIN.slice(0, -1)), `${rel}: has an absolute og:url`);
  }
});

test('the dashboard image is declared as 1200 x 630 wherever it is used', async () => {
  for (const { rel, m } of await pagesWithPreview()) {
    if (m['og:image'] !== DASH_IMAGE) continue;
    assert.equal(m['og:image:width'], '1200', `${rel}: og:image:width`);
    assert.equal(m['og:image:height'], '630', `${rel}: og:image:height`);
    assert.equal(m['og:image:type'], 'image/jpeg', `${rel}: og:image:type`);
    assert.equal(m['og:image:secure_url'], DASH_IMAGE, `${rel}: og:image:secure_url`);
    assert.ok(m['og:image:alt']?.length > 20, `${rel}: og:image:alt`);
  }
});

test('the landing page and films page use the dashboard image, not the old shootout', async () => {
  for (const rel of DASH_PAGES) {
    const m = metas(await fs.readFile(path.join(SRC, rel), 'utf8'));
    assert.equal(m['og:image'], DASH_IMAGE, `${rel}: og:image`);
  }
});

test('the dashboard image file really is a 1200 x 630 JPEG', async () => {
  const b = await fs.readFile(path.join(SRC, 'assets', 'og', 'og-dashboard-miami-v2-1200x630.jpg'));
  assert.equal(b[0], 0xFF); assert.equal(b[1], 0xD8, 'is a JPEG');
  let i = 2, size;
  while (i < b.length && b[i] === 0xFF) {
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (marker >= 0xC0 && marker <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marker)) {
      size = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; break;
    }
    i += 2 + len;
  }
  assert.deepEqual(size, { w: 1200, h: 630 });
});

test('every local og:image JPEG is baseline, not progressive (LinkedIn finds no image in a progressive one)', async () => {
  for (const { rel, m } of await pagesWithPreview()) {
    const url = m['og:image'];
    if (!/\.jpe?g$/i.test(url)) continue;
    const b = await fs.readFile(path.join(SRC, decodeURIComponent(url.slice(ORIGIN.length))));
    let i = 2, sof;
    while (i < b.length && b[i] === 0xFF) {
      const marker = b[i + 1];
      if (marker >= 0xC0 && marker <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(marker)) { sof = marker; break; }
      i += 2 + b.readUInt16BE(i + 2);
    }
    assert.equal(sof, 0xC0, `${rel}: ${url} is baseline (SOF0), found 0x${sof?.toString(16)}`);
  }
});
