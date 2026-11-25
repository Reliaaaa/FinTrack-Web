import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`tautan reset fragment aman dan dapat dipakai pada ${width} px`, async ({ page }) => {
    const token = 'a'.repeat(64);
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/api/v1/auth/reset-password', async route => {
      const body = route.request().postDataJSON();
      expect(body.token).toBe(token);
      expect(body.password).toBe('NewValidPass123!');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.goto(`/reset#reset_token=${token}`);
    await expect(page.getByRole('heading', { name: 'Atur ulang kata sandi' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Simpan kata sandi' })).toBeEnabled();
    await expect(page).toHaveURL('/reset');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel('Kata sandi baru').fill('NewValidPass123!');
    await page.getByRole('button', { name: 'Simpan kata sandi' }).click();
    await expect(page.getByRole('status')).toHaveText('Kata sandi berhasil diubah. Silakan masuk kembali.');
  });
}
