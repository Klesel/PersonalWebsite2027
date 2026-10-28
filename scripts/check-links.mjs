// Checks every link in the built site (dist/).
// - Internal links must point to an existing file: a broken one fails the build.
// - With --external, external links are requested too; failures are reported as warnings,
//   because other websites can be temporarily unavailable or block automated requests.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.klesel.info';
const checkExternal = process.argv.includes('--external');

if (!existsSync(DIST)) {
  console.error('dist/ not found – run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = (function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
  });
})(DIST);

const internal = new Map(); // url -> pages using it
const external = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  for (let [, url] of html.matchAll(/\s(?:href|src|content)="([^"]+)"/g)) {
    // Absolute links to this website (canonical, hreflang, og:image) are checked as internal links.
    if (url.startsWith(SITE + '/')) url = url.slice(SITE.length);
    if (/^(mailto:|tel:|#|data:|javascript:)/.test(url)) continue;
    const target = /^https?:\/\//.test(url) ? external : url.startsWith('/') ? internal : null;
    if (!target) continue;
    if (!target.has(url)) target.set(url, new Set());
    target.get(url).add(page);
  }
  for (const [, srcset] of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/')) {
        if (!internal.has(url)) internal.set(url, new Set());
        internal.get(url).add(page);
      }
    }
  }
}

function existsInDist(url) {
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  const candidates = path.endsWith('/') ? [join(DIST, path, 'index.html')] : [join(DIST, path), join(DIST, path, 'index.html')];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

let broken = 0;
for (const [url, pages] of internal) {
  if (!existsInDist(url)) {
    broken++;
    console.error(`✗ ${url}\n    linked from: ${[...pages].join(', ')}`);
  }
}

console.log(`Checked ${internal.size} internal links on ${htmlFiles.length} pages: ${broken} broken.`);

if (checkExternal) {
  let warnings = 0;
  await Promise.all(
    [...external.keys()].map(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'Mozilla/5.0 (link check for klesel.info)' },
        });
        // 401/403/429/999: the site exists but blocks automated requests (999 = LinkedIn).
        if (res.status >= 400 && ![401, 403, 429, 999].includes(res.status)) {
          warnings++;
          console.warn(`⚠ ${res.status} ${url}\n    linked from: ${[...external.get(url)].join(', ')}`);
        }
      } catch (error) {
        warnings++;
        console.warn(`⚠ ${error.name} ${url}`);
      }
    }),
  );
  console.log(`Checked ${external.size} external links: ${warnings} warning(s).`);
}

if (broken) process.exit(1);
