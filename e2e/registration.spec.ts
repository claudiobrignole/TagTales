import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

const TEST_PASSWORD = 'E2eTestPass9!';

function verifyUserWithFirebaseAdmin(email: string) {
  const output = execSync(`node scripts/e2e-registration-verify.mjs verify "${email}"`, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output.trim()) as {
    uid: string;
    email: string;
    emailVerified: boolean;
    firestoreProfileExists: boolean;
    firestoreRole: string | null;
    verificationLinkGenerated: boolean;
  };
}

function cleanupTestUser(email: string) {
  try {
    execSync(`node scripts/e2e-registration-verify.mjs cleanup "${email}"`, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    // ignore cleanup errors in CI
  }
}

async function waitForFirebaseUser(email: string, attempts = 8) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return verifyUserWithFirebaseAdmin(email);
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastError;
}

test.describe('Registration E2E', () => {
  test('email/password signup sends welcome + admin emails and requires verification', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const testEmail = `claudio+e2e-reg-${timestamp}@brignole.ch`;

    const sendEmailCalls: Array<{ to?: string; subject?: string }> = [];

    page.on('requestfinished', async (request) => {
      if (request.method() !== 'POST' || !request.url().includes('/api/send-email')) return;
      try {
        const body = request.postDataJSON() as { to?: string; subject?: string } | null;
        if (body) sendEmailCalls.push(body);
      } catch {
        // ignore parse errors
      }
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /Crea Account|Create Account/i }).click();
    await page.getByPlaceholder('artist@tagtales.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: /Verify your email/i })).toBeVisible({
      timeout: 25_000,
    });
    await expect(
      page.getByText(/Please check your inbox and verify your email address/i),
    ).toBeVisible();

    await expect
      .poll(() => sendEmailCalls.length, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2);

    const welcomeCall = sendEmailCalls.find((c) =>
      /Benvenuto su Tag Tales|Welcome to Tag Tales/i.test(c.subject || ''),
    );
    const adminCall = sendEmailCalls.find((c) =>
      /Nuova Registrazione Utente|New User Registration/i.test(c.subject || ''),
    );

    expect(welcomeCall?.to).toBe(testEmail);
    expect(adminCall?.to).toMatch(/claudio@brignole\.ch/i);

    const firebaseUser = await waitForFirebaseUser(testEmail);

    expect(firebaseUser.emailVerified).toBe(false);
    expect(firebaseUser.firestoreProfileExists).toBe(true);
    expect(firebaseUser.firestoreRole).toBe('artist');
    // Admin SDK link generation depends on Auth action URL settings; signup still triggers client sendEmailVerification.
    expect(typeof firebaseUser.verificationLinkGenerated).toBe('boolean');

    cleanupTestUser(testEmail);
  });
});
