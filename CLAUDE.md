# maxq-analytics-website

Astro (static) + Tailwind site for https://www.maxqanalytics.io, deployed by
Vercel's git integration from `origin/main` (~1 minute after a push). Add-on
pages live in `src/pages/add-ons/`; nav and footer links are hand-maintained in
`src/components/SiteNav.astro` and `SiteFooter.astro`.

## Deploying
- Push to `origin/main`. Do not `vercel --prod` from the CLI: a later git
  integration deploy would silently revert anything not pushed.
- Before diagnosing "the site changed", run `git log origin/main..HEAD` and
  `git status`; uncommitted work in the tree is not what is live.
- Commit only the files that belong to the change. The tree may carry other
  in-progress work; stage by path, never `git add -A`.

## Archived add-on pages (since 2026-10-09)
Add-on pages that are not sold actively live in `src/archive/add-ons/`, outside
the build, with their old URLs redirecting to `/add-ons/` in `vercel.json`.
Do not put a page back under `src/pages/` just because it exists there; see
`src/archive/add-ons/README.md` for the steps. Pages that are live but not in
the nav are indexable by Google, so a page that must stay private needs
`<Layout noindex>` or the archive.

## Preview editions of add-on pages (unlisted URLs)
Used when an add-on page is rebuilt and should be reviewed, or shown to one
prospect, before it replaces the public page. Full procedure in
`docs/preview-pages.md`. Summary:

- **URL**: `/add-ons/<addon-slug>-<YYYY-MM-DD>-<word>-<word>-<word>`, the date
  being the day the edition was built and the three words random (e.g.
  `quality-guardian-2026-09-14-granite-finch-knoll`).
- **File**: `src/pages/add-ons/<that slug>.astro`, a complete page (same
  Layout, SiteNav, SiteFooter as the public one) with `<Layout noindex>`.
- **Not linked anywhere**: not in SiteNav, SiteFooter's link lists, or
  `src/pages/add-ons/index.astro`. Reachable only by the exact URL.
- **Tracking**: add the path to `ADDON_SLUGS` in `SiteFooter.astro`, mapped to
  the public add-on slug, so CTA clicks and Calendly bookings still attribute
  to the add-on.
- **Screenshots**: `public/add-ons/<addon-slug>/<YYYY-MM-DD>/`, JPEG, 1800 px
  wide; reference them with absolute paths from the page.
- **Never overwrite a previous edition**: a new iteration is a new dated slug
  and a new screenshot folder. Old editions stay until explicitly removed.
- **Diagrams**: flow charts are generated SVGs (`scripts/render-*.mjs` -> `src/diagrams/*.svg`, explicit coordinates, same arrow helpers as `maxq-sales/scripts/render-sales-funnel.mjs`), inlined with `import x from '...svg?raw'` + `<Fragment set:html={x} />`. Regenerate and commit the SVG with any spec change.
- **Registry**: every edition is listed in `docs/preview-pages.md` with its
  URL, date, source screenshots and status (preview / promoted / retired).
- **Promoting**: copy the edition's content over the public page
  (`src/pages/add-ons/<addon-slug>.astro`), drop the preview badge and
  `noindex`, keep the edition file in place, mark it promoted in the registry.

## Search and link previews (since 2026-10-09)
- `src/seo.mjs` holds the per-page meta descriptions (keyed by path with a
  trailing slash, 160 characters max), the unlisted-page list and the
  Organisation markup. `Layout.astro` reads it and writes the description,
  canonical URL, Open Graph tags and, on the homepage, the JSON-LD block.
  A new page needs an entry there (or a `description` prop on `<Layout>`).
- Share image: `public/og/maxq-analytics.png` (1200 x 630) and the square
  logo for the Organisation markup are rendered from `scripts/og/*.html`
  with `sh scripts/render-share-image.sh`.
- Sitemap: `@astrojs/sitemap` (pinned to 3.2.x, the last line for Astro 4)
  writes `sitemap-index.xml`; preview editions and `UNLISTED_PATHS` are
  filtered out in `astro.config.mjs`. `public/robots.txt` points to it.
- Who we are: `ABOUT_SENTENCES` in `src/seo.mjs` is the one-paragraph
  definition of the company (consultancy, De Bilt, Airbyte/dbt/Cube, Semantic
  Nexus). It is not shown on any page (Philip removed the homepage block on
  2026-10-09); the Organisation markup uses it as description, with address,
  founder, KvK, VAT and `knowsAbout`. Keep the same wording on LinkedIn,
  GitHub and YouTube; change it in one place only.
