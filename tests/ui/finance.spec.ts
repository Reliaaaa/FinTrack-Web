import { test, expect } from '@playwright/test';

test('transaksi demo bertahan setelah reload dan bisa dihapus', async ({ page }) => {
  await page.goto('/transactions');
  await page.getByRole('main').getByRole('button', { name: 'Catat Transaksi', exact: true }).click();
  await page.getByPlaceholder('Contoh: Belanja makan siang').fill('Transaksi QA');
  await page.getByLabel('Nominal rupiah').fill('25000');
  await page.getByRole('button', { name: 'Simpan Transaksi' }).click();
  await expect(page.getByText('Transaksi QA')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Transaksi QA')).toBeVisible();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Hapus Transaksi QA' }).click();
  await expect(page.getByText('Transaksi QA')).toHaveCount(0);
});

test('anggaran tidak bercampur antarbulan', async ({ page }) => {
  await page.goto('/budgets');
  const selectedMonth = await page.getByLabel('Pilih bulan').inputValue();
  const [year, month] = selectedMonth.split('-').map(Number);
  const previous = new Date(year, month - 2, 1);
  const previousMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
  await page.getByLabel('Pilih bulan').fill(previousMonth);
  await expect(page.getByText('Mulai dari satu kategori')).toBeVisible();
  await page.getByRole('button', { name: 'Buat anggaran' }).click();
  await page.getByLabel('Nominal rupiah').fill('300000');
  await page.getByRole('button', { name: 'Simpan Anggaran' }).click();
  await expect(page.locator('.budget-card')).toHaveCount(1);
  await page.getByLabel('Pilih bulan').fill(selectedMonth);
  await expect(page.locator('.budget-card')).toHaveCount(7);
});

test('halaman mobile tidak melebar dan modal mengembalikan fokus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  for (const route of ['/', '/transactions', '/wallets', '/budgets', '/recurring', '/reports', '/settings']) {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/transactions');
  const opener = page.locator('.mobile-add');
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await opener.evaluate(element => element === document.activeElement)).toBe(true);
});

test('konflik menyimpan draf hanya selama tab terbuka', async ({ page }) => {
  const data = { name: 'Tester', wallets: [{ id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 100000, color: '#10b981' }], entries: [], budgets: [], recurring: [] };
  await page.context().route('**/api/v1/bootstrap', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, user: { id: 'qa-user', name: 'Tester' }, version: '1', data }) }));
  await page.context().route('**/api/v1/data', route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Konflik', version: '2' }) }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Catat Transaksi', exact: true }).click();
  await page.getByPlaceholder('Contoh: Belanja makan siang').fill('Draf konflik QA');
  await page.getByLabel('Nominal rupiah').fill('10000');
  await page.getByRole('button', { name: 'Simpan Transaksi' }).click();
  await expect(page.getByText('Konflik data.')).toBeVisible();
  expect(await page.evaluate(() => Boolean(sessionStorage.getItem('fintrack-pending-change:qa-user')))).toBe(true);
  await page.reload();
  await expect(page.getByText('Konflik data.')).toBeVisible();
  const freshTab = await page.context().newPage();
  await freshTab.goto('/');
  await expect(freshTab.locator('h1')).toBeVisible();
  expect(await freshTab.evaluate(() => Boolean(sessionStorage.getItem('fintrack-pending-change:qa-user')))).toBe(false);
  await freshTab.close();
});
