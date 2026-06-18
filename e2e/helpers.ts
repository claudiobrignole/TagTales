import type { APIRequestContext } from '@playwright/test';

export type DevAdminLoginResponse = {
  method: string;
  token?: string;
  email?: string;
  error?: string;
};

/** Returns true when Firebase Admin custom-token dev login is configured. */
export async function isDevAdminLoginAvailable(request: APIRequestContext): Promise<boolean> {
  const res = await request.post('/api/dev/admin-login');
  if (!res.ok()) return false;
  const body = (await res.json()) as DevAdminLoginResponse;
  return body.method === 'customToken' && Boolean(body.token);
}

/** Dev admin login via UI (requires serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_BASE64). */
export async function loginAsDevAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  const devButton = page.getByRole('button', { name: 'Dev: accedi come admin' });
  await devButton.waitFor({ state: 'visible' });
  await devButton.click();
  await page.waitForURL(/\/app\/admin/, { timeout: 20_000 });
}

/** Open user menu (avatar) and logout. */
export async function logoutFromApp(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('header button.h-10.w-10.rounded-full').click();
  await page.getByRole('button', { name: /Esci|Logout/i }).click();
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}

/** Public nav links in Header (Italian). */
export const PUBLIC_NAV_IT = ['HOME', 'MOSTRE', 'WRITERS', 'MAGAZINE', 'ASSISTENZA'] as const;

/** Public nav links in Header (English /en routes). */
export const PUBLIC_NAV_EN = ['HOME', 'EXHIBITIONS', 'WRITERS', 'MAGAZINE', 'SUPPORT'] as const;
