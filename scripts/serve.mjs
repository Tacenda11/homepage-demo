import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

export function createPreviewServer(root = projectRoot) {
  const publicRoot = resolve(root);
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed'); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.') && part !== '') || (!['/', '/index.html'].includes(pathname) && !pathname.startsWith('/assets/'))) {
        response.writeHead(404); response.end('Not found'); return;
      }
      const filename = resolve(publicRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filename.startsWith(publicRoot + sep) || !(await stat(filename)).isFile()) { response.writeHead(404); response.end('Not found'); return; }
      const content = await readFile(filename);
      response.writeHead(200, { 'Content-Type': types[extname(filename)] || 'application/octet-stream', 'Content-Length': content.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404);
      response.end(error instanceof URIError ? 'Bad request' : 'Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createPreviewServer(process.argv.includes('--dist') ? join(projectRoot, 'dist') : projectRoot);
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
}
