// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.klesel.info',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Lets component styles reach child components that receive a `class` prop (e.g. <Icon>).
  scopedStyleStrategy: 'class',
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  image: {
    responsiveStyles: true,
  },
});
