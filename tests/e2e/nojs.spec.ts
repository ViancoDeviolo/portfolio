import { test, expect } from '@playwright/test';
import { SECTION_IDS } from '../../src/lib/i18n';

test.use({ javaScriptEnabled: false });

const cases = [
  { base: '/', other: '/en/', at: 'arroba' },
  { base: '/en/', other: '/', at: 'at' },
];

for (const { base, other, at } of cases) {
  test.describe(`${base} sem JS`, () => {
    test('as cinco telas aparecem com título e conteúdo', async ({ page }) => {
      await page.goto(base);
      for (const id of SECTION_IDS) {
        const s = page.locator(`#${id}`);
        await s.scrollIntoViewIfNeeded();
        await expect(s.locator('h2')).toBeVisible();
        expect((await s.innerText()).trim().length).toBeGreaterThan(40);
      }
    });

    test('cada etiqueta da tela 02 é um link visível que leva ao seu projeto', async ({ page }) => {
      await page.goto(base);
      const tags = page.locator('[data-living-tag]');
      expect(await tags.count()).toBe(7);
      for (const tag of await tags.all()) {
        await page.goto(base);
        await tag.scrollIntoViewIfNeeded();
        await expect(tag).toBeVisible();
        const href = (await tag.getAttribute('href'))!;
        expect(href).toMatch(/^#p-[a-z-]+$/);
        await tag.click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect(page.locator(href)).toBeInViewport();
      }
    });

    test('link de idioma vai para a raiz do outro idioma', async ({ page }) => {
      await page.goto(base);
      for (const where of ['header', 'footer'])
        await expect(page.locator(`${where} [data-lang-switch]`)).toHaveAttribute('href', other);
      await page.locator('header [data-lang-switch]').click();
      await expect(page).toHaveURL(new RegExp(`localhost:4321${other.replace(/\//g, '\\/')}$`));
    });

    test('e-mail legível pelo <noscript>', async ({ page }) => {
      await page.goto(base);
      const dd = page.locator('#contact [data-email]');
      await dd.scrollIntoViewIfNeeded();
      // toContainText ignora <noscript>; innerText só traz o que foi renderizado.
      expect(await dd.evaluate((d: HTMLElement) => d.innerText.trim())).toMatch(new RegExp(`^\\S+ \\[${at}\\] \\S+\\.\\S+$`));
      await expect(dd).toBeVisible();
      await expect(page.locator('#contact a.email')).toBeHidden();
    });

    test('vídeos mostram pôster e controles nativos, sem botão do script', async ({ page }) => {
      await page.goto(base);
      const videos = page.locator('video');
      expect(await videos.count()).toBeGreaterThan(0);
      for (const v of await videos.all()) {
        await expect(v).not.toHaveAttribute('poster');
        const img = v.locator('xpath=preceding-sibling::img[@class="poster"]');
        await expect(img).toHaveAttribute('src', /-poster\.webp$/);
        await v.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
        await expect(v).toHaveAttribute('controls', '');
        expect(await v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
      }
      await expect(page.locator('.video-toggle').first()).toBeHidden();
      // o pôster responde: sem isso o vídeo sem JS seria um retângulo vazio
      const poster = await page.locator('img.poster').first().getAttribute('src');
      expect((await page.request.get(poster!)).status()).toBe(200);
    });
  });
}
