import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedData, walletBalance, nextOccurrence } from '../src/lib/finance.ts';
import { metrics } from '../src/lib/metrics.ts';
import { financeSchema } from '../src/server/validation.ts';
import { icsText } from '../src/lib/export.ts';

test('transfer moves money without changing total wealth', () => {
  const data = { name: 'A', wallets: [{ id: 'a', name: 'A', type: 'cash', openingBalance: 1000, color: '#000000' }, { id: 'b', name: 'B', type: 'cash', openingBalance: 0, color: '#000000' }], entries: [{ id: 't', type: 'transfer', walletId: 'a', targetWalletId: 'b', category: 'Lainnya', title: 'Transfer', amount: 250, date: '2026-11-15' }], budgets: [], recurring: [] };
  assert.equal(walletBalance(data, 'a'), 750);
  assert.equal(walletBalance(data, 'b'), 250);
  assert.equal(metrics(data, new Date(2026, 10, 15)).balance, 1000);
  assert.equal(metrics(data, new Date(2026, 10, 15)).expense, 0);
});

test('archiving a wallet does not change net worth', () => {
  const data = seedData(new Date(2026, 10, 15));
  const before = metrics(data, new Date(2026, 10, 15)).balance;
  data.wallets[0].archived = true;
  assert.equal(metrics(data, new Date(2026, 10, 15)).balance, before);
});

test('monthly totals respect the selected month', () => {
  const data = seedData(new Date(2026, 10, 15));
  const current = metrics(data, new Date(2026, 10, 15));
  const previous = metrics(data, new Date(2026, 9, 15));
  assert.equal(current.income, 14500000);
  assert.ok(current.expense > 0);
  assert.ok(previous.income > 0);
  assert.notEqual(current.expense, previous.expense);
});

test('monthly recurrence clamps end-of-month dates', () => {
  assert.equal(nextOccurrence('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(nextOccurrence('2026-02-28', 'monthly', 31), '2026-03-31');
  assert.equal(nextOccurrence('2024-02-29', 'yearly'), '2025-02-28');
  assert.equal(nextOccurrence('2027-02-28', 'yearly', 29), '2028-02-29');
  assert.equal(nextOccurrence('2026-11-15', 'weekly'), '2026-11-22');
});

test('API rejects invalid dates and transfers to an unknown wallet', () => {
  const data = seedData(new Date(2026, 10, 15));
  data.entries[0].date = '2026-02-31';
  assert.equal(financeSchema.safeParse(data).success, false);
  data.entries[0].date = '2026-11-01';
  data.entries[0].type = 'transfer';
  data.entries[0].targetWalletId = 'someone-else-wallet';
  assert.equal(financeSchema.safeParse(data).success, false);
});

test('budget limits are separated by month', () => {
  const data = seedData(new Date(2026, 10, 15));
  const november = metrics(data, new Date(2026, 10, 15));
  const october = metrics(data, new Date(2026, 9, 15));
  assert.ok(november.budgetLimit > 0);
  assert.equal(october.budgetLimit, 0);
  data.budgets.push({ id: 'october-food', category: 'Makanan & Minuman', limit: 500000, period: '2026-10' });
  assert.equal(metrics(data, new Date(2026, 9, 15)).budgetLimit, 500000);
});

test('calendar export keeps the original day after a short month', () => {
  const text = icsText({ id: 'r', title: 'Tagihan', type: 'expense', amount: 1000, walletId: 'w', category: 'Lainnya', frequency: 'monthly', nextDate: '2026-01-31', anchorDay: 31, active: true });
  assert.match(text, /RDATE;VALUE=DATE:20260228,20260331/);
});
