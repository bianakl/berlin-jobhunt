import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://wmdsumzgxutspogxmcjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZHN1bXpneHV0c3BvZ3htY2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTAzNTQsImV4cCI6MjA4NjQ4NjM1NH0.1GTeL1tNBH1hjClFM0bYAvBf22MS51fjuaq3EBKg_EA';

// ─────────────────────────────────────────────────────────────────────────────
// 1. RLS check — anon key must NOT be able to read any user data
// ─────────────────────────────────────────────────────────────────────────────
test('anon key cannot read scout_user_data (table invisible to unauthenticated requests)', async ({ request }) => {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/scout_user_data?select=id`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  // 404 = table not in schema cache for anon role (even better than RLS returning 0 rows)
  // 200 with rows = FAIL — data exposed to public
  // 200 with [] = acceptable (RLS blocks rows) but 404 is stronger
  const status = res.status();
  const body = await res.text();

  if (status === 200) {
    // If somehow 200, rows must be empty
    const rows = JSON.parse(body);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  } else {
    // 404 = table not exposed to anon at all — this is the correct/secure state
    expect(status).toBe(404);
    expect(body).toContain('PGRST205'); // PostgREST: table not in schema cache for this role
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Unauthenticated load makes ZERO data calls to Supabase
//    (Supabase JS v2 getSession() is local-only — no HTTP call without a session)
//    This confirms no data leaks on unauthenticated page load.
// ─────────────────────────────────────────────────────────────────────────────
test('unauthenticated load makes no data calls to Supabase (no leak on open)', async ({ page }) => {
  const supabaseDataCalls = [];

  page.on('request', (req) => {
    const url = req.url();
    // Track only REST data calls (not auth token refresh, not realtime WS)
    if (url.includes('supabase.co/rest/v1/')) {
      supabaseDataCalls.push(url);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  // With no session, the app must make ZERO REST calls to the data table.
  // Any call here would mean data is being fetched/exposed without auth.
  expect(supabaseDataCalls.length).toBe(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. If a session exists: verify data is in Supabase, NOT just localStorage
//    — clears all scout-* localStorage keys and confirms data is restored from cloud
// ─────────────────────────────────────────────────────────────────────────────
test('data survives full localStorage wipe — restored from Supabase', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Check if the user is authenticated
  const session = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!authKey) return null;
    try { return JSON.parse(localStorage.getItem(authKey)); } catch { return null; }
  });

  if (!session?.access_token) {
    console.log('  ⚠ Not authenticated — skipping cloud persistence test');
    test.skip();
    return;
  }

  // 1. Record what's currently in the app
  const beforeCompanies = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('scout-companies-v5') || '[]'); } catch { return []; }
  });

  if (beforeCompanies.length === 0) {
    console.log('  ⚠ No companies in localStorage — nothing to verify');
    test.skip();
    return;
  }

  // 2. Wipe ALL scout-* data keys (keep auth token)
  await page.evaluate(() => {
    const dataKeys = [
      'scout-jobs-v4',
      'scout-companies-v5',
      'scout-profile-v4',
      'scout-streak-v4',
      'scout-achievements-v4',
      'scout-cv-text',
      'scout-cv-name',
      'scout-market-value',
    ];
    dataKeys.forEach((k) => localStorage.removeItem(k));
  });

  // Confirm wipe worked
  const afterWipe = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('scout-companies-v5') || '[]')
  );
  expect(afterWipe.length).toBe(0);

  // 3. Reload — app should pull from Supabase
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // give sync time to complete

  // 4. Check data is back
  const afterReload = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('scout-companies-v5') || '[]'); } catch { return []; }
  });

  expect(afterReload.length).toBeGreaterThan(0);
  expect(afterReload.length).toBe(beforeCompanies.length);

  // Spot-check a specific company ID survived
  const beforeIds = new Set(beforeCompanies.map((c) => c.id));
  const afterIds   = new Set(afterReload.map((c) => c.id));
  const overlap    = [...beforeIds].filter((id) => afterIds.has(id));
  expect(overlap.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. If authenticated: verify the Supabase row actually exists and has data
//    — hits the DB directly using the user's JWT, bypasses localStorage entirely
// ─────────────────────────────────────────────────────────────────────────────
test('Supabase row exists and contains companies + profile data', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const session = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!authKey) return null;
    try { return JSON.parse(localStorage.getItem(authKey)); } catch { return null; }
  });

  if (!session?.access_token || !session?.user?.id) {
    console.log('  ⚠ Not authenticated — skipping direct DB verification');
    test.skip();
    return;
  }

  // Query Supabase directly with the user's JWT — no localStorage involved
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/scout_user_data?id=eq.${session.user.id}&select=id,companies,profile,updated_at`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  expect(res.status()).toBe(200);
  const rows = await res.json();

  // Row must exist
  expect(rows.length).toBe(1);
  const row = rows[0];

  // Companies must be saved
  expect(Array.isArray(row.companies)).toBe(true);
  expect(row.companies.length).toBeGreaterThan(0);

  // Profile must be saved
  expect(row.profile).not.toBeNull();

  // Must have been synced recently (within last 7 days)
  const updatedAt = new Date(row.updated_at);
  const daysSinceSync = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  expect(daysSinceSync).toBeLessThan(7);

  console.log(`  ✓ ${row.companies.length} companies in Supabase`);
  console.log(`  ✓ Last synced: ${updatedAt.toLocaleString()}`);
});
