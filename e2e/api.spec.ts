import { test, expect } from '@playwright/test';

test.describe('API integrations', () => {
  test('GET /api/config returns ecwid store id', async ({ request }) => {
    const res = await request.get('/api/config');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('ecwidStoreId');
    expect(String(body.ecwidStoreId).length).toBeGreaterThan(0);
  });

  test('POST /api/dev/admin-login returns custom token on localhost', async ({ request }) => {
    const res = await request.post('/api/dev/admin-login');
    if (res.status() === 503) {
      test.skip(true, 'Firebase Admin not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.method).toBe('customToken');
    expect(body.token).toBeTruthy();
    expect(body.email).toBe('claudio@brignole.ch');
  });

  test('GET /api/ecwid/products returns catalog items', async ({ request }) => {
    const res = await request.get('/api/ecwid/products');
    if (res.status() === 500) {
      test.skip(true, 'ECWID credentials not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  test('POST /api/translate translates text', async ({ request }) => {
    const res = await request.post('/api/translate', {
      data: { text: 'Ciao mondo', targetLanguages: ['en'] },
    });
    if (res.status() === 500) {
      test.skip(true, 'GEMINI_API_KEY not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.en).toMatch(/hello/i);
  });

  test('POST /api/assistance chatbot responds', async ({ request }) => {
    const res = await request.post('/api/assistance', {
      data: {
        messages: [{ role: 'user', text: 'What does Tag Tales Gallery sell?' }],
        mode: 'public',
        language: 'en',
      },
    });
    if (res.status() === 500) {
      test.skip(true, 'GEMINI_API_KEY not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.text.length).toBeGreaterThan(20);
  });

  test('POST /api/send-email validates required fields', async ({ request }) => {
    const res = await request.post('/api/send-email', { data: { to: 'a@b.com' } });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Missing required fields/i);
  });

  test('POST /api/send-email sends when E2E_SEND_EMAIL=1', async ({ request }) => {
    test.skip(process.env.E2E_SEND_EMAIL !== '1', 'Set E2E_SEND_EMAIL=1 to run live email test');

    const res = await request.post('/api/send-email', {
      data: {
        to: process.env.E2E_TEST_EMAIL || 'claudio@brignole.ch',
        subject: 'TagTales Playwright test',
        html: '<p>Automated E2E email test — ignore.</p>',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.provider).toBe('resend');
  });

  test('SendFox newsletter lists are reachable', async ({ request }) => {
    const res = await request.get('/api/newsletter/lists');
    if (res.status() === 500) {
      test.skip(true, 'SendFox not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.lists)).toBe(true);
  });

  test('GET /api/test-gemini health check', async ({ request }) => {
    const res = await request.get('/api/test-gemini');
    if (res.status() === 500) {
      test.skip(true, 'GEMINI_API_KEY not configured');
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
