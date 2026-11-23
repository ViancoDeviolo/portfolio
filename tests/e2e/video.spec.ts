import { test, expect, type Page } from '@playwright/test';

const paused = (page: Page, i: number) => page.locator('video[data-autoplay]').nth(i).evaluate((v: HTMLVideoElement) => v.paused);
const show = (page: Page, i: number) =>
  page.locator('video[data-autoplay]').nth(i).evaluate((v) => v.scrollIntoView({ block: 'center' }));
const away = (page: Page) => page.evaluate(() => scrollTo(0, 0));

for (const base of ['/', '/en/']) {
  test.describe(base, () => {
    test('reduced-motion desde o início: nenhum vídeo toca, botão de play presente', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(base);
      const n = await page.locator('video[data-autoplay]').count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) {
        await show(page, i);
        await page.waitForTimeout(150);
        expect(await paused(page, i)).toBe(true);
        const btn = page.locator('.video-toggle').nth(i);
        await expect(btn).toBeVisible();
        await expect(btn).toHaveAttribute('aria-pressed', 'true');
      }
    });

    test('fora da tela fica pausado; na tela toca; ao sair pausa', async ({ page }) => {
      await page.goto(base);
      await page.waitForTimeout(300);
      expect(await paused(page, 0)).toBe(true);
      await show(page, 0);
      await expect.poll(() => paused(page, 0)).toBe(false);
      await away(page);
      await expect.poll(() => paused(page, 0)).toBe(true);
      await show(page, 0);
      await expect.poll(() => paused(page, 0)).toBe(false);
    });

    test('reduced-motion ligado no meio da sessão pausa e não volta sozinho', async ({ page }) => {
      await page.goto(base);
      await show(page, 0);
      await expect.poll(() => paused(page, 0)).toBe(false);
      // emulateMedia depois do load dispara o "change" do matchMedia: exercita o listener real.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect.poll(() => paused(page, 0)).toBe(true);
      await expect(page.locator('.video-toggle').first()).toHaveAttribute('aria-pressed', 'true');
      await away(page);
      await show(page, 0);
      await page.waitForTimeout(400);
      expect(await paused(page, 0)).toBe(true);
    });

    test('pausa manual não volta sozinha ao rolar de volta', async ({ page }) => {
      await page.goto(base);
      await show(page, 0);
      await expect.poll(() => paused(page, 0)).toBe(false);
      await page.locator('.video-toggle').first().click();
      await expect.poll(() => paused(page, 0)).toBe(true);
      await away(page);
      await show(page, 0);
      await page.waitForTimeout(400);
      expect(await paused(page, 0)).toBe(true);
    });
  });
}
