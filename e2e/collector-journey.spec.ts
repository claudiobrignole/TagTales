import { test, expect } from '@playwright/test';

test.describe('Collector journey', () => {
  test('home → exhibitions → writers → magazine in ≤4 clicks', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'MOSTRE', exact: true }).first().click();
    await expect(page).toHaveURL(/\/exhibitions/);
    await expect(page.getByRole('link', { name: 'VISITA LA MOSTRA' })).toBeVisible();

    await page.getByRole('link', { name: 'WRITERS', exact: true }).first().click();
    await expect(page).toHaveURL(/\/writers/);

    await page.getByRole('link', { name: 'MAGAZINE', exact: true }).first().click();
    await expect(page).toHaveURL(/\/magazine/);
    await expect(page.getByRole('link').filter({ hasText: /INK|PHASE|HARLEM|SCRITTO/i }).first()).toBeVisible();
  });

  test('magazine article detail opens from list', async ({ page }) => {
    await page.goto('/magazine');
    const firstArticle = page.getByRole('link').filter({ hasText: /INK & BEATS|PHASE 2|HARLEM|SCRITTO/i }).first();
    await firstArticle.click();
    await expect(page).not.toHaveURL(/\/magazine\/?$/);
    await expect(page.locator('article, main, .prose').first()).toBeVisible();
  });

  test('assistenza chatbot FAQ is interactive', async ({ page }) => {
    await page.goto('/assistenza');
    await expect(page.getByRole('heading', { name: /Assistenza/i })).toBeVisible();

    const faq = page.getByRole('button', { name: /Come funziona Tag Tales/i });
    await faq.click();
    await expect(page.getByPlaceholder(/Scrivi qui la tua richiesta/i)).toBeVisible();
  });
});
