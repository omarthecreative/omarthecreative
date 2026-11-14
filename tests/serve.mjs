// Static file server for src/, for tests and for looking at the site by hand. Not for production.
// Answers byte ranges (Safari will not play a video from a server that does not).
// By hand, HOST and PORT come from the environment (HOST=0.0.0.0 PORT=8080 to open it on a phone).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

// cacheControl: 'no-store' for tests; pass Netlify's 'public,max-age=0,must-revalidate' to mimic live.
export function startServer(rootDir, { cacheControl = 'no-store', host = '127.0.0.1', port = 0 } = {}) {
  const root = path.resolve(rootDir);
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const body = await fs.readFile(file);
      const size = body.length;
      const headers = {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': cacheControl,
        'Accept-Ranges': 'bytes',
      };
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (m && (m[1] || m[2])) {
        // bytes=a-b, bytes=a-, bytes=-n
        const a = m[1] ? +m[1] : Math.max(size - +m[2], 0);
        const b = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
        if (a >= size || a > b) {
          res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
          return;
        }
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
        res.end(body.subarray(a, b + 1));
        return;
      }
      res.writeHead(200, { ...headers, 'Content-Length': size });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const { port: bound } = server.address();
      resolve({
        url: `http://${host === '0.0.0.0' ? 'localhost' : host}:${bound}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

// `node tests/serve.mjs` serves src/ for looking at by hand.
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT) || 0;
  startServer(path.join(here, '..', 'src'), { host, port }).then(({ url }) => console.log(`serving src/ at ${url}${host === '0.0.0.0' ? ' (open it on a phone with this computer\'s address and the same port)' : ''}`));
}
