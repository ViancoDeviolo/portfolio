import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

const SECTIONS = ['fundamentals', 'ai', 'workflow', 'stack', 'about', 'contact'];
const cases = [
  { base: '/', other: '/en/', at: 'arroba' },
  { base: '/en/', other: '/', at: 'at' },
];

for (const { base, other, at } of cases) {
  test.describe(`${base} sem JS`, () => {
    test('as seis seções aparecem com título e conteúdo', async ({ page }) => {
      await page.goto(base);
      for (const id of SECTIONS) {
        const s = page.locator(`#${id}`);
        await s.scrollIntoViewIfNeeded();
        await expect(s.locator('h2')).toBeVisible();
        expect((await s.innerText()).trim().length).toBeGreaterThan(40);
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
      const dd = page.locator('#contact dd').first();
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
