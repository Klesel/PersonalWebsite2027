import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Files are named `<name>.<locale>.md`, e.g. `about.de.md` and `about.en.md`.
const idFromFilename = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

const localized = z.object({ de: z.string(), en: z.string() });

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages', generateId: idFromFilename }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().optional(),
    lead: z.string().optional(),
    sections: z
      .array(z.object({ title: z.string(), text: z.string() }))
      .optional(),
    steps: z
      .array(z.object({ title: z.string(), text: z.string() }))
      .optional(),
    shortBio: z.string().optional(),
  }),
});

const keynotes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/keynotes', generateId: idFromFilename }),
  schema: z.object({
    order: z.number(),
    slug: z.string(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    audience: z.array(z.string()),
    takeaways: z.array(z.string()),
    formats: z.array(z.string()),
    relatedPublications: z.array(z.string()).default([]),
  }),
});

const photos = defineCollection({
  loader: file('./src/data/photos.json'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      alt: localized,
      caption: localized.optional(),
      credit: z.string().optional(),
    }),
});

const testimonials = defineCollection({
  loader: file('./src/data/testimonials.json'),
  // Quotes are shown as given, in their original language, on both language versions.
  schema: z.object({
    quote: z.string(),
    lang: z.enum(['de', 'en']),
    name: z.string(),
    role: localized,
    organisation: z.string(),
  }),
});

export const collections = { pages, keynotes, photos, testimonials };
