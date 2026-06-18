import { test, expect } from '@playwright/test';

const exhibitionSlug = process.env.E2E_PREVIEW_EXHIBITION_SLUG;
const previewToken = process.env.E2E_PREVIEW_TOKEN;

test.describe('Preview API', () => {
  test('rejects invalid preview token', async ({ request }) => {
    const res = await request.get(
      '/api/preview/exhibition/non-existent-slug?token=invalid-token',
    );
    expect(res.status()).toBe(404);
  });

  test('returns content with valid token when E2E_PREVIEW_* is set', async ({ request }) => {
    test.skip(!exhibitionSlug || !previewToken, 'Set E2E_PREVIEW_EXHIBITION_SLUG and E2E_PREVIEW_TOKEN');

    const res = await request.get(
      `/api/preview/exhibition/${exhibitionSlug}?token=${previewToken}`,
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.slug || body.id).toBeTruthy();
    expect(body.previewToken).toBeUndefined();
  });
});

test.describe('Preview UI', () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(!exhibitionSlug || !previewToken, 'Set E2E_PREVIEW_EXHIBITION_SLUG and E2E_PREVIEW_TOKEN');
  });

  test('unpublished slug without token shows not found', async ({ page }) => {
    await page.goto(`/exhibitions/${exhibitionSlug}`);
    await expect(page.getByRole('heading', { name: /Mostra non trovata/i })).toBeVisible();
  });

  test('preview URL shows private banner', async ({ page }) => {
    await page.goto(`/exhibitions/${exhibitionSlug}?preview=${previewToken}`);
    await expect(page.getByText(/Anteprima privata/i)).toBeVisible();
  });
});
