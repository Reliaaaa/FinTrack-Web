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
  await page.getByLabel('Pilih bulan').fill('2026-10');
  await expect(page.getByText('Mulai dari satu kategori')).toBeVisible();
  await page.getByRole('button', { name: 'Buat anggaran' }).click();
  await page.getByLabel('Nominal rupiah').fill('300000');
  await page.getByRole('button', { name: 'Simpan Anggaran' }).click();
  await expect(page.locator('.budget-card')).toHaveCount(1);
  await page.getByLabel('Pilih bulan').fill('2026-11');
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
