import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function build() {
  const dist = join(root, 'dist');
  await mkdir(dist, { recursive: true });
  await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
  await cp(join(root, 'index.html'), join(dist, 'index.html'));
  await writeFile(join(dist, '.nojekyll'), '');
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
    await readFile(join(dist, match[1]));
  }
  console.log('Build succeeded: dist/ (static assets, no runtime dependencies)');
  return dist;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
