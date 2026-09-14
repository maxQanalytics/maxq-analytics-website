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
- **Registry**: every edition is listed in `docs/preview-pages.md` with its
  URL, date, source screenshots and status (preview / promoted / retired).
- **Promoting**: copy the edition's content over the public page
  (`src/pages/add-ons/<addon-slug>.astro`), drop the preview badge and
  `noindex`, keep the edition file in place, mark it promoted in the registry.
