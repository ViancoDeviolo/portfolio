import { test, expect, type Locator, type Page } from '@playwright/test';

const headerH = async (page: Page) => (await page.locator('header').boundingBox())!.height;
// Clica nas coordenadas do link: o click() do Playwright rola o cabeçalho fixo e perde a posição.
const press = async (page: Page, l: Locator) => {
  const b = (await l.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
};
// Alinha a seção ao topo (respeitando o scroll-padding), como uma âncora.
// Imagens lazy acima da seção mudam o layout depois do primeiro scroll; alinha de novo após a rede assentar.
const toTop = async (page: Page, id: string) => {
  const go = () => page.evaluate((i) => document.getElementById(i)!.scrollIntoView(), id);
  await go();
  await page.waitForLoadState('networkidle');
  await go();
};
// A caixa do título tem de começar abaixo do cabeçalho fixo. Com poll: fontes e imagens lazy ainda podem mexer no layout (Firefox).
const clearsHeader = async (page: Page, sel: string) => {
  const h = await headerH(page);
  await expect.poll(async () => (await page.locator(sel).first().boundingBox())!.y).toBeGreaterThanOrEqual(h);
};
// Foco por teclado num link que está meio escondido sob o cabeçalho: Shift+Tab a partir do elemento seguinte.
// Sem o scripts/focus.ts o Firefox deixa o link onde está (já aparece em parte); o teste falha.
const shiftTabUnderHeader = async (page: Page, sel: string) => {
  const target = page.locator(sel).first();
  await target.evaluate((t) => {
    const all = [...document.querySelectorAll<HTMLElement>('a[href], button:not([hidden]), video[controls]')];
    all[all.indexOf(t as HTMLElement) + 1].focus({ preventScroll: true });
    const h = document.querySelector('header')!.offsetHeight;
    scrollBy(0, t.getBoundingClientRect().top - h / 2); // topo do link na metade do cabeçalho
  });
  await page.keyboard.press('Shift+Tab');
  await expect(target).toBeFocused();
  await clearsHeader(page, `${sel}:focus`);
};


test('troca de idioma mantém a seção visível', async ({ page }) => {
  await page.goto('/');
  await toTop(page, 'about');
  await press(page, page.locator('header').getByRole('link', { name: 'English version' }));
  await expect(page).toHaveURL(/\/en\/#about$/);
  await expect(page.locator('#about')).toBeInViewport();
  await clearsHeader(page, '#about h2');
});

test('troca numa seção do meio mantém a seção e o título livre', async ({ page }) => {
  await page.goto('/');
  await toTop(page, 'workflow');
  await press(page, page.locator('header').getByRole('link', { name: 'English version' }));
  await expect(page).toHaveURL(/\/en\/#workflow$/);
  await clearsHeader(page, '#workflow h2');
});

test('foco por teclado não fica sob o cabeçalho', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await shiftTabUnderHeader(page, '#ai a');
});

for (const base of ['/', '/en/'])
  test(`${base}: a 320px com fonte a 200% o cabeçalho segue em uma linha, cabe na tela e libera âncoras`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(base);
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    const h = await headerH(page);
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    const name = (await page.locator('header .name').boundingBox())!;
    const link = (await page.locator('header [data-lang-switch]').boundingBox())!;
    expect(name.x + name.width).toBeLessThanOrEqual(link.x);
    expect(link.y + link.height).toBeLessThanOrEqual(h);
    expect(link.x + link.width).toBeLessThanOrEqual(width);
    await page.goto(`${base}#about`);
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await page.evaluate(() => document.getElementById('about')!.scrollIntoView());
    await clearsHeader(page, '#about h2');
    await shiftTabUnderHeader(page, '#ai a');
  });

test('troca pelo rodapé também mantém a seção', async ({ page }) => {
  await page.goto('/');
  await toTop(page, 'contact');
  await press(page, page.locator('footer').getByRole('link', { name: 'English version' }));
  await expect(page).toHaveURL(/\/en\/#contact$/);
});

test('no topo a troca vai para a raiz do outro idioma', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('header').getByRole('link', { name: 'Versão em português' }).click();
  await expect(page).toHaveURL(/localhost:4321\/$/);
});

test('troca em página legal vai para a contraparte', async ({ page }) => {
  await page.goto('/en/privacy/');
  await page.locator('header').getByRole('link', { name: 'Versão em português' }).click();
  await expect(page).toHaveURL(/\/privacidade\/$/);
  await page.locator('footer').getByRole('link', { name: 'Termos de uso' }).click();
  await expect(page).toHaveURL(/\/termos\/$/);
  await page.locator('header').getByRole('link', { name: 'English version' }).click();
  await expect(page).toHaveURL(/\/en\/terms\/$/);
});

test('contato da política monta o e-mail', async ({ page }) => {
  await page.goto('/privacidade/');
  await expect(page.locator('main a.email').first()).toHaveAttribute('href', /^mailto:.+@.+/);
});
