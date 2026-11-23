import { test, expect, type Page } from '@playwright/test';

const PAGES = ['/', '/en/', '/privacidade/', '/en/privacy/', '/termos/', '/en/terms/'];
// 640×800 é o que uma tela de 1280×1600 mostra a 200% de zoom.
const VIEWPORTS = [{ width: 320, height: 640 }, { width: 640, height: 800 }];

const noHScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

for (const vp of VIEWPORTS)
  for (const path of PAGES)
    test(`${vp.width}×${vp.height} ${path}: sem rolagem horizontal`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await noHScroll(page);
    });

for (const base of ['/', '/en/']) {
  test(`320 ${base}: a dupla fica lado a lado`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(base);
    const [a, b] = await Promise.all(
      [0, 1].map(async (i) => (await page.locator('.duo .figure').nth(i).boundingBox())!),
    );
    expect(Math.abs(a.y - b.y)).toBeLessThan(1);
    expect(a.x + a.width).toBeLessThanOrEqual(b.x + 1);
    expect(b.x + b.width).toBeLessThanOrEqual(320);
  });
}
