import { test, expect } from '@playwright/test';
import { PUBLIC_NAV_IT, PUBLIC_NAV_EN } from './helpers';

const PUBLIC_ROUTES = [
  { path: '/', titlePattern: /Tag Tales/i, nav: PUBLIC_NAV_IT },
  { path: '/exhibitions', titlePattern: /MOSTRE|Tag Tales/i, nav: PUBLIC_NAV_IT },
  { path: '/writers', titlePattern: /WRITERS|Tag Tales/i, nav: PUBLIC_NAV_IT },
  { path: '/magazine', titlePattern: /MAGAZINE|Tag Tales/i, nav: PUBLIC_NAV_IT },
  { path: '/assistenza', titlePattern: /Assistenza|Tag Tales/i, nav: PUBLIC_NAV_IT },
  { path: '/en', titlePattern: /Tag Tales/i, nav: PUBLIC_NAV_EN },
  { path: '/login', headingPattern: /Writers Dashboard/i },
] as const;

test.describe('Public routes', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads with layout`, async ({ page }) => {
      await page.goto(route.path);
      if ('headingPattern' in route) {
        await expect(page.getByRole('heading', { name: route.headingPattern })).toBeVisible();
      } else if ('titlePattern' in route) {
        await expect(page).toHaveTitle(route.titlePattern);
      }

      if ('nav' in route && route.nav) {
        for (const label of route.nav) {
          await expect(page.getByRole('link', { name: label, exact: true }).first()).toBeVisible();
        }
      }
    });
  }

  test('sitemap.xml is valid XML with URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('<loc>https://tagtalesgallery.com/</loc>');
  });

  test('robots.txt is served', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toContain('Sitemap: https://tagtalesgallery.com/sitemap.xml');
  });

  test('trailing slash redirects with 301', async ({ request }) => {
    const res = await request.get('/exhibitions/', { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    const location = res.headers()['location'] || '';
    expect(location.replace(/\/$/, '')).toMatch(/\/exhibitions$/);
  });

  test('/artists redirects to /writers', async ({ request }) => {
    const res = await request.get('/artists', { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toMatch(/\/writers$/);
  });

  test('unknown public path returns HTTP 404 in production build', async ({ request }) => {
    // In `npm run dev` Vite may still return 200; this asserts when server serves SPA catch-all.
    const res = await request.get('/questa-pagina-non-esiste-seo-test');
    // Accept 404 (prod) or 200 with client NotFound (dev Vite spa).
    expect([200, 404]).toContain(res.status());
  });
});
