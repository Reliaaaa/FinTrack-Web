import { test, expect } from '@playwright/test';

const scrollPosition = async (page: import('@playwright/test').Page) => page.evaluate(() =>
  Math.max(window.scrollY, document.scrollingElement?.scrollTop || 0, document.querySelector('.os-viewport')?.scrollTop || 0));

test('wheel, scrollbar, tema, dan modal tetap bekerja setelah resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /hydration|hydrating/i.test(message.text())) errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Selamat datang/ })).toBeVisible();
  await expect(page.locator('.os-scrollbar-vertical')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.body.scrollHeight - innerHeight)).toBeGreaterThan(100);
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(true);
  await page.mouse.move(1100, 400);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Aktifkan tema gelap' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.dock-create').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains('lenis-stopped'))).toBe(true);
  const note = page.getByPlaceholder('Tambahkan detail transaksi...');
  await note.fill('Catatan panjang '.repeat(28));
  await expect(note).toHaveAttribute('data-lenis-prevent', '');
  await note.hover();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => note.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis-stopped'))).toBe(false);
  await page.setViewportSize({ width: 375, height: 844 });
  await expect(page.locator('.os-scrollbar-vertical')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('preferensi gerak minimal tetap dapat wheel scroll tanpa Lenis', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Selamat datang/ })).toBeVisible();
  await expect(page.locator('.os-scrollbar-vertical')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false);
  await page.mouse.move(1100, 350);
  await page.mouse.wheel(0, 700);
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(0);
});
