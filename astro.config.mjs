import { defineConfig } from 'astro/config';

export const SITE_URL = 'https://lucas-alves-cruz.pages.dev';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
