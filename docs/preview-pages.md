# Preview editions of add-on pages

An unlisted, dated copy of an add-on page, used to review a rebuild or to show
a specific prospect the current state of a product before the public page is
replaced. Each edition is its own URL and its own file; editions are never
overwritten, so any two can be compared side by side.

## URL and file naming

```
/add-ons/<addon-slug>-<YYYY-MM-DD>-<word>-<word>-<word>
src/pages/add-ons/<addon-slug>-<YYYY-MM-DD>-<word>-<word>-<word>.astro
public/add-ons/<addon-slug>/<YYYY-MM-DD>/        (screenshots for that edition)
```

- `<addon-slug>` is the public page's slug (`quality-guardian`,
  `analytics-assistant`, ...).
- `<YYYY-MM-DD>` is the day the edition was built.
- The three words are random, so the URL cannot be guessed. Generate them with:

```
python3 -c "
import random
a=['amber','cobalt','granite','harbor','juniper','lantern','meadow','orchard','quartz','saffron','timber','velvet']
b=['falcon','heron','otter','lynx','marten','kestrel','badger','plover','osprey','tern','finch','wren']
c=['ridge','cove','delta','fjord','glen','knoll','mesa','reef','shoal','strand','vale','weir']
print(random.choice(a)+'-'+random.choice(b)+'-'+random.choice(c))"
```

## Building an edition

1. Take screenshots of the product first (for Quality Guardian: the script and
   dated folders live in the product repo under `docs/screenshots/<date>/`).
   Copy the ones the page needs to `public/add-ons/<addon-slug>/<date>/`,
   resized to 1800 px wide and saved as JPEG (`sips --resampleWidth 1800`,
   then `sips -s format jpeg -s formatOptions 82`).
2. Create `src/pages/add-ons/<slug>.astro` as a complete page: same `Layout`,
   `SiteNav`, `SiteFooter` as the public page, `<Layout title="..." noindex>`,
   and a visible "Preview · <date>" badge in the hero so a reader knows which
   edition they are looking at.
3. Add the path to `ADDON_SLUGS` in `src/components/SiteFooter.astro`, mapped
   to the public add-on slug (tracking attribution).
4. Do **not** link the page from SiteNav, SiteFooter's link lists, or
   `src/pages/add-ons/index.astro`.
5. `npm run build`; confirm `dist/add-ons/<slug>/index.html` exists and
   contains `noindex`, and that the public page does not.
6. Commit only the edition's files (page, screenshots, the one-line footer
   entry, this registry). Push to `origin/main`; Vercel deploys in about a
   minute. Verify the live URL returns 200 and that `/add-ons/` does not
   mention the slug.
7. Add the edition to the registry below.

## Promoting an edition to the public page

Copy the edition's content over `src/pages/add-ons/<addon-slug>.astro`, remove
the preview badge and the `noindex` prop, keep the edition file and its
screenshots in place, and set the registry status to `promoted`.

## Registry

| Add-on | Edition URL | Built | Screenshots | Status |
|---|---|---|---|---|
| Quality Guardian | `/add-ons/quality-guardian-2026-09-14-granite-finch-knoll` | 2026-09-14 | `public/add-ons/quality-guardian/2026-09-14/` (from `quality_guardian/docs/screenshots/2026-09-14/`, rounds r2 and r3) | preview |
| Quality Guardian | `/add-ons/quality-guardian-2026-09-14-juniper-osprey-cove` | 2026-09-14 | same folder as above (r4 files) | preview (feedback round 1 on granite-finch-knoll: lighter hero text, flow chart instead of how-it-works text, no cost/usage content, no multi-client mention, Sarah removed from team) |
| Quality Guardian | `/add-ons/quality-guardian-2026-09-14-orchard-plover-reef` | 2026-09-14 | same folder; flow chart `src/diagrams/quality-guardian-flow-2026-09-14.svg` from `scripts/render-qg-flow.mjs` | preview (edition 2 + generated SVG flow chart with curved split, satellites and a dashed return loop; CSS stack kept for phones) |
| Quality Guardian | `/add-ons/quality-guardian-2026-09-14-quartz-finch-weir` | 2026-09-14 | same folder and flow SVG | preview (feedback round on orchard-plover-reef: Add-on/Protect tags removed, brighter text on dark sections, CTA 'Schedule live demo', key-number tiles and hero side note removed, 'analytics warehouse') |
