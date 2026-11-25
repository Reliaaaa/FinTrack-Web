import { test, expect } from '@playwright/test';

test('keluar lalu gunakan mode lokal tidak membawa atau menyimpan data akun', async ({ page }) => {
  const accountData = {
    name: 'Pemilik Rahasia QA',
    wallets: [{ id: 'cash', name: 'Dompet Rahasia QA', type: 'cash', openingBalance: 100000, color: '#10b981' }],
    entries: [{ id: 'secret-entry', type: 'expense', amount: 25000, walletId: 'cash', category: 'Belanja', title: 'AKUN-RAHASIA-QA', date: '2026-11-25' }],
    budgets: [],
    recurring: [],
  };
  await page.context().route('**/api/v1/bootstrap', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, user: { id: '11111111-1111-4111-8111-111111111111', name: accountData.name }, version: '1', data: accountData }) }));
  await page.context().route('**/api/v1/auth/logout', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }));
  await page.goto('/transactions');
  await expect(page.getByText('AKUN-RAHASIA-QA')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fintrack-demo-v1'))).toBeNull();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Pengaturan' }).click();
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
  await page.getByRole('button', { name: 'Gunakan tanpa akun' }).click();
  await expect(page.getByText('Mode lokal.', { exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Transaksi' }).click();
  await expect(page.getByText('AKUN-RAHASIA-QA')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('fintrack-demo-v1'))).toBeNull();
  await page.getByRole('main').getByRole('button', { name: 'Catat Transaksi', exact: true }).click();
  await page.getByPlaceholder('Contoh: Belanja makan siang').fill('Transaksi demo QA');
  await page.getByLabel('Nominal rupiah').fill('10000');
  await page.getByRole('button', { name: 'Simpan Transaksi' }).click();
  const stored = await page.evaluate(() => localStorage.getItem('fintrack-demo-v1'));
  expect(stored).toContain('Transaksi demo QA');
  expect(stored).not.toContain('AKUN-RAHASIA-QA');
  expect(stored).not.toContain('Dompet Rahasia QA');
});

test('tab lama menyembunyikan data ketika sesi berpindah akun di tab lain', async ({ page }) => {
  const accountA = '11111111-1111-4111-8111-111111111111';
  const accountB = '22222222-2222-4222-8222-222222222222';
  let currentSession = accountA;
  let checks = 0;
  let releaseVerify: (() => void) | undefined;
  const data = {
    name: 'Akun A QA',
    wallets: [{ id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 100000, color: '#10b981' }],
    entries: [{ id: 'private', type: 'expense', amount: 1000, walletId: 'cash', category: 'Belanja', title: 'PRIVAT-A-QA', date: '2026-11-25' }],
    budgets: [],
    recurring: [],
  };
  await page.context().route('**/api/v1/bootstrap', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, user: { id: accountA, name: data.name }, version: '1', data }) }));
  await page.context().route('**/api/v1/auth/me', async route => {
    checks++;
    if (currentSession === accountB) await new Promise<void>(resolve => { releaseVerify = resolve; });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: currentSession } }) });
  });
  await page.goto('/transactions');
  await expect(page.getByText('PRIVAT-A-QA')).toBeVisible();
  const otherTab = await page.context().newPage();
  await otherTab.goto('/');
  await expect(otherTab.locator('h1').first()).toBeVisible();
  const checksBefore = checks;
  currentSession = accountB;
  await otherTab.evaluate(() => localStorage.setItem('fintrack-session-change', crypto.randomUUID()));
  await expect.poll(() => checks).toBeGreaterThan(checksBefore);
  try {
    await expect(page.getByText('Memeriksa sesi akun…')).toBeVisible();
    await expect(page.getByText('PRIVAT-A-QA')).toBeHidden();
  } finally { releaseVerify?.(); }
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
  await expect(page.getByText('PRIVAT-A-QA')).toHaveCount(0);
  await expect(page.getByText('Sesi akun berubah. Silakan masuk untuk melanjutkan.')).toBeVisible();
  await otherTab.close();
});
