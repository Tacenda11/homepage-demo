import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { once } from 'node:events';
import { build } from '../scripts/build.mjs';
import { createPreviewServer } from '../scripts/serve.mjs';
import { EMAIL } from '../assets/interactions.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(join(root, 'index.html'), 'utf8');

test('profile, education, project and email are readable without JavaScript', () => {
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>陆鸿儒/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  const visibleText = html.replace(/<[^>]*>/g, ' ');
  assert.ok(visibleText.includes('陆鸿儒'));
  assert.ok(visibleText.includes('中国科学院大学计算机学院'));
  assert.ok(visibleText.includes('期权价格预测与风险预警'));
  assert.ok(visibleText.includes(EMAIL));
  assert.ok(!visibleText.includes('Tacenda11'));
  assert.ok(!html.includes('2365926028@qq.com'));
  assert.match(html, /href="https:\/\/github.com\/Tacenda11\/final"/);
  assert.match(html, /href="https:\/\/github.com\/Tacenda11\/homepage-demo"/);
});

test('email links and clipboard behavior use the same supplied address', () => {
  const addresses = [...html.matchAll(/href="mailto:([^"]+)"/g)].map((match) => match[1]);
  assert.ok(addresses.length >= 1);
  assert.ok(addresses.every((address) => address === EMAIL));
  assert.match(html, /id="copy-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('navigation and SVG references resolve to unique page IDs', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate element IDs');
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing target: ${id}`);
  for (const [, id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(id), `Missing label: ${id}`);
});

test('external links and image alternatives retain accessible fallbacks', () => {
  for (const [link] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(link, /rel="[^"]*noopener/);
    assert.match(link, /rel="[^"]*noreferrer/);
  }
  assert.match(html, /class="header-github"[^>]*aria-label="[^" ]+/);
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) assert.match(img, /alt="[^" ]+/);
  assert.match(html, /class="skip-link"/);
});

test('all local assets exist and the page has no remote script dependency', async () => {
  for (const [, asset] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await access(join(root, asset));
  assert.doesNotMatch(html, /<script[^>]*src="https?:/);
  assert.doesNotMatch(html, /href="https?:[^\"]+\.(?:css|woff2?)/);
});

test('browser modules and local tools pass JavaScript syntax checks', () => {
  for (const file of ['assets/app.mjs', 'assets/interactions.mjs', 'scripts/build.mjs', 'scripts/serve.mjs']) {
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' });
  }
});

test('production build serves updated content and assets over HTTP', async (t) => {
  const dist = await build();
  assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), html);
  await access(join(dist, '.nojekyll'));
  const server = createPreviewServer(dist);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, type] of [['/', 'text/html'], ['/assets/styles.css', 'text/css'], ['/assets/app.mjs', 'text/javascript'], ['/assets/interactions.mjs', 'text/javascript'], ['/assets/avatar.png', 'image/png'], ['/assets/favicon.svg', 'image/svg+xml']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get('content-length')), Buffer.byteLength(html));
  assert.equal(await head.text(), '');
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  for (const path of ['/.git/config', '/.openai/hosting.json', '/scripts/serve.mjs', '/assets/missing.png', '/assets/%2e%2e%2f.git%2fconfig']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base + '/assets/%zz')).status, 400);
});
