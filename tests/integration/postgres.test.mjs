import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import pg from 'pg';
import { chromium } from '@playwright/test';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const adminUrl = process.env.FINTRACK_TEST_ADMIN_URL;

function localAdminUrl(value) {
  assert.ok(value, 'Set FINTRACK_TEST_ADMIN_URL to a local PostgreSQL admin connection URL');
  const url = new URL(value);
  assert.equal(url.protocol, 'postgresql:');
  assert.ok(['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname), 'Tests may create databases only on localhost');
  assert.ok(['/postgres', '/fintrack'].includes(url.pathname), 'Admin URL must point to postgres or fintrack');
  return url;
}

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  return port;
}

async function waitForServer(base, child, logs) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next exited early: ${logs()}`);
    try {
      const response = await fetch(`${base}/api/v1/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).database === 'connected') return;
    } catch { /* Next is still starting. */ }
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  throw new Error(`Next did not become ready: ${logs()}`);
}

async function api(base, path, { method = 'GET', cookie, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin: base,
      'x-forwarded-proto': 'http',
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  return { status: response.status, json: await response.json(), cookie: response.headers.get('set-cookie')?.split(';', 1)[0] };
}

test('PostgreSQL: akun terisolasi, snapshot persisten, konflik versi, reset dan pencabutan sesi', { timeout: 120_000 }, async t => {
  const admin = new pg.Client({ connectionString: localAdminUrl(adminUrl).toString(), ssl: false });
  const dbName = `fintrack_qa_${randomBytes(6).toString('hex')}`;
  const dbUrl = new URL(adminUrl);
  dbUrl.pathname = `/${dbName}`;
  let child;
  let databaseCreated = false;
  let logs = '';
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    databaseCreated = true;

    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, [requireNext(), 'start', '-p', String(port), '-H', '127.0.0.1'], {
      cwd: projectRoot,
      env: { ...process.env, DATABASE_URL: dbUrl.toString(), NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs = (logs + data.toString()).slice(-4000); });
    await waitForServer(base, child, () => logs);

    const suffix = randomUUID();
    const password = 'ValidPass123!';
    const emailA = `qa-a-${suffix}@example.test`;
    const emailB = `qa-b-${suffix}@example.test`;
    const registerA = await api(base, '/api/v1/auth/register', { method: 'POST', body: { name: 'QA A', email: emailA, password } });
    const registerB = await api(base, '/api/v1/auth/register', { method: 'POST', body: { name: 'QA B', email: emailB, password } });
    assert.equal(registerA.status, 201, JSON.stringify(registerA.json));
    assert.equal(registerB.status, 201, JSON.stringify(registerB.json));
    assert.ok(registerA.cookie?.startsWith('fintrack_session='));
    assert.ok(registerB.cookie?.startsWith('fintrack_session='));
    const a = registerA.cookie;
    const b = registerB.cookie;
    let accountAId;
    let initialB;
    await t.test('registrasi menghasilkan dua akun dan snapshot awal terpisah', async () => {
      const firstA = await api(base, '/api/v1/bootstrap', { cookie: a });
      const firstB = await api(base, '/api/v1/bootstrap', { cookie: b });
      assert.equal(firstA.status, 200);
      assert.equal(firstB.status, 200);
      assert.notEqual(firstA.json.user.id, firstB.json.user.id);
      accountAId = firstA.json.user.id;
      assert.equal((await api(base, '/api/v1/auth/me', { cookie: a })).json.user.id, accountAId);
      assert.equal(firstA.json.version, '1');
      assert.equal(firstB.json.version, '1');
      assert.deepEqual(firstA.json.data.entries, []);
      assert.deepEqual(firstB.json.data.entries, []);
      assert.deepEqual(firstA.json.data.wallets.map(({ name, openingBalance }) => ({ name, openingBalance })), [{ name: 'Tunai', openingBalance: 0 }]);
      initialB = firstB.json.data;
    });

    const initial = await api(base, '/api/v1/data', { cookie: a });
    const data = {
      name: 'QA A',
      wallets: [{ id: 'qa-cash', name: 'Tunai QA', type: 'cash', openingBalance: 100000, color: '#10b981' }],
      entries: [{ id: 'qa-entry', type: 'expense', amount: 12000, walletId: 'qa-cash', category: 'Makanan & Minuman', title: 'Makan QA', date: '2026-11-25' }],
      budgets: [{ id: 'qa-budget', category: 'Makanan & Minuman', limit: 50000, period: '2026-11' }],
      recurring: [],
    };
    await t.test('simpan persisten dan tidak bocor ke akun lain', async () => {
      const saved = await api(base, '/api/v1/data', { method: 'PUT', cookie: a, body: { accountId: accountAId, version: initial.json.version, data } });
      assert.equal(saved.status, 200, JSON.stringify(saved.json));
      assert.equal(saved.json.version, '2');
      const afterA = await api(base, '/api/v1/data', { cookie: a });
      const afterB = await api(base, '/api/v1/data', { cookie: b });
      assert.deepEqual(afterA.json.data, data);
      assert.equal(afterA.json.version, '2');
      assert.deepEqual(afterB.json.data.entries, []);
      assert.deepEqual(afterB.json.data, initialB);
    });

    await t.test('versi usang ditolak tanpa menimpa snapshot', async () => {
      const staleData = { ...data, name: 'TERTIMPA' };
      const stale = await api(base, '/api/v1/data', { method: 'PUT', cookie: a, body: { accountId: accountAId, version: '1', data: staleData } });
      assert.equal(stale.status, 409, JSON.stringify(stale.json));
      assert.equal(stale.json.version, '2');
      const after = await api(base, '/api/v1/data', { cookie: a });
      assert.deepEqual(after.json.data, data);
    });

    await t.test('cookie akun lain tidak dapat menerima snapshot lama', async () => {
      const switched = await api(base, '/api/v1/data', { method: 'PUT', cookie: b, body: { accountId: accountAId, version: '1', data } });
      assert.equal(switched.status, 412, JSON.stringify(switched.json));
      const afterB = await api(base, '/api/v1/data', { cookie: b });
      assert.deepEqual(afterB.json.data.entries, []);
      assert.equal(afterB.json.version, '1');
    });

    await t.test('reset sekali pakai mencabut semua sesi lama tetapi data tetap ada', async () => {
      const login = await api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password } });
      assert.equal(login.status, 200);
      const secondSession = login.cookie;
      assert.ok(secondSession);
      const resetToken = randomBytes(32).toString('hex');
      const resetHash = createHash('sha256').update(resetToken).digest('hex');
      const fixture = new pg.Client({ connectionString: dbUrl.toString(), ssl: false });
      await fixture.connect();
      try {
        await fixture.query('INSERT INTO password_resets(token_hash,user_id,expires_at) SELECT $1,id,NOW()+INTERVAL \'30 minutes\' FROM users WHERE email=$2', [resetHash, emailA]);
      } finally { await fixture.end(); }
      const newPassword = 'NewValidPass123!';
      const reset = await api(base, '/api/v1/auth/reset-password', { method: 'POST', body: { token: resetToken, password: newPassword } });
      assert.equal(reset.status, 200, JSON.stringify(reset.json));
      assert.equal((await api(base, '/api/v1/auth/reset-password', { method: 'POST', body: { token: resetToken, password: newPassword } })).status, 400);
      assert.equal((await api(base, '/api/v1/data', { cookie: a })).status, 401);
      assert.equal((await api(base, '/api/v1/data', { cookie: secondSession })).status, 401);
      assert.equal((await api(base, '/api/v1/auth/me', { cookie: a })).status, 401);
      assert.equal((await api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password } })).status, 401);
      const fresh = await api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password: newPassword } });
      assert.equal(fresh.status, 200);
      assert.deepEqual((await api(base, '/api/v1/data', { cookie: fresh.cookie })).json.data, data);
      assert.equal((await api(base, '/api/v1/auth/logout', { method: 'POST', cookie: fresh.cookie })).status, 200);
      assert.equal((await api(base, '/api/v1/data', { cookie: fresh.cookie })).status, 401);
      assert.equal((await api(base, '/api/v1/data', { cookie: b })).status, 200);
    });

    await t.test('balapan login dan reset tidak meninggalkan sesi kata sandi lama', async () => {
      const currentPassword = 'NewValidPass123!';
      const finalPassword = 'FinalValidPass123!';
      const resetToken = randomBytes(32).toString('hex');
      const resetHash = createHash('sha256').update(resetToken).digest('hex');
      const fixture = new pg.Client({ connectionString: dbUrl.toString(), ssl: false });
      await fixture.connect();
      try {
        await fixture.query('INSERT INTO password_resets(token_hash,user_id,expires_at) SELECT $1,id,NOW()+INTERVAL \'30 minutes\' FROM users WHERE email=$2', [resetHash, emailA]);
      } finally { await fixture.end(); }
      const [racedLogin, reset] = await Promise.all([
        api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password: currentPassword } }),
        api(base, '/api/v1/auth/reset-password', { method: 'POST', body: { token: resetToken, password: finalPassword } }),
      ]);
      assert.equal(reset.status, 200, JSON.stringify(reset.json));
      assert.ok([200, 401].includes(racedLogin.status), JSON.stringify(racedLogin.json));
      if (racedLogin.cookie) assert.equal((await api(base, '/api/v1/data', { cookie: racedLogin.cookie })).status, 401);
      assert.equal((await api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password: currentPassword } })).status, 401);
      assert.equal((await api(base, '/api/v1/auth/login', { method: 'POST', body: { email: emailA, password: finalPassword } })).status, 200);
    });

    if (process.env.FINTRACK_TEST_BROWSER === '1') await t.test('Chromium nyata: daftar, keluar, lalu masuk lagi pada PostgreSQL', async () => {
      const browser = await chromium.launch({ headless: true, ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}) });
      try {
        const page = await browser.newPage();
        const email = `qa-browser-${randomUUID()}@example.test`;
        await page.goto(`${base}/login`);
        await page.getByRole('heading', { name: 'Selamat datang kembali' }).waitFor();
        await page.getByRole('button', { name: 'Daftar gratis' }).click();
        await page.getByLabel('Nama lengkap').fill('QA Browser');
        await page.getByLabel('Alamat email').fill(email);
        await page.getByLabel('Kata sandi').fill('BrowserPass123!');
        await page.getByRole('button', { name: 'Buat Akun' }).click();
        await page.waitForURL(`${base}/`);
        await page.getByText('Akun pribadi').waitFor();
        await page.goto(`${base}/settings`);
        await page.getByRole('button', { name: 'Keluar' }).click();
        await page.getByRole('heading', { name: 'Selamat datang kembali' }).waitFor();
        await page.goto(`${base}/login`);
        await page.getByLabel('Alamat email').fill(email);
        await page.getByLabel('Kata sandi').fill('BrowserPass123!');
        await page.getByRole('button', { name: 'Masuk ke Dasbor' }).click();
        await page.waitForURL(`${base}/`);
        await page.getByText('Akun pribadi').waitFor();
      } finally { await browser.close(); }
    });
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([once(child, 'exit'), new Promise(resolveWait => setTimeout(resolveWait, 5000))]);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
    if (databaseCreated) await admin.query(`DROP DATABASE "${dbName}" WITH (FORCE)`);
    await admin.end();
  }
});

function requireNext() {
  return resolve(projectRoot, 'node_modules/next/dist/bin/next');
}
