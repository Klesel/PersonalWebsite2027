import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { BIB_PATH } from '../lib/publications';

// Publishes the BibTeX file unchanged, so there is only one copy to maintain.
export const GET: APIRoute = () =>
  new Response(readFileSync(BIB_PATH, 'utf8'), {
    headers: { 'Content-Type': 'application/x-bibtex; charset=utf-8' },
  });
