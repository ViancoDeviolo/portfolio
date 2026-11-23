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
// A caixa do título tem de começar abaixo do cabeçalho fixo.
const clearsHeader = async (page: Page, sel: string) => {
  const box = (await page.locator(sel).first().boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(await headerH(page));
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
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.locator('#ai a').first().focus();
  await clearsHeader(page, '#ai a:focus');
});

test('a 320px com fonte a 200% o cabeçalho segue em uma linha e libera âncoras', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const h = await headerH(page);
  const name = (await page.locator('header .name').boundingBox())!;
  const link = (await page.locator('header [data-lang-switch]').boundingBox())!;
  expect(name.x + name.width).toBeLessThanOrEqual(link.x);
  expect(link.y + link.height).toBeLessThanOrEqual(h);
  await page.goto('/#about');
  await clearsHeader(page, '#about h2');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.locator('#ai a').first().focus();
  await clearsHeader(page, '#ai a:focus');
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
