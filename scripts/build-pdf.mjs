// Gera os PDFs de uma página a partir das próprias páginas (print.css), depois do astro build.
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const PAGES = { '/': 'dist/lucas-cruz-cv.pdf', '/en/': 'dist/lucas-cruz-cv-en.pdf' };

const server = await preview({ root: '.', logLevel: 'warn', server: { host: '127.0.0.1', port: 4399 } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  for (const [route, path] of Object.entries(PAGES)) {
    await page.goto(`http://127.0.0.1:${server.port}${route}`, { waitUntil: 'networkidle' });
    await page.locator('a.email:not([hidden])').waitFor(); // o JS monta o e-mail
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ format: 'A4', printBackground: false, path });
    console.log(`PDF: ${path}`);
  }
} finally {
  await browser.close();
  await server.stop();
}
