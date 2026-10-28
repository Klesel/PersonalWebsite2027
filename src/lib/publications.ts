import { readFileSync } from 'node:fs';
import { parse, type Entry } from '@retorquere/bibtex-parser';
import { t, type Locale } from '../i18n';

export const BIB_PATH = 'src/data/publications.bib';

export type PublicationCategory = 'journal' | 'conference' | 'other';

export interface Person {
  first: string;
  last: string;
  isOwner: boolean;
}

export interface Publication {
  key: string;
  category: PublicationCategory;
  title: string;
  authors: Person[];
  /** True when `authors` are the editors of the work. */
  edited: boolean;
  year: number;
  venue: string;
  details: string;
  doi?: string;
  url?: string;
  abstract?: string;
  bibtex: string;
}

const OWNER_LAST_NAME = 'Klesel';

const categoryOf: Record<string, PublicationCategory> = {
  article: 'journal',
  inproceedings: 'conference',
  conference: 'conference',
};

const clean = (s?: string) =>
  s
    ?.replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim() || undefined;

const join = (v?: string | string[]) => clean(Array.isArray(v) ? v.join(', ') : v);

function people(entry: Entry): { list: Person[]; edited: boolean } {
  const creators = entry.fields.author ?? entry.fields.editor ?? [];
  return {
    edited: !entry.fields.author && !!entry.fields.editor,
    list: creators.map((c) => ({
      first: c.firstName ?? '',
      last: c.lastName ?? c.name ?? '',
      isOwner: c.lastName === OWNER_LAST_NAME,
    })),
  };
}

function venueOf(entry: Entry, locale: Locale): { venue: string; details: string } {
  const f = entry.fields;
  const location = join(f.location ?? f.address);
  switch (entry.type) {
    case 'article': {
      const volume = f.volume ? `${f.volume}${f.number || f.issue ? `(${f.number ?? f.issue})` : ''}` : '';
      return { venue: join(f.journal ?? f.journaltitle) ?? '', details: [volume, f.pages].filter(Boolean).join(', ') };
    }
    case 'inproceedings':
    case 'incollection':
      return { venue: join(f.booktitle) ?? '', details: [location, f.pages].filter(Boolean).join(', ') };
    case 'thesis':
    case 'phdthesis':
      return { venue: join(f.institution ?? f.school) ?? '', details: t(locale, 'pub.thesis') };
    case 'report':
      return { venue: join(f.institution) ?? '', details: clean(f.type) ?? '' };
    default:
      return {
        venue: join(f.journal ?? f.howpublished ?? f.publisher) ?? '',
        details: [location, f.isbn ? `ISBN ${f.isbn}` : ''].filter(Boolean).join(', '),
      };
  }
}

const cache = new Map<Locale, Publication[]>();

/** All publications from the BibTeX file, newest first. */
export function getPublications(locale: Locale): Publication[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  const library = parse(readFileSync(BIB_PATH, 'utf8'), {
    english: false,
    sentenceCase: false,
    caseProtection: false,
  });
  if (library.errors.length) {
    const details = library.errors.map((e) => `  - ${e.error}`).join('\n');
    throw new Error(`${BIB_PATH} could not be parsed:\n${details}`);
  }

  const publications = library.entries
    .map((entry, index) => {
      const { list, edited } = people(entry);
      const year = Number.parseInt(entry.fields.year ?? entry.fields.date ?? '', 10);
      if (!entry.fields.title || Number.isNaN(year)) {
        throw new Error(`${BIB_PATH}: entry "${entry.key}" needs a title and a year`);
      }
      return {
        index,
        key: entry.key,
        category: categoryOf[entry.type] ?? 'other',
        title: clean(entry.fields.title)!,
        authors: list,
        edited,
        year,
        ...venueOf(entry, locale),
        doi: clean(entry.fields.doi),
        url: clean(entry.fields.url),
        abstract: clean(entry.fields.abstract),
        bibtex: entry.input.trim(),
      };
    })
    .sort((a, b) => b.year - a.year || a.index - b.index)
    .map(({ index: _index, ...publication }) => publication);

  cache.set(locale, publications);
  return publications;
}

export function getPublicationsByKey(locale: Locale, keys: string[]): Publication[] {
  const all = getPublications(locale);
  return keys.map((key) => {
    const publication = all.find((p) => p.key === key);
    if (!publication) throw new Error(`Publication "${key}" not found in ${BIB_PATH}`);
    return publication;
  });
}

export const linkOf = (p: Publication) => (p.doi ? `https://doi.org/${p.doi}` : p.url);
