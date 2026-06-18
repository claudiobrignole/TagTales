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
  });
});
