import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { defaultLocale, locales, routes, type Alternates } from '../i18n';
import { keynoteAlternates } from '../lib/content';

// One <url> per page and language, each listing all language versions (hreflang).
export const GET: APIRoute = async ({ site }) => {
  const names = [...new Set((await getCollection('keynotes')).map((k) => k.id.replace(/\.(de|en)$/, '')))];
  const pages: Alternates[] = [
    ...Object.values(routes),
    ...(await Promise.all(names.map((name) => keynoteAlternates(name)))),
  ];

  const url = (path: string) => new URL(path, site).href;
  const entries = pages.flatMap((alternates) =>
    locales.map(
      (locale) => `  <url>
    <loc>${url(alternates[locale])}</loc>
${locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(alternates[l])}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(alternates[defaultLocale])}"/>
  </url>`,
    ),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
