import { expect, test, type Locator } from '@playwright/test';

async function expectIndicatorAt(indicator: Locator, control: Locator) {
  await expect.poll(async () => {
    const [marker, target] = await Promise.all([indicator.boundingBox(), control.boundingBox()]);
    if (!marker || !target) return Infinity;
    return Math.max(
      Math.abs(marker.x - target.x),
      Math.abs(marker.y - target.y),
      Math.abs(marker.width - target.width),
      Math.abs(marker.height - target.height),
    );
  }).toBeLessThan(1.5);
}

test('dock mengambang menunjukkan halaman aktif dan menganimasikan tombol', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const dashboard = dock.getByRole('button', { name: 'Dasbor' });
  const reports = dock.getByRole('button', { name: 'Laporan & Analitik' });
  await expect(dock).toHaveCSS('position', 'fixed');
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(dashboard).toHaveAttribute('aria-current', 'page');
  const indicator = dock.locator('.dock-indicator');
  await expectIndicatorAt(indicator, dashboard);

  await reports.hover();
  const letter = reports.locator('.roll-letter').first();
  await expect.poll(() => letter.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await expect(dashboard).toHaveAttribute('aria-current', 'page');

  await page.mouse.down();
  await expect.poll(() => reports.evaluate(element => getComputedStyle(element).scale)).toBe('0.96');
  await page.mouse.up();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(reports).toHaveAttribute('aria-current', 'page');
  await expectIndicatorAt(indicator, reports);
  await page.goBack();
  await expect(dashboard).toHaveAttribute('aria-current', 'page');
  await expectIndicatorAt(indicator, dashboard);
});

test('reduced motion tetap menandai menu aktif tanpa menggeser huruf', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const wallets = dock.getByRole('button', { name: 'Dompet & Akun' });
  await wallets.focus();
  await expect(wallets.locator('.roll-letter').first()).toHaveCSS('transform', 'none');
  await expect(wallets).toHaveCSS('transition-property', 'none');
  const indicator = dock.locator('.dock-indicator');
  await expect(indicator).toHaveCSS('transition-property', 'none');
  await wallets.press('Enter');
  await expect(wallets).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/\/wallets$/);
  await expectIndicatorAt(indicator, wallets);
});

test('penanda dock mengikuti Lainnya saat layar mengecil', async ({ page }) => {
  await page.goto('/reports');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const indicator = dock.locator('.dock-indicator');
  const reports = dock.getByRole('button', { name: 'Laporan & Analitik' });
  await expect(reports).toHaveAttribute('aria-current', 'page');
  await expectIndicatorAt(indicator, reports);

  await page.setViewportSize({ width: 375, height: 844 });
  const more = dock.locator('summary');
  await expect(more).toHaveAttribute('data-current', 'true');
  await expectIndicatorAt(indicator, more);

  const transactions = dock.getByRole('button', { name: 'Transaksi', exact: true });
  await transactions.click();
  await expectIndicatorAt(indicator, transactions);

  await more.click();
  await reports.click();
  await expectIndicatorAt(indicator, more);
});
