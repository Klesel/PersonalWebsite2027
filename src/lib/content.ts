import { getCollection, getEntry } from 'astro:content';
import { locales, routes, type Locale } from '../i18n';

export async function getPage(name: string, locale: Locale) {
  const page = await getEntry('pages', `${name}.${locale}`);
  if (!page) {
    throw new Error(`Missing page content: src/content/pages/${name}.${locale}.md`);
  }
  return page;
}

/** Keynotes for one language, sorted by `order`. Fails the build if a translation is missing. */
export async function getKeynotes(locale: Locale) {
  const all = await getCollection('keynotes');
  const names = new Set(all.map((k) => k.id.replace(/\.(de|en)$/, '')));
  for (const name of names) {
    for (const l of locales) {
      if (!all.some((k) => k.id === `${name}.${l}`)) {
        throw new Error(`Missing keynote translation: src/content/keynotes/${name}.${l}.md`);
      }
    }
  }
  return all
    .filter((k) => k.id.endsWith(`.${locale}`))
    .sort((a, b) => a.data.order - b.data.order)
    .map((k) => ({ ...k, name: k.id.replace(/\.(de|en)$/, '') }));
}

export const keynotePath = (locale: Locale, slug: string) => `${routes.keynotes[locale]}${slug}/`;

/** URLs of one keynote in every language, for the language switch. */
export async function keynoteAlternates(name: string) {
  const all = await getCollection('keynotes');
  return Object.fromEntries(
    locales.map((l) => {
      const entry = all.find((k) => k.id === `${name}.${l}`)!;
      return [l, keynotePath(l, entry.data.slug)];
    }),
  ) as Record<Locale, string>;
}
