import ui from './ui.json';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export type UiKey = keyof typeof ui;

// Fail the build if any interface text lacks a translation.
for (const [key, value] of Object.entries(ui) as [string, Record<string, string>][]) {
  for (const locale of locales) {
    if (!value[locale]?.trim()) {
      throw new Error(`ui.json: missing "${locale}" translation for "${key}"`);
    }
  }
}

export function t(locale: Locale, key: UiKey, vars: Record<string, string | number> = {}): string {
  let text: string = ui[key][locale];
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

/**
 * Every page and its URL in each language. The language switch and
 * hreflang links use this map, so a page always links to its counterpart.
 */
export const routes = {
  home: { de: '/', en: '/en/' },
  keynotes: { de: '/keynotes/', en: '/en/keynotes/' },
  consulting: { de: '/beratung/', en: '/en/consulting/' },
  about: { de: '/ueber-mich/', en: '/en/about/' },
  publications: { de: '/publikationen/', en: '/en/publications/' },
  contact: { de: '/kontakt/', en: '/en/contact/' },
  imprint: { de: '/impressum/', en: '/en/imprint/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy/' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;
export type Alternates = Record<Locale, string>;

export const otherLocale = (locale: Locale): Locale => (locale === 'de' ? 'en' : 'de');

export const htmlLang: Record<Locale, string> = { de: 'de-DE', en: 'en' };
export const ogLocale: Record<Locale, string> = { de: 'de_DE', en: 'en_US' };
