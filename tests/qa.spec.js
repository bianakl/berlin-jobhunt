import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function goTo(page, view) {
  // Works for both desktop sidebar buttons and mobile bottom nav
  const btn = page.locator(`button, a`).filter({ hasText: new RegExp(view, 'i') }).first();
  await btn.click();
}

// ─────────────────────────────────────────────
// 1. Page load & core structure
// ─────────────────────────────────────────────
test.describe('Page load', () => {
  test('loads without error', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Scout Berlin/i);
  });

  test('hard refresh (no cache) still loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('favicon is served', async ({ page }) => {
    const res = await page.request.get('/favicon.svg');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('svg');
  });
});

// ─────────────────────────────────────────────
// 2. Navigation
// ─────────────────────────────────────────────
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('Companies view loads by default', async ({ page }) => {
    // Default view is companies
    await expect(page.locator('text=/companies/i').first()).toBeVisible();
  });

  test('can navigate to Pipeline', async ({ page }) => {
    await page.getByRole('button', { name: /pipeline/i }).click();
    await expect(page.locator('text=/pipeline/i').first()).toBeVisible();
  });

  test('can navigate to Overview (Dashboard)', async ({ page }) => {
    await page.getByRole('button', { name: /overview/i }).click();
    await expect(page.locator('text=/overview/i').first()).toBeVisible();
  });

  test('can navigate to Profile', async ({ page }) => {
    await page.getByRole('button', { name: /profile/i }).click();
    await expect(page.locator('text=/profile/i').first()).toBeVisible();
  });

  test('all nav items are clickable without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (const view of ['Pipeline', 'Overview', 'Profile', 'Companies']) {
      await page.getByRole('button', { name: new RegExp(view, 'i') }).click();
      await page.waitForTimeout(300);
    }
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// 3. Companies view
// ─────────────────────────────────────────────
test.describe('Companies view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('shows at least one company card', async ({ page }) => {
    const cards = page.locator('[class*="rounded"]').filter({ hasText: /berlin|gmbh|ai|tech/i });
    await expect(cards.first()).toBeVisible();
  });

  test('"Add company" button is visible', async ({ page }) => {
    const btn = page.getByRole('button', { name: /add company/i });
    await expect(btn).toBeVisible();
  });

  test('Add company modal opens', async ({ page }) => {
    await page.getByRole('button', { name: /add company/i }).click();
    await expect(page.locator('text=/add company/i').nth(1)).toBeVisible();
  });

  test('Add company modal closes on X', async ({ page }) => {
    await page.getByRole('button', { name: /add company/i }).click();
    await page.locator('button').filter({ hasText: '' }).last().click(); // X button
    // Modal should be gone — check by waiting briefly
    await page.waitForTimeout(300);
    const modals = await page.locator('[style*="z-50"]').count();
    expect(modals).toBe(0);
  });

  test('Add company modal closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: /add company/i }).click();
    await page.mouse.click(10, 10); // click backdrop (top-left corner outside modal)
    await page.waitForTimeout(300);
    const modals = await page.locator('[style*="z-50"]').count();
    expect(modals).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 4. Job modal
// ─────────────────────────────────────────────
test.describe('Job modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('"Add job" button opens modal', async ({ page }) => {
    await page.getByRole('button', { name: /add job/i }).first().click();
    await expect(page.locator('text=/add job/i').nth(1)).toBeVisible();
  });

  test('job modal has required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add job/i }).first().click();
    await expect(page.getByPlaceholder(/senior product manager/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add to pipeline/i })).toBeVisible();
  });

  test('cannot save job without title', async ({ page }) => {
    await page.getByRole('button', { name: /add job/i }).first().click();
    await page.getByRole('button', { name: /add to pipeline/i }).click();
    // Modal should still be open (form validation)
    await expect(page.getByRole('button', { name: /add to pipeline/i })).toBeVisible();
  });

  test('can save a job with title', async ({ page }) => {
    await page.getByRole('button', { name: /add job/i }).first().click();
    await page.getByPlaceholder(/senior product manager/i).fill('QA Test Role');
    await page.getByRole('button', { name: /add to pipeline/i }).click();
    await page.waitForTimeout(400);
    // Modal should be closed
    await expect(page.getByRole('button', { name: /add to pipeline/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 5. Profile page
// ─────────────────────────────────────────────
test.describe('Profile page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);
  });

  test('profile page renders key sections', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: /basic info/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /^skills$/i })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: /portfolio/i })).toBeVisible();
  });

  test('portfolio section shows 3 project cards', async ({ page }) => {
    await expect(page.locator('text=/tamagotchi/i')).toBeVisible();
    await expect(page.locator('text=/pooping/i')).toBeVisible();
    await expect(page.locator('text=/recipe finder/i')).toBeVisible();
  });

  test('portfolio images load (no broken images)', async ({ page }) => {
    const images = page.locator('img[src*="/portfolio/"]');
    const count = await images.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('portfolio links open correct URLs', async ({ page, context }) => {
    const links = page.locator('a[href*="vercel.app"]');
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.href));
    expect(hrefs).toContain('https://tamagotchi-app-five.vercel.app/');
    expect(hrefs.some((h) => h.includes('pooping-com'))).toBeTruthy();
    expect(hrefs.some((h) => h.includes('recipe-finder'))).toBeTruthy();
  });

  test('"Save profile" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible();
  });

  test('sync section is visible', async ({ page }) => {
    await expect(page.locator('text=/cross-device sync/i')).toBeVisible();
  });

  test('danger zone is visible', async ({ page }) => {
    await expect(page.locator('text=/danger zone/i')).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 6. Dark mode
// ─────────────────────────────────────────────
test.describe('Dark mode', () => {
  test('dark mode toggle switches theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(300);

    const html = page.locator('html');
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    await page.getByRole('button', { name: /switch to (dark|light)/i }).click();
    await page.waitForTimeout(200);

    const isDark = await html.evaluate((el) => el.classList.contains('dark'));
    expect(isDark).toBe(!wasDark);

    // Toggle back
    await page.getByRole('button', { name: /switch to (dark|light)/i }).click();
  });
});

// ─────────────────────────────────────────────
// 7. Sync banner
// ─────────────────────────────────────────────
test.describe('Sync banner', () => {
  test('sync banner appears for unauthenticated users', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Banner should appear since no session in fresh browser
    await expect(page.locator('text=/sync|sign in|enable/i').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 8. API routes health check
// ─────────────────────────────────────────────
test.describe('API routes', () => {
  test('/api/analyze-job rejects unauthenticated requests with 401', async ({ page }) => {
    const res = await page.request.post('/api/analyze-job', {
      data: { jobTitle: 'PM', cvText: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('/api/cover-letter rejects unauthenticated requests with 401', async ({ page }) => {
    const res = await page.request.post('/api/cover-letter', {
      data: { jobTitle: 'PM', cvText: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('/api/extract-profile rejects unauthenticated requests with 401', async ({ page }) => {
    const res = await page.request.post('/api/extract-profile', {
      data: { cvText: 'test' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────
// 9. Mobile layout (iPhone 14 project runs these too)
// ─────────────────────────────────────────────
test.describe('Mobile layout', () => {
  test('mobile header is visible at narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Target the mobile-only header (md:hidden) which contains the Scout brand
    const mobileHeader = page.locator('.md\\:hidden').filter({ hasText: /scout/i }).first();
    await expect(mobileHeader).toBeVisible();
  });

  test('add job modal is bottom-sheet on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    // Mobile has a floating + button in the bottom nav (no text label)
    await page.locator('.md\\:hidden button.rounded-full').click();
    // Modal appears — verify the bottom-sheet shape (rounded top corners only on mobile)
    await expect(page.locator('.rounded-t-2xl').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 10. No JS console errors on main views
// ─────────────────────────────────────────────
test.describe('No console errors', () => {
  test('zero JS errors on page load and navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /pipeline/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /overview/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /profile/i }).click();
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
