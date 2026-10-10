# Design inspiration

Websites whose design we like, with what we like about them. Use this list as
input when redesigning a page or briefing Claude Code: name the site and the
specific element, not adjectives like "modern" or "clean".

Adding an entry: add a section below with the URL, the date and what you like
about it, one point per line. Sites change, so capture the design as it is
that day with `scripts/capture-inspiration.mjs` into
`docs/design-inspiration/<site>/<YYYY-MM-DD>/`. A later capture goes in a new
dated folder, so the versions can be compared.

## Axiom — https://axiom.co/

Added 2026-10-10.

- Interactive elements: things on the page move.
- Screenshots of their actual product.
- Customers shown in a table structure, with the logos swapping now and then.
  No carousel.
- Black and white, with one colour that keeps coming back: in their case a
  dark orange.
- Visuals that slowly fade away at the lower end of the image.
- A background pattern of four diagonal lines. It gives a sense of design
  without adding colour; otherwise everything is black, white and the brand
  colour.

Captured 2026-10-10 in [design-inspiration/axiom/2026-10-10/](design-inspiration/axiom/2026-10-10/):

| File | What |
|---|---|
| `desktop-full.png` | Whole page at 1440 px wide |
| `desktop-hero.png` | First screen on desktop |
| `mobile-full.png` | Whole page on a phone (390 px, 2x) |
| `mobile-hero.png` | First screen on a phone |
| `desktop-sections.webm` | Video: stops 4 seconds at every section of the page, so the moving elements are kept |
| `desktop-scroll.webm` | Earlier video: the hero for 6 seconds, then one slow scroll to the bottom |
| `page.html` | The rendered HTML of the page (text and structure; styles and images still load from axiom.co) |

## Stripe — https://stripe.com/

Added 2026-10-10.

- The integrations flow chart moves slowly and is dynamic: logos turn and
  show other logos.
- White background, not black. Much more relaxing and optimistic. Axiom has
  more of a developer vibe, but Maxq's clients are usually CEOs.
- Many different colours, not just a fixed set, which makes it happy and
  colourful.
- Images and photos of real things in the world, not only synthetic visuals
  and UI screenshots.
- They have a carousel, and it looks fine.
- A central theme of pink, orange and purple that runs through the whole
  site. Having one central theme is good.
- Performance metrics in several places on the page: proof points.
- Customer story pages, e.g. https://stripe.com/en-nl/customers/supabase.
  The story page shows the client's configuration at the top right (logo,
  products used, region, company type).

Captured 2026-10-10 in [design-inspiration/stripe/2026-10-10/](design-inspiration/stripe/2026-10-10/):

| Folder | Page |
|---|---|
| `home/` | https://stripe.com/en-nl, with `desktop-sections.webm` (4 seconds per section, including the moving integrations flow chart) and the earlier `desktop-scroll.webm` |
| `customer-supabase/` | https://stripe.com/en-nl/customers/supabase |
| `customer-linear/` | https://stripe.com/en-nl/customers/linear |
| `customer-felyx/` | https://stripe.com/en-nl/customers/felyx (Dutch company) |
| `customer-figma/` | https://stripe.com/en-nl/customers/figma |
| `customer-klarna/` | https://stripe.com/en-nl/customers/klarna |

Each folder has `desktop-full.jpg`, `desktop-hero.png`, `mobile-full.jpg`,
`mobile-hero.png` and `page.html`, like the Axiom capture (whose full-page
shots are PNG).
