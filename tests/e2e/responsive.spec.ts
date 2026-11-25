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
    // mede a posição final: a entrada da capa (Hero.astro) aproxima as fotos até encostarem
    await page.locator('.duo .figure').evaluateAll((els) => Promise.all(els.flatMap((e) => e.getAnimations().map((a) => a.finished))));
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
    const hits = await a.evaluate(async (el) => {
      el.scrollIntoView({ block: 'center' }); // longe do cabeçalho fixo, que cobriria o ponto de cima
      // a entrada com a rolagem (scripts/reveal.ts) desloca o bloco 1rem por 600 ms: mede depois que ela termina
      await new Promise(requestAnimationFrame);
      for (let n: Element | null = el; n; n = n.parentElement) await Promise.all(n.getAnimations().map((x) => x.finished));
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

// Celular e tablet (Task 11): a página inteira cabe na largura, nas duas línguas.
for (const width of [360, 390, 768])
  for (const base of ['/', '/en/'])
    test(`${width} ${base}: a página cabe na largura`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 1024 });
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

const settled = (page: Page) =>
  page.locator('.name > span, .duo .figure').evaluateAll((els) => Promise.all(els.flatMap((e) => e.getAnimations().map((a) => a.finished))));

for (const base of ['/', '/en/']) {
  test(`390 ${base}: na capa a divisa fica horizontal, amarelo em cima e laranja embaixo`, async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await settled(page);
    const png = (await page.locator('[data-hero]').screenshot({ animations: 'disabled' })).toString('base64');
    // Lê os pixels numa página em branco: a CSP do site não deixa carregar imagem data:.
    const blank = await context.newPage();
    const [top, bottom] = await blank.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const x = Math.round(img.width / 2);
      return [2, img.height - 3].map((y) => [...g.getImageData(x, y, 1, 1).data.slice(0, 3)]);
    }, png);
    const near = (rgb: number[], hex: number[]) => rgb.every((v, i) => Math.abs(v - hex[i]) <= 12);
    expect(near(top, [0xff, 0xc8, 0x3d]), `topo ${top}`).toBe(true);
    expect(near(bottom, [0xff, 0x5a, 0x1f]), `fim ${bottom}`).toBe(true);
  });

  for (const width of [360, 390])
    test(`${width} ${base}: o nome fica em duas linhas e cabe na largura`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      await settled(page);
      const [a, b] = await page.locator('.name > span').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      expect(b.top).toBeGreaterThan(a.top + a.height / 2);
      for (const r of [a, b]) {
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(width);
      }
    });

  test(`390 ${base}: a navegação aparece e cada pílula tem área de toque de 44 px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    const targets = page.locator('.site-header :is(.pill, .lang-switch)');
    expect(await targets.count()).toBe(5); // quatro pílulas e o PT / EN
    for (const t of await targets.all()) {
      await t.scrollIntoViewIfNeeded(); // a faixa das pílulas rola de lado se não couber
      await expect(t).toBeVisible();
      const hits = await t.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        return [y - 21, y + 21].map((yy) => el.contains(document.elementFromPoint(x, yy)));
      });
      expect(hits).toEqual([true, true]);
    }
  });
}
