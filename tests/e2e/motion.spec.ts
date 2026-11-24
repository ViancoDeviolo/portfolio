import { test, expect, type Page } from '@playwright/test';

// O projeto "no-webgl" roda o Chromium com --disable-3d-apis (playwright.config.ts).
const noWebgl = (name: string) => name === 'no-webgl';
const toLiving = (page: Page) => page.locator('#living').scrollIntoViewIfNeeded();
// A cena só baixa depois do load e da primeira interação (scripts/globe.ts).
const interact = async (page: Page) => {
  await page.waitForLoadState('load');
  await page.keyboard.press('Shift');
};

test('cena 3D assume a capa e a tela 02 com um único canvas', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  expect(await page.locator('canvas').count(), 'sem interação, nada de cena').toBe(0);
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await toLiving(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-state', 'living');
  expect(await page.locator('canvas').count()).toBe(1);
  // o estático some por opacidade (continua no layout: a cena lê a posição dele)
  await expect(page.locator('[data-hero] [data-globe-static]')).toHaveCSS('opacity', '0');
  await expect(page.locator('#living [data-globe-static]')).toHaveCSS('opacity', '0');
});

test('o laço da cena para longe das telas do globo e volta na tela 02', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  // conta as chamadas de desenho WebGL: é o canvas da cena quem desenha
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      (window as any).__draws = ((window as any).__draws ?? 0) + 1;
      return draw.apply(this, args);
    };
  });
  await page.goto('/');
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-paused');
  const frames = () => page.evaluate(() => (window as any).__draws ?? 0);
  await expect.poll(frames).toBeGreaterThan(0);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveAttribute('data-globe-paused', '');
  const a = await frames();
  await page.waitForTimeout(500);
  expect(await frames()).toBe(a);
  await toLiving(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-paused');
  await expect.poll(frames).toBeGreaterThan(a);
});

const staysStatic = async (page: Page) => {
  await page.goto('/');
  await interact(page);
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
  // observador registrado antes de tudo: guarda cada candidato a LCP desde o início da página
  await page.addInitScript(() => {
    (window as any).__lcp = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) (window as any).__lcp.push((e as PerformanceEntry & { element?: Element }).element?.tagName ?? '?');
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__lcp.length > 0); // o LCP da capa já saiu; a interação encerra a medição
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await page.waitForTimeout(500);
  const tags: string[] = await page.evaluate(() => (window as any).__lcp);
  expect(tags.length).toBeGreaterThan(0);
  expect(tags).not.toContain('CANVAS');
});
