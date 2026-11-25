import { FinanceData, monthEntries, walletBalance, budgetsForMonth } from './finance';

export function metrics(data: FinanceData, date: Date) {
  const entries = monthEntries(data, date);
  const income = entries.filter(e => e.type === 'income').reduce((a, e) => a + e.amount, 0);
  const expense = entries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0);
  const balance = data.wallets.reduce((a, w) => a + walletBalance(data, w.id), 0);
  const monthlyBudgets = budgetsForMonth(data, date);
  const budgetLimit = monthlyBudgets.reduce((a, b) => a + b.limit, 0);
  const spending = monthlyBudgets.reduce((a, b) => a + entries.filter(e => e.type === 'expense' && e.category === b.category).reduce((s, e) => s + e.amount, 0), 0);
  return { entries, income, expense, balance, budgetLimit, spending, budgetRemaining: budgetLimit - spending, savingsRate: income ? Math.round((income - expense) / income * 100) : 0 };
}

export function byCategory(data: FinanceData, date: Date) {
  const entries = monthEntries(data, date).filter(e => e.type === 'expense');
  return [...new Set(entries.map(e => e.category))].map(category => ({ name: category, value: entries.filter(e => e.category === category).reduce((a, e) => a + e.amount, 0) })).sort((a, b) => b.value - a.value);
}

export function cashflow(data: FinanceData, date: Date) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(date.getFullYear(), date.getMonth() - 5 + i, 1);
    const entries = monthEntries(data, d);
    return { name: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d), pemasukan: entries.filter(e => e.type === 'income').reduce((a, e) => a + e.amount, 0), pengeluaran: entries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0) };
  });
}
