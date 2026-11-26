import { expect, test } from '@playwright/test';

test('dock mengambang menunjukkan halaman aktif dan menganimasikan tombol', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const dashboard = dock.getByRole('button', { name: 'Dasbor' });
  const reports = dock.getByRole('button', { name: 'Laporan & Analitik' });
  await expect(dock).toHaveCSS('position', 'fixed');
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(dashboard).toHaveAttribute('aria-current', 'page');

  await reports.hover();
  const letter = reports.locator('.roll-letter').first();
  await expect.poll(() => letter.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await expect(dashboard).toHaveAttribute('aria-current', 'page');

  await page.mouse.down();
  await expect.poll(() => reports.evaluate(element => getComputedStyle(element).scale)).toBe('0.96');
  await page.mouse.up();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(reports).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(dashboard).toHaveAttribute('aria-current', 'page');
});

test('reduced motion tetap menandai menu aktif tanpa menggeser huruf', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const wallets = dock.getByRole('button', { name: 'Dompet & Akun' });
  await wallets.focus();
  await expect(wallets.locator('.roll-letter').first()).toHaveCSS('transform', 'none');
  await expect(wallets).toHaveCSS('transition-property', 'none');
  await wallets.press('Enter');
  await expect(wallets).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/\/wallets$/);
});
