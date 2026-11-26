import { test, expect } from '@playwright/test';

test('dasbor menampilkan uang digital dan tunai di layar kecil', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const balances = page.getByRole('group', { name: 'Saldo uang saat ini' });
  await expect(balances.locator('.kpi-card').filter({ hasText: 'Uang Digital' })).toContainText(/Rp\s*90\.885\.000/);
  await expect(balances.locator('.kpi-card').filter({ hasText: 'Uang Tunai' })).toContainText(/Rp\s*1\.150\.000/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('tata letak FinTrack terbaca di dua tema dan empat ukuran layar', async ({ page }) => {
  await page.goto('/');
  const dashboard = page.locator('.dashboard-overview');
  const theme = page.getByRole('button', { name: 'Aktifkan tema gelap' });
  await expect(dashboard).toBeVisible();

  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      { message: `Konten melebar pada ${width} px` },
    ).toBeLessThanOrEqual(0);
  }

  const period = page.getByLabel('Pilih bulan');
  await expect(period).toHaveCSS('font-size', '16px');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  const buttons = nav.locator('.dock-item[data-compact], .dock-more > summary');
  await expect(buttons).toHaveCount(6);
  const positions = await buttons.evaluateAll(items => items.map(button => button.getBoundingClientRect().top));
  expect(new Set(positions).size).toBe(1);

  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Cari transaksi', exact: true })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Cari transaksi' })).toHaveCSS('font-size', '16px');
});

test('dock ponsel tetap mengambang dan menu Lainnya membuka halaman tambahan', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Navigasi utama' });
  const more = dock.locator('summary');
  const reports = dock.getByRole('button', { name: 'Laporan & Analitik' });
  await expect(dock).toHaveCSS('position', 'fixed');
  await expect(dock).not.toHaveCSS('backdrop-filter', 'none');
  await expect(reports).toHaveCount(0);

  await more.click();
  await expect(reports).toBeVisible();
  await reports.focus();
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  await expect(reports).toHaveCount(0);

  await more.click();
  await reports.click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(more).toHaveAttribute('data-current', 'true');
  await expect(reports).toHaveCount(0);

  await page.emulateMedia({ media: 'print' });
  await expect(dock).toBeHidden();
});

test('sumbu arus kas memakai ribuan pada dasbor dan laporan', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.addInitScript(() => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    localStorage.setItem('fintrack-demo-v1', JSON.stringify({
      name: 'Pengguna',
      wallets: [{ id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 50_000, color: '#235347' }],
      entries: [{ id: 'expense', type: 'expense', amount: 17_000, walletId: 'cash', category: 'Belanja', title: 'Belanja', date }],
      budgets: [],
      recurring: [],
    }));
  });

  await page.goto('/?mode=lokal');
  await expect(page.locator('.donut-center')).toContainText(/Rp\s*17 rb/);
  const dashboardAxis = page.locator('.chart-area .recharts-yAxis-tick-labels');
  await expect(dashboardAxis.getByText(/\brb$/).first()).toBeVisible();
  await expect(dashboardAxis.getByText(/\bjt$/)).toHaveCount(0);

  await page.goto('/reports?mode=lokal');
  const reportAxis = page.locator('.report-area .recharts-yAxis-tick-labels');
  await expect(reportAxis.getByText(/\brb$/).first()).toBeVisible();
  await expect(reportAxis.getByText(/\bjt$/)).toHaveCount(0);
});

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

test('kolom pencarian Transaksi menyaring nama dan nominal', async ({ page }) => {
  await page.goto('/');
  const transactions = page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Transaksi', exact: true });
  const search = page.getByRole('textbox', { name: 'Cari transaksi' });
  const rows = page.getByRole('row');

  await transactions.click();
  await expect(page).toHaveURL(/\/transactions$/);
  await search.fill('  LISTRIK  ');
  await expect(rows.filter({ hasText: 'Listrik & internet' })).toBeVisible();
  await expect(rows.filter({ hasText: 'Belanja makan & kopi' })).toHaveCount(0);

  await search.fill('1650000');
  await expect(rows.filter({ hasText: 'Listrik & internet' })).toBeVisible();
  await expect(rows.filter({ hasText: 'Belanja makan & kopi' })).toHaveCount(0);
  await search.fill('tidak-cocok-dengan-transaksi');
  await expect(page.getByRole('heading', { name: 'Tidak ada transaksi' })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole('heading', { name: /Selamat datang/ })).toBeVisible();
});

test('header ponsel menempatkan kalender, tema, dan Keluar setelah merek', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  const user = { id: 'qa-user', name: 'Tester' };
  const data = { name: user.name, wallets: [], entries: [], budgets: [], recurring: [] };
  await page.route('**/api/v1/bootstrap', route => route.fulfill({ json: { configured: true, user, version: '1', data } }));
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: { user } }));
  await page.goto('/');

  const header = page.getByRole('banner');
  const brand = header.getByRole('button', { name: 'FinTrack, buka dasbor' });
  const calendar = header.locator('.period-select');
  const month = header.getByLabel('Pilih bulan');
  const theme = header.getByRole('button', { name: 'Aktifkan tema gelap' });
  const logout = header.getByRole('button', { name: 'Keluar' });
  const centers = [];
  for (const control of [brand, calendar, theme, logout]) {
    await expect(control).toBeVisible();
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    centers.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  expect(centers.map(center => center.x)).toEqual(centers.map(center => center.x).sort((a, b) => a - b));
  expect(new Set(centers.map(center => center.y)).size).toBe(1);
  await expect(header.locator('.topbar-title')).toBeHidden();
  await expect(header.getByRole('link', { name: 'Lihat panduan' })).toBeHidden();
  await expect(month).toHaveCSS('opacity', '0');
  expect(await month.evaluate(input => {
    const box = input.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === input;
  })).toBe(true);
  await month.fill('2025-02');
  await expect(page.getByText('Ringkasan · Februari 2025')).toBeVisible();

  const more = page.getByRole('navigation', { name: 'Navigasi utama' }).locator('summary');
  for (const control of [brand.locator('svg'), month, theme, logout, more]) {
    await expect(control).toHaveCSS('-webkit-tap-highlight-color', 'rgba(0, 0, 0, 0)');
  }

  await page.setViewportSize({ width: 1440, height: 844 });
  await expect(month).toHaveCSS('opacity', '1');
  await expect(header.getByRole('link', { name: 'Lihat panduan' })).toBeVisible();
});

test('header tetap terlihat saat dasbor digulir di desktop dan ponsel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 540 });
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header.getByLabel('Pilih bulan')).toBeVisible();
    await page.mouse.move(width / 2, 330);
    await page.mouse.wheel(0, 680);
    await expect.poll(() => page.evaluate(() => Math.max(window.scrollY, document.scrollingElement?.scrollTop ?? 0, document.querySelector('.os-viewport')?.scrollTop ?? 0))).toBeGreaterThan(100);
    await expect.poll(async () => Math.abs((await header.boundingBox())?.y ?? Infinity)).toBeLessThan(1);
    await expect(header.getByRole('button', { name: 'Aktifkan tema gelap' })).toBeInViewport();
  }
});

test('Laporan mengunduh CSV dan Excel serta menyiapkan template PDF', async ({ page }) => {
  await page.goto('/reports');
  const actions = page.getByRole('main');
  for (const [label, extension] of [['CSV', 'csv'], ['Excel', 'xlsx']]) {
    const download = page.waitForEvent('download');
    await actions.getByRole('button', { name: label, exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(new RegExp(`^fintrack-transaksi-\\d{4}-\\d{2}\\.${extension}$`));
  }

  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const report = page.locator('.print-report');
  await expect(report.getByRole('heading', { name: 'Laporan Keuangan Bulanan' })).toBeVisible();
  await expect(report.getByRole('table')).toBeVisible();
  await expect(report.getByText('Pemasukan', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(report).toHaveCount(0);
  await page.emulateMedia({ media: 'screen' });
  const pdf = await page.pdf({ preferCSSPageSize: true });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(3000);
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
  const opener = page.locator('.dock-create');
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

test('simpanan dapat diisi dari bank dan ditarik ke e-wallet tanpa menghitungnya sebagai pengeluaran', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/');
  const bottom = page.getByRole('navigation', { name: 'Navigasi utama' });
  const wealth = page.locator('.kpi-card').filter({ hasText: 'Kekayaan bersih' });
  const originalWealth = await wealth.locator('.kpi-value').innerText();
  await bottom.getByRole('button', { name: 'Investasi' }).click();
  await expect(page).toHaveURL(/\/investments$/);
  await page.getByRole('button', { name: 'Buat simpanan pertama' }).click();
  await page.getByLabel('Nama simpanan').fill('Dana darurat');
  await page.getByRole('button', { name: 'Simpan Simpanan' }).click();
  const savings = page.getByRole('article').filter({ hasText: 'Dana darurat' });
  await expect(savings.getByRole('button', { name: 'Tarik', exact: true })).toBeDisabled();
  await savings.getByRole('button', { name: 'Setor', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dompet sumber').selectOption('bca');
  await dialog.getByLabel(/Nominal rupiah/).fill('1000000000');
  await dialog.getByRole('button', { name: 'Setor dana' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Saldo dompet asal tidak cukup.');
  await dialog.getByLabel(/Nominal rupiah/).fill('500000');
  await dialog.getByRole('button', { name: 'Setor dana' }).click();
  await expect(savings).toContainText(/Rp\s*500\.000/);
  await savings.getByRole('button', { name: 'Tarik', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dompet tujuan').selectOption('gopay');
  await dialog.getByLabel(/Nominal rupiah/).fill('650000');
  await dialog.getByRole('button', { name: 'Tarik dana' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Saldo simpanan tidak cukup.');
  await dialog.getByLabel(/Nominal rupiah/).fill('150000');
  await dialog.getByRole('button', { name: 'Tarik dana' }).click();
  await page.reload();
  await expect(savings).toContainText(/Rp\s*350\.000/);
  await expect(page.getByText(/Dana darurat → GoPay/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await bottom.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByLabel('Filter dompet').selectOption({ label: 'Dana darurat' });
  await expect(page.getByRole('row').filter({ hasText: 'Setoran simpanan' })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'Penarikan simpanan' })).toBeVisible();
  await page.getByRole('button', { name: 'Hapus Setoran simpanan' }).click();
  await expect(page.getByRole('status')).toContainText('Saldo tujuan tidak cukup');
  await page.goto('/');
  await expect(wealth.locator('.kpi-value')).toHaveText(originalWealth);
});
