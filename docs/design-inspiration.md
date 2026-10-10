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
| `desktop-scroll.webm` | Video: the hero for 6 seconds, then a slow scroll down, so the moving elements are kept |
| `page.html` | The rendered HTML of the page (text and structure; styles and images still load from axiom.co) |
