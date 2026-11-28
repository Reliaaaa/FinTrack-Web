import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedData, addDays, budgetSpent, budgetsForMonth, countDays, walletBalance, nextOccurrence } from '../src/lib/finance.ts';
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

test('dashboard wallet totals distinguish digital money, cash, and saved funds', () => {
  const date = new Date(2026, 10, 15);
  const data = seedData(date);
  const baseline = metrics(data, date);
  assert.equal(baseline.cashBalance, walletBalance(data, 'cash'));
  assert.equal(baseline.digitalBalance, baseline.balance - baseline.cashBalance);

  data.wallets.push(
    { id: 'credit', name: 'Kartu kredit', type: 'credit', openingBalance: 0, color: '#235347' },
    { id: 'investment', name: 'Dana darurat', type: 'investment', openingBalance: 0, color: '#235347' },
  );
  data.entries.push(
    { id: 'cash-to-bank', type: 'transfer', walletId: 'cash', targetWalletId: 'bca', amount: 100000, category: 'Lainnya', title: 'Setor tunai', date: '2026-11-15' },
    { id: 'bank-to-savings', type: 'transfer', walletId: 'bca', targetWalletId: 'investment', amount: 200000, category: 'Investasi', title: 'Dana darurat', date: '2026-11-15' },
    { id: 'credit-expense', type: 'expense', walletId: 'credit', amount: 30000, category: 'Lainnya', title: 'Pembayaran kartu', date: '2026-11-15' },
  );

  const updated = metrics(data, date);
  assert.equal(updated.cashBalance, baseline.cashBalance - 100000);
  assert.equal(updated.digitalBalance, baseline.digitalBalance + 100000 - 200000 - 30000);
  assert.equal(updated.balance, baseline.balance - 30000);
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

test('investment transfers conserve net worth and reject unbacked savings withdrawals', () => {
  const date = new Date(2026, 10, 15);
  const data = seedData(date);
  const before = metrics(data, date);
  const account = { id: 'investment', name: 'Dana darurat', type: 'investment', openingBalance: 0, color: '#235347' };
  const deposit = { id: 'setor', type: 'transfer', walletId: 'bca', targetWalletId: account.id, category: 'Investasi', title: 'Setoran', amount: 500000, date: '2026-11-15' };
  const withdrawal = { ...deposit, id: 'tarik', title: 'Penarikan', walletId: account.id, targetWalletId: 'gopay', amount: 150000 };
  const next = { ...data, wallets: [...data.wallets, account], entries: [withdrawal, deposit, ...data.entries] };
  assert.equal(financeSchema.safeParse(next).success, true);
  assert.equal(walletBalance(next, account.id), 350000);
  assert.equal(walletBalance(next, 'bca'), walletBalance(data, 'bca') - 500000);
  assert.equal(walletBalance(next, 'gopay'), walletBalance(data, 'gopay') + 150000);
  for (const key of ['balance', 'income', 'expense', 'spending']) {
    assert.equal(metrics(next, date)[key], before[key]);
  }
  assert.equal(financeSchema.safeParse({ ...next, entries: [withdrawal, ...data.entries] }).success, false);
  assert.equal(financeSchema.safeParse({ ...next, entries: [{ ...withdrawal, type: 'expense' }, deposit, ...data.entries] }).success, false);
  assert.equal(financeSchema.safeParse({ ...next, wallets: [...data.wallets, { ...account, openingBalance: 1 }] }).success, false);
});

test('a 30-day budget spans two months and counts only expenses inside its dates', () => {
  const data = seedData(new Date(2026, 10, 15));
  const budget = { id: 'trip', category: 'Transportasi', limit: 900000, startDate: '2026-11-25', endDate: addDays('2026-11-25', 29) };
  assert.equal(budget.endDate, '2026-12-24');
  assert.equal(countDays(budget.startDate, budget.endDate), 30);
  const base = { type: 'expense', walletId: 'bca', category: 'Transportasi', title: 'Uji' };
  const next = { ...data, budgets: [budget], entries: ['2026-11-24', '2026-11-25', '2026-12-24', '2026-12-25'].map((date, index) => ({ ...base, id: `t${index}`, date, amount: 10 ** (index + 1) })) };
  assert.equal(budgetSpent(next, budget), 100 + 1000);
  for (const [month, count] of [[9, 0], [10, 1], [11, 1], [12, 0]]) assert.equal(budgetsForMonth(next, new Date(2026, month, 1)).length, count);
  assert.equal(metrics(next, new Date(2026, 11, 1)).spending, 1100);
  assert.deepEqual(financeSchema.parse(next).budgets[0], budget);
  for (const bad of [{ endDate: undefined }, { endDate: '2026-11-24' }, { endDate: '2028-01-01' }]) assert.equal(financeSchema.safeParse({ ...next, budgets: [{ ...budget, ...bad }] }).success, false);
});

test('judul anggaran disimpan dan tetap opsional', () => {
  const data = seedData(new Date(2026, 10, 15));
  const titled = { ...data, budgets: [{ ...data.budgets[0], title: 'Uang makan' }, data.budgets[1]] };
  const parsed = financeSchema.parse(titled);
  assert.equal(parsed.budgets[0].title, 'Uang makan');
  assert.equal(parsed.budgets[1].title, undefined);
  assert.equal(financeSchema.safeParse({ ...data, budgets: [{ ...data.budgets[0], title: 'x'.repeat(101) }] }).success, false);
});
