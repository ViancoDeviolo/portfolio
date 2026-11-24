import { test, expect, type Page } from '@playwright/test';

// O projeto "no-webgl" roda o Chromium com --disable-3d-apis (playwright.config.ts).
const noWebgl = (name: string) => name === 'no-webgl';
const toLiving = (page: Page) => page.locator('#living').scrollIntoViewIfNeeded();

test('cena 3D assume a capa e a tela 02 com um único canvas', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await toLiving(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-state', 'living');
  expect(await page.locator('canvas').count()).toBe(1);
  // o estático some por opacidade (continua no layout: a cena lê a posição dele)
  await expect(page.locator('[data-hero] [data-globe-static]')).toHaveCSS('opacity', '0');
  await expect(page.locator('#living [data-globe-static]')).toHaveCSS('opacity', '0');
});

const staysStatic = async (page: Page) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500); // tempo de sobra para a cena tentar montar
  await toLiving(page);
  await page.waitForTimeout(500);
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-live');
  await expect(page.locator('#living [data-globe-static]')).toBeVisible();
  await expect(page.locator('#living [data-globe-static]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('[data-hero] [data-globe-static]')).toBeVisible();
  await expect(page.locator('[data-hero] [data-globe-static]')).toHaveCSS('opacity', '1');
};

test('movimento reduzido: sem canvas, globo estático visível', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await staysStatic(page);
});

test('sem WebGL: sem canvas, globo estático visível', async ({ page }, info) => {
  test.skip(!noWebgl(info.project.name));
  await staysStatic(page);
});

test('o LCP da capa não é o canvas', async ({ page, browserName }, info) => {
  test.skip(noWebgl(info.project.name) || browserName !== 'chromium', 'LCP só no Chromium');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await page.waitForTimeout(500);
  const tags = await page.evaluate(
    () =>
      new Promise<string[]>((resolve) =>
        new PerformanceObserver((l) =>
          resolve(l.getEntries().map((e) => (e as PerformanceEntry & { element?: Element }).element?.tagName ?? '?')),
        ).observe({ type: 'largest-contentful-paint', buffered: true }),
      ),
  );
  expect(tags.length).toBeGreaterThan(0);
  expect(tags).not.toContain('CANVAS');
});
