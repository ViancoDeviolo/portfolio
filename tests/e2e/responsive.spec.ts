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

test('na impressão o contato mostra o endereço inteiro do LinkedIn e do GitHub', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const printed = await page.locator('#contact a[href^="https://"]').evaluateAll((as) =>
    as.map((a) => ({ href: (a as HTMLAnchorElement).getAttribute('href'), after: getComputedStyle(a, '::after').content })),
  );
  expect(printed.length).toBe(2);
  for (const p of printed) expect(p.after).toBe(`"${p.href}"`);
});

test('320: os números-link das evidências têm área de toque de 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const links = page.locator('.evidence dd a');
  expect(await links.count()).toBeGreaterThan(0);
  for (const a of await links.all()) {
    const hits = await a.evaluate((el) => {
      el.scrollIntoView({ block: 'center' }); // longe do cabeçalho fixo, que cobriria o ponto de cima
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      return [y - 21, y + 21].map((yy) => el.contains(document.elementFromPoint(x, yy)));
    });
    expect(hits).toEqual([true, true]);
  }
});

// Títulos em tipo gigante: cada palavra cabe inteira na coluna, sem quebra no meio e sem rolagem.
for (const vp of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 360, height: 800 }])
  for (const base of ['/', '/en/'])
    test(`${vp.width} ${base}: nenhuma palavra dos títulos quebra no meio`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      await noHScroll(page);
      // Sem quebra forçada, uma palavra larga demais transborda a linha: é isso que se mede.
      const over = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.title > span')].flatMap((s) => {
          s.style.overflowWrap = 'normal';
          s.style.wordBreak = 'normal';
          return s.scrollWidth > s.clientWidth + 1 ? [`${s.textContent} ${s.scrollWidth}>${s.clientWidth}`] : [];
        }),
      );
      expect(over).toEqual([]);
    });
