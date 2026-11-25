import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export const SITE_URL = 'https://lucas-alves-cruz.pages.dev';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  // CSS embutido no HTML: tira duas idas à rede do caminho da capa (LCP no celular). A CSP aceita cada <style> só pelo
  // hash sha256 que scripts/csp-hashes.mjs põe no style-src; nunca 'unsafe-inline'.
  build: { inlineStylesheets: 'always' },
  integrations: [react()],
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
