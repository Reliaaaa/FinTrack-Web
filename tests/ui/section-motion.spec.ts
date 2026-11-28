import { expect, test } from '@playwright/test';

test('dasbor langsung tampil dan anggaran tetap dapat bertransisi', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const view = page.getByRole('main').locator('.section-view');
  await expect(view.getByRole('heading', { name: /Selamat datang/ })).toBeVisible();
  await expect(view).toHaveCSS('animation-name', 'none');

  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  await nav.getByRole('button', { name: 'Anggaran', exact: true }).click();
  await expect(page).toHaveURL(/\/budgets$/);
  await expect(view.getByRole('heading', { name: 'Anggaran', exact: true })).toBeVisible();
  await expect(view).toHaveCSS('animation-name', 'section-enter');
  const fill = view.getByRole('progressbar').first().locator('span');
  await expect(fill).toHaveCSS('transition-property', 'width');

  await page.emulateMedia({ media: 'print' });
  await expect(view).toHaveCSS('animation-name', 'none');
  await expect(fill).toHaveCSS('transition-duration', '0s');
});

test('navigasi ponsel dan indikator anggaran langsung tampil pada reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Anggaran' }).click();
  const view = page.getByRole('main').locator('.section-view');
  await expect(view.getByRole('heading', { name: 'Anggaran', exact: true })).toBeVisible();
  await expect(view).toHaveCSS('animation-name', 'none');
  const fill = view.getByRole('progressbar').first().locator('span');
  await expect.poll(() => fill.evaluate(element => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThan(.001);
});
