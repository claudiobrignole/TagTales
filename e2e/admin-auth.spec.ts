import { test, expect } from '@playwright/test';
import {
  isDevAdminLoginAvailable,
  loginAsDevAdmin,
  logoutFromApp,
} from './helpers';

const ADMIN_MENU = [
  'Dashboard',
  'Vendite',
  'Utenti',
  'Writers',
  'Mostre',
  'Magazine',
  'SEO',
  'Mailing List',
  'Assistenza',
] as const;

test.describe('Admin auth (dev)', () => {
  test.beforeEach(async ({ request }, testInfo) => {
    const available = await isDevAdminLoginAvailable(request);
    testInfo.skip(!available, 'Dev admin login requires serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_BASE64');
  });

  test('dev login → admin dashboard → logout', async ({ page }) => {
    await loginAsDevAdmin(page);

    await expect(page.getByRole('heading', { name: /Dashboard Amministratore/i })).toBeVisible();
    for (const item of ADMIN_MENU) {
      await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
    }

    await logoutFromApp(page);
    await expect(page.getByRole('button', { name: 'Dev: accedi come admin' })).toBeVisible();
  });

  test('protected /app/admin redirects to login when logged out', async ({ page }) => {
    await page.goto('/app/admin');
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });

  test('admin can open Mostre and Utenti sections', async ({ page }) => {
    await loginAsDevAdmin(page);

    await page.getByRole('link', { name: 'Mostre', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/admin\/exhibitions/);

    await page.getByRole('link', { name: 'Utenti', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/admin\/users/);

    await logoutFromApp(page);
  });
});
