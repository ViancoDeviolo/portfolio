import { test, expect } from '@playwright/test';

const PAGES = ['/', '/en/', '/privacidade/', '/en/privacy/', '/termos/', '/en/terms/'];

for (const base of ['/', '/en/']) {
  test(`${base}: metade casual leva a Fundamentos`, async ({ page }) => {
    await page.goto(base);
    await page.getByRole('link', { name: /Fundamentos|Fundamentals/ }).first().click();
    await expect(page).toHaveURL(/#fundamentals$/);
    await expect(page.locator('#fundamentals')).toBeInViewport();
  });

  test(`${base}: metade de terno leva a Engenharia com IA`, async ({ page }) => {
    await page.goto(base);
    await page.getByRole('link', { name: /Engenharia com IA|AI engineering/ }).first().click();
    await expect(page).toHaveURL(/#ai$/);
    await expect(page.locator('#ai')).toBeInViewport();
  });
}

// Só HTTP: independe do navegador, roda num projeto.
test('todos os links internos respondem 200', async ({ page, request, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || isMobile, 'checagem HTTP, igual em qualquer navegador');
  const hrefs = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    for (const h of await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href)))
      if (new URL(h).origin === new URL(page.url()).origin) hrefs.add(h.split('#')[0]);
  }
  expect([...hrefs]).toEqual(expect.arrayContaining(['/lucas-cruz-cv.pdf', '/lucas-cruz-cv-en.pdf'].map((p) => new URL(p, page.url()).href)));
  const bad: string[] = [];
  for (const h of hrefs) {
    const res = await request.get(h);
    if (res.status() !== 200) bad.push(`${res.status()} ${h}`);
  }
  expect(bad).toEqual([]);
});
