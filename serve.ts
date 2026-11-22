// Ember Court — a tiny static server for local play-testing only.
// Serves game/ on http://localhost:8080 so the game can be opened in a
// desktop browser exactly as the grader's static server will serve it.
// Node 22, standard library only; not part of the game itself.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = normalize(join(root, decodeURIComponent(url.pathname))).replace(/\\/g, '/');
  if (!path.startsWith(root.replace(/\\/g, '/') + sep) && path !== root) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  const file = (path === root || path === `${root}/` || path === `${root}${sep}`) ? join(root, 'index.html') : path;
  try {
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error('not a file');
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
}).listen(port, () => {
  console.log(`Ember Court served at http://localhost:${port}`);
});
