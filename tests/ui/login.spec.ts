import { test, expect } from '@playwright/test';

test('login publik menjelaskan mode lokal dan menjaga transaksi saat kembali', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.route('**/api/v1/bootstrap', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: false }) }));
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Masuk ke FinTrack' })).toBeVisible();
  await expect(page.getByText('Akun online belum tersedia.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gunakan tanpa akun' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Alamat email' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Gunakan tanpa akun' }).click();
  await expect(page).toHaveURL(/\/\?mode=lokal$/);
  await expect(page.getByText('Mode lokal.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fintrack-demo-v1'))).toBeNull();
  await page.locator('.mobile-add').click();
  await page.getByPlaceholder('Contoh: Belanja makan siang').fill('Catatan lokal QA');
  await page.getByLabel('Nominal rupiah').fill('17000');
  await page.getByRole('button', { name: 'Simpan Transaksi' }).click();
  expect(await page.evaluate(() => localStorage.getItem('fintrack-demo-v1'))).toContain('Catatan lokal QA');
  await page.getByRole('link', { name: 'Masuk / Daftar' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Masuk ke FinTrack' })).toBeVisible();
  await page.getByRole('button', { name: 'Gunakan tanpa akun' }).click();
  await page.goto('/transactions');
  await expect(page.getByText('Catatan lokal QA')).toBeVisible();
});

test('route login langsung tidak melebar pada empat lebar layar', async ({ page }) => {
  await page.route('**/api/v1/bootstrap', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: false }) }));
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Masuk ke FinTrack' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('login dan daftar akun ditawarkan saat layanan akun tersedia', async ({ page }) => {
  const accountId = '11111111-1111-4111-8111-111111111111';
  const data = { name: 'UI Akun', wallets: [], entries: [], budgets: [], recurring: [] };
  let signedIn = false;
  await page.context().route('**/api/v1/bootstrap', route => route.fulfill({
    status: signedIn ? 200 : 401,
    contentType: 'application/json',
    body: JSON.stringify(signedIn ? { configured: true, user: { id: accountId, name: data.name }, version: '1', data } : { configured: true, error: 'Masuk untuk melanjutkan' }),
  }));
  await page.context().route('**/api/v1/auth/register', async route => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({ name: 'UI Akun', email: 'ui-qa@example.test', password: 'ValidPass123!' });
    signedIn = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Alamat email' })).toBeVisible();
  const password = page.getByLabel('Kata sandi', { exact: true });
  await password.fill('LoginPass123!');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Lihat kata sandi' }).press('Space');
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('LoginPass123!');
  await page.getByRole('button', { name: 'Daftar gratis' }).click();
  await expect(page.getByRole('heading', { name: 'Daftar akun FinTrack' })).toBeVisible();
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByLabel('Nama lengkap').fill('UI Akun');
  await page.getByLabel('Alamat email').fill('ui-qa@example.test');
  await password.fill('ValidPass123!');
  await page.getByRole('button', { name: 'Lihat kata sandi' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Sembunyikan kata sandi' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(password).toHaveValue('ValidPass123!');
  await page.getByRole('button', { name: 'Buat Akun' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Akun pribadi')).toBeVisible();
});
