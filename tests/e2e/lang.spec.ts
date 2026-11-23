import { test, expect } from '@playwright/test';

test('troca de idioma mantém a seção visível', async ({ page }) => {
  await page.goto('/');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.locator('header').getByRole('link', { name: 'English version' }).click();
  await expect(page).toHaveURL(/\/en\/#about$/);
  await expect(page.locator('#about')).toBeInViewport();
});

test('troca pelo rodapé também mantém a seção', async ({ page }) => {
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.locator('footer').getByRole('link', { name: 'English version' }).click();
  await expect(page).toHaveURL(/\/en\/#contact$/);
});

test('no topo a troca vai para a raiz do outro idioma', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('header').getByRole('link', { name: 'Versão em português' }).click();
  await expect(page).toHaveURL(/localhost:4321\/$/);
});

// Páginas legais chegam na Task 11.
test.fixme('troca em página legal vai para a contraparte', async ({ page }) => {
  await page.goto('/en/privacy/');
  await page.getByRole('link', { name: 'Versão em português' }).click();
  await expect(page).toHaveURL(/\/privacidade\/$/);
});
