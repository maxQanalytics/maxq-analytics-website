# Archived add-on pages

Add-on pages taken off the website on 2026-10-09 because they are not sold
actively and Google had indexed them (`site:maxqanalytics.io/add-ons/`).
Astro only builds `src/pages/`, so nothing in this folder is published. The
files keep the same depth as `src/pages/add-ons/`, so their imports resolve
unchanged when a page is moved back.

Each old URL redirects to `/add-ons/` (see `redirects` in `vercel.json`).

## Bringing a page back

1. `git mv src/archive/add-ons/<slug>.astro src/pages/add-ons/<slug>.astro`
2. Remove its redirect from `vercel.json`.
3. Decide how it is reached: add it to the nav/footer and the add-ons
   overview, or, if it stays unlisted, to `UNLISTED_PATHS` in `src/seo.mjs`
   (unlisted pages are still indexable; use `<Layout noindex>` if they must
   stay out of Google).
4. Its meta description is still in `DESCRIPTIONS` in `src/seo.mjs`.

| Page | Archived | Note |
|---|---|---|
| deal-expander | 2026-10-09 | |
| enterprise-valuator | 2026-10-09 | |
| firefighter | 2026-10-09 | |
| metricsrouter | 2026-10-09 | |
| upsell-calculator | 2026-10-09 | |
| weekly-okr-tracker | 2026-10-09 | |
