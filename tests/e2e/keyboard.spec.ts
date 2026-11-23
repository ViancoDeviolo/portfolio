import { test, expect, type Page } from '@playwright/test';

const PAGES = ['/', '/en/', '/privacidade/', '/en/privacy/', '/termos/', '/en/terms/'];

const active = (page: Page) =>
  page.evaluate(() => {
    const e = document.activeElement!;
    const r = e.getBoundingClientRect();
    return {
      desc: `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${e.className} ${(e.textContent ?? '').trim().slice(0, 30)}`,
      body: e === document.body,
      inHeader: !!e.closest('header'),
      last: e.matches('footer [data-lang-switch]'),
      outline: getComputedStyle(e).outlineStyle,
      // Tab dentro dos controles nativos do <video>: o foco real está na shadow DOM do navegador,
      // que desenha o próprio anel; o host continua como activeElement sem :focus-visible.
      inControls: e.tagName === 'VIDEO' && !e.matches(':focus-visible'),
      top: r.top,
      bottom: r.bottom,
    };
  });

for (const path of PAGES)
  test(`${path}: skip link, foco visível e Tab sem armadilha`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    // Volta ao início e percorre tudo: tem de chegar ao último link do rodapé, sempre com contorno visível.
    await page.locator('.skip-link').focus();
    const budget = 3 * (await page.locator('a[href], button:not([hidden]), summary, video[controls]').count()) + 5;
    let reached = false;
    let prev = '';
    for (let i = 0; i < budget && !reached; i++) {
      await page.keyboard.press('Tab');
      const a = await active(page);
      expect(a.body, `foco perdido no passo ${i}, antes: ${prev}`).toBe(false);
      prev = a.desc + (a.inControls ? ' (controles)' : '');
      if (!a.inControls) expect(a.outline, `sem contorno: ${a.desc}`).not.toBe('none');
      reached = a.last;
    }
    expect(reached, 'Tab não chegou ao fim da página').toBe(true);
  });

for (const base of ['/', '/en/'])
  test(`${base}: foco por Tab e Shift+Tab nunca fica sob o cabeçalho nem abaixo da tela`, async ({ page }) => {
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    const headerH = (await page.locator('header').boundingBox())!.height;
    const vh = page.viewportSize()!.height;
    const check = async (key: string, i: number) => {
      await page.keyboard.press(key);
      const a = await active(page);
      if (a.inHeader || a.body) return;
      if (a.inControls) {
        // a caixa do controle interno não é visível ao teste; ao menos o vídeo tem de estar na área livre
        expect(a.bottom, `${key} ${i}: vídeo sob o cabeçalho`).toBeGreaterThan(headerH);
        expect(a.top, `${key} ${i}: vídeo abaixo da tela`).toBeLessThan(vh);
        return;
      }
      expect(a.top, `${key} ${i}: ${a.desc} sob o cabeçalho`).toBeGreaterThanOrEqual(headerH - 1);
      expect(a.bottom, `${key} ${i}: ${a.desc} abaixo da tela`).toBeLessThanOrEqual(vh + 1);
    };
    for (let i = 0; i < 30; i++) await check('Tab', i);
    for (let i = 0; i < 30; i++) await check('Shift+Tab', i);
  });

for (const base of ['/', '/en/'])
  test(`${base}: botão redondo do vídeo tem anel de foco`, async ({ page }) => {
    await page.goto(base);
    const btn = page.locator('.video-toggle').first();
    await expect(btn).toBeVisible();
    // Chega por teclado: Tab a partir do elemento anterior (o vídeo) ativa o :focus-visible de verdade.
    await page.locator('video[data-autoplay]').first().focus();
    for (let i = 0; i < 10 && !(await btn.evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(btn).toBeFocused();
    const o = await btn.evaluate((b) => {
      const s = getComputedStyle(b);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(o.style).not.toBe('none');
    expect(o.width).toBeGreaterThan(0);
  });
