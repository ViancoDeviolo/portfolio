import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// O preview não aplica o _headers do Cloudflare: injeta a CSP real, com os hashes (dist/_headers), nas respostas HTML e exige zero violações.
const csp = readFileSync('dist/_headers', 'utf8').match(/Content-Security-Policy:\s*(.+)/)![1].trim();

for (const path of ['/', '/en/privacy/']) {
  test(`CSP sem violações em ${path}`, async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => /content security policy|refused to/i.test(m.text()) && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(e.message));
    await page.route('**/*', async (route) => {
      const res = await route.fetch();
      const headers = res.headers();
      if ((headers['content-type'] ?? '').includes('text/html')) headers['content-security-policy'] = csp;
      await route.fulfill({ response: res, headers });
    });
    await page.addInitScript(() =>
      document.addEventListener('securitypolicyviolation', (e) =>
        ((window as any).__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`)));

    await page.goto(path);
    // sem esta prova a injeção poderia não ter acontecido
    const meta = await page.evaluate(async () => (await fetch(location.href)).headers.get('content-security-policy'));
    expect(meta).toBe(csp);
    // rola a página inteira para carregar imagens/vídeos lazy
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForLoadState('networkidle');
    if (path === '/') {
      expect(await page.locator('video').count()).toBeGreaterThan(0);
      expect(await page.locator('script[src]').count()).toBeGreaterThan(0);
      if (await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))) {
        await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
        expect(await page.locator('canvas').count()).toBe(1); // a cena 3D carregou sob a CSP real
      } else {
        // sem WebGL2 o certo é o globo estático (tests/e2e/motion.spec.ts)
        expect(await page.locator('canvas').count()).toBe(0);
        await expect(page.locator('[data-hero] [data-globe-static]')).toBeVisible();
      }
    }
    expect(await page.evaluate(() => (window as any).__csp ?? [])).toEqual([]);
    expect(problems).toEqual([]);
  });
}
