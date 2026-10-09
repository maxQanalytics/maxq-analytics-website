import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, UNLISTED_PATHS, PREVIEW_EDITION } from './src/seo.mjs';

export default defineConfig({
  site: SITE_URL,
  integrations: [
    tailwind(),
    // The sitemap lists the pages linked from the nav and footer. Preview
    // editions (noindex) and unlisted add-on pages are left out.
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !PREVIEW_EDITION.test(path) && !UNLISTED_PATHS.includes(path);
      },
    }),
  ],
});
