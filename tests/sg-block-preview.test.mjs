// LinkedIn fetches link-preview images from servers in Singapore (Netlify logs, 2026-11-20:
// LinkedInBot from 103.20.93.x, country SG, 403 from block-singapore). The block stays on the
// site; the preview images are excluded from it, and nothing else is.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const FN = path.join(ROOT, 'netlify', 'edge-functions', 'block-singapore.ts');
const ORIGIN = 'https://www.omarthecreative.com';

async function excluded() {
  const ts = await fs.readFile(FN, 'utf8');
  const m = ts.match(/excludedPath\s*:\s*\[([^\]]*)\]/);
  assert.ok(m, 'block-singapore config has an excludedPath array');
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}
const matches = (glob, p) => new RegExp('^' + glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(p);

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

test('the Singapore block still covers the whole site', async () => {
  const ts = await fs.readFile(FN, 'utf8');
  assert.match(ts, /path\s*:\s*["']\/\*["']/);
  assert.match(ts, /=== "SG"/);
});

test('every og:image path is excluded from the Singapore block', async () => {
  const globs = await excluded();
  const missing = [];
  for (const f of await htmlFiles(SRC)) {
    const url = (await fs.readFile(f, 'utf8')).match(/property="og:image" content="([^"]+)"/)?.[1];
    if (!url) continue;
    const p = url.slice(ORIGIN.length);
    if (!globs.some((g) => matches(g, p))) missing.push(`${path.relative(SRC, f)}: ${p}`);
  }
  assert.deepEqual(missing, [], 'preview images still behind the block');
});

test('the exclusions are images only, never pages', async () => {
  for (const g of await excluded()) {
    assert.ok(/\.(jpe?g|png)$/i.test(g) || g === '/assets/og/*', `${g} is an image path`);
  }
});
