import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export const SITE_URL = 'https://lucas-alves-cruz.pages.dev';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  integrations: [react()],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
