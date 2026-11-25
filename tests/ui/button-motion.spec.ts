import { expect, test, type Locator } from '@playwright/test';

async function coordinates(locator: Locator) {
  return locator.evaluate(element => element.getBoundingClientRect().top);
}

test('huruf tombol bergulir, klik menekan tombol, dan sorotan mengikuti sidebar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const sidebar = page.getByRole('navigation', { name: 'Navigasi utama' });
  const indicator = sidebar.locator('.sidebar-indicator');
  const dashboard = sidebar.getByRole('button', { name: 'Dasbor' });
  const reports = sidebar.getByRole('button', { name: 'Laporan & Analitik' });
  await expect(sidebar).toHaveAttribute('data-indicator', 'ready');
  const at = (target: Locator) => expect.poll(async () => Math.abs(await coordinates(indicator) - await coordinates(target))).toBeLessThan(1);

  await at(dashboard);
  await reports.hover();
  await at(reports);
  const letter = reports.locator('.roll-letter').first();
  await expect.poll(() => letter.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await expect(dashboard).toHaveAttribute('aria-current', 'page');
  await page.getByRole('main').getByRole('heading', { level: 1 }).hover();
  await at(dashboard);

  await reports.hover();
  await page.mouse.down();
  await expect.poll(() => reports.evaluate(element => getComputedStyle(element).scale)).toBe('0.96');
  await page.mouse.up();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(reports).toHaveAttribute('aria-current', 'page');
  await page.getByRole('main').getByRole('heading', { level: 1 }).hover();
  await at(reports);
  await page.goBack();
  await expect(dashboard).toHaveAttribute('aria-current', 'page');
  await at(dashboard);
});

test('reduced motion tetap menandai navigasi tanpa menggeser huruf', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const sidebar = page.getByRole('navigation', { name: 'Navigasi utama' });
  const wallets = sidebar.getByRole('button', { name: 'Dompet & Akun' });
  const indicator = sidebar.locator('.sidebar-indicator');
  await expect(sidebar).toHaveAttribute('data-indicator', 'ready');
  await wallets.focus();
  await expect(wallets.locator('.roll-letter').first()).toHaveCSS('transform', 'none');
  await expect(indicator).toHaveCSS('transition-property', 'none');
  await wallets.press('Enter');
  await expect(wallets).toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveURL(/\/wallets$/);
});
