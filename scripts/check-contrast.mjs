// Verifies WCAG AA contrast for every text/background pair in src/styles/theme.css,
// in both the light and the dark colour scheme.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/theme.css', import.meta.url), 'utf8');

function tokens(selector) {
  const start = css.indexOf(selector + ' {');
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const light = tokens(':root');
const schemes = { light, dark: { ...light, ...tokens(":root[data-theme='dark']") } };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, minimum ratio]. 4.5 = normal text, 3 = large text / UI components.
const pairs = [
  ['color-text', 'color-bg', 4.5],
  ['color-text', 'color-bg-subtle', 4.5],
  ['color-text', 'color-surface', 4.5],
  ['color-text-muted', 'color-bg', 4.5],
  ['color-text-muted', 'color-bg-subtle', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-primary', 'color-bg', 4.5],
  ['color-primary', 'color-bg-subtle', 4.5],
  ['color-accent', 'color-bg', 4.5],
  ['color-accent', 'color-bg-subtle', 4.5],
  ['color-accent', 'color-surface', 4.5],
  ['color-accent-hover', 'color-bg', 4.5],
  ['color-accent', 'color-accent-soft', 4.5],
  ['color-accent-contrast', 'color-accent', 4.5],
  ['color-accent-contrast', 'color-accent-hover', 4.5],
  ['color-inverse-text', 'color-inverse-bg', 4.5],
  ['color-inverse-muted', 'color-inverse-bg', 4.5],
  ['color-inverse-accent', 'color-inverse-bg', 4.5],
  ['color-inverse-bg', 'color-inverse-text', 4.5], // primary button in the call-to-action band
  ['color-inverse-bg', 'color-inverse-muted', 4.5],
];

let failed = 0;
for (const [scheme, t] of Object.entries(schemes)) {
  for (const [fg, bg, min] of pairs) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${scheme.padEnd(5)} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min})`);
  }
}
if (failed) {
  console.error(`\n${failed} colour pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log('\nAll colour pairs meet WCAG AA.');
