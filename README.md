# klesel.info

Personal website of Prof. Dr. Michael Klesel – keynotes, consulting and publications.
Static site built with [Astro](https://astro.build), German (default) and English, light and dark mode.
No PHP, no cookies, no tracking, no third-party requests.

## Quick start

```sh
nvm use          # Node version from .nvmrc
npm ci           # install the exact versions from package-lock.json
npm run dev      # local preview at http://localhost:4321 (reloads on save)
npm test         # contrast check, type check, build, link check
```

## Where to change what

| What | Where |
|---|---|
| Menus, buttons, labels (DE + EN side by side) | `src/i18n/ui.json` |
| Page text | `src/content/pages/<page>.de.md` and `<page>.en.md` |
| Keynote topics | `src/content/keynotes/<topic>.de.md` and `<topic>.en.md` |
| Name, title, email, profile links, featured publications | `src/data/site.json` |
| Publications | `src/data/publications.bib` |
| Keynote photos | `src/assets/photos/` + `src/data/photos.json` |
| Testimonials | `src/data/testimonials.json` |
| Colours, fonts, spacing | `src/styles/theme.css` |
| URLs of each page per language | `routes` in `src/i18n/index.ts` |
| Server settings (redirects, caching) | `public/.htaccess` |

The build stops with an error if a text in `ui.json` or a page/keynote is missing in one of the two languages.

### Publications

Replace `src/data/publications.bib` with your current export (e.g. from Zotero) and push. Entries are grouped by year and
categorised automatically: `@article` → journal, `@inproceedings` → conference, everything else → other.
DOIs, URLs and abstracts are shown when present. The file is also offered for download at `/publications.bib`.
The three publications on the home page are set by their BibTeX keys in `featuredPublications` in `src/data/site.json`.

### Keynote topics

Each topic is a pair of Markdown files. The front matter holds the structured parts (title, audience, takeaways,
formats, related publications by BibTeX key, `order` for sorting, `slug` for the URL); the text below it is the description.
To add a topic, copy an existing pair and change the values.

### Photos

1. Put the image into `src/assets/photos/` (JPG or PNG, as large as you have – it is resized and converted automatically).
2. Add an entry to `src/data/photos.json`. Alt text in both languages is required for accessibility:

```json
[
  {
    "id": "conference-2025",
    "image": "../assets/photos/conference-2025.jpg",
    "alt": { "de": "Michael Klesel spricht auf der Bühne vor Publikum", "en": "Michael Klesel speaking on stage to an audience" },
    "caption": { "de": "Keynote auf der Beispielkonferenz 2025", "en": "Keynote at Example Conference 2025" },
    "credit": "Name of photographer"
  }
]
```

The photo section on the home and keynote pages appears automatically as soon as the list is not empty.

### Testimonials

Add entries to `src/data/testimonials.json` (only with the person's permission). Quotes are shown in their original language:

```json
[
  {
    "id": "example",
    "quote": "Quote text …",
    "lang": "de",
    "name": "Full Name",
    "role": { "de": "Leiterin Veranstaltungen", "en": "Head of Events" },
    "organisation": "Organisation"
  }
]
```

### Colours

All colours are defined once in `src/styles/theme.css` – a light block and a dark block. After changing them, run
`npm run check:contrast`; it verifies WCAG AA contrast for every text/background pair in both schemes (this also runs in CI).

### Favicon

Edit `public/favicon.svg`, then run `node scripts/generate-icons.mjs` to regenerate the PNG/ICO versions.

## Quality checks (CI)

Every push and pull request runs `.github/workflows/ci.yml`:

1. Colour contrast (WCAG AA, light and dark)
2. Type check (`astro check`)
3. Build
4. Internal link check – a broken internal link fails the build
5. Lighthouse on the main pages – accessibility, SEO ≥ 95 and best practices ≥ 90 are required; performance < 90 warns
6. External link check – warnings only

## Deployment to Strato (SFTP)

`.github/workflows/deploy.yml` builds and tests the site, then mirrors `dist/` to the webspace with `lftp`.
Files on the server that are no longer part of the site are **deleted** (except `.well-known/`).
Make sure the target folder contains nothing else.

### One-time setup

1. In the Strato customer area, look up the SFTP server, user name and password.
2. Get the server's SSH host key (run on your own computer, replace the host if Strato shows a different one):
   ```sh
   ssh-keyscan ssh.strato.de
   ```
   Check the fingerprint against the one Strato publishes if available.
3. In GitHub: **Settings → Secrets and variables → Actions → Secrets**, add
   `SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD` and `SFTP_KNOWN_HOSTS` (the full output of step 2).
4. Optional, under **Variables**: `SFTP_TARGET_DIR` if the site does not live in the webspace root (`/`).

### First deployment

1. **Actions → Deploy → Run workflow** with “Dry run” ticked. The log lists every file that would be uploaded or deleted.
2. If the list looks right, run it again without “Dry run”.
3. To deploy automatically on every push to `main`, add the variable `DEPLOY_ENABLED` = `true`.

## Reproducibility

- `package-lock.json` pins every package version and checksum; CI installs with `npm ci`.
- `.npmrc` (`save-exact=true`) makes new dependencies pinned to exact versions.
- `.nvmrc` pins the Node.js version for local work and CI.
- Lighthouse CI is not a project dependency (it pulls in many outdated sub-packages); `npm run lighthouse`
  fetches exactly version 0.15.1 on demand.
- CI runs on `ubuntu-24.04`; GitHub Actions are pinned to commit SHAs.
- Dependabot (`.github/dependabot.yml`) proposes updates monthly as pull requests, which CI tests before you merge.
- Each CI run keeps the built site as an artifact for 30 days.
