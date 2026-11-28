export type EntryType = 'income' | 'expense' | 'transfer';
export type Wallet = { id: string; name: string; type: 'bank' | 'ewallet' | 'cash' | 'credit' | 'investment'; openingBalance: number; color: string; archived?: boolean };
export type Entry = { id: string; type: EntryType; amount: number; walletId: string; targetWalletId?: string; category: string; title: string; note?: string; date: string; receipt?: string };
export type Budget = { id: string; category: string; limit: number; title?: string; period?: string; startDate?: string; endDate?: string };
export type Recurring = { id: string; title: string; type: 'income' | 'expense'; amount: number; walletId: string; category: string; frequency: 'weekly' | 'monthly' | 'yearly'; nextDate: string; anchorDay?: number; active: boolean };
export type FinanceData = { wallets: Wallet[]; entries: Entry[]; budgets: Budget[]; recurring: Recurring[]; name: string };
export type InvestmentMovement = { investmentId: string; direction: 'deposit' | 'withdrawal' };

export function isFundingWallet(wallet: Wallet) {
  return wallet.type !== 'investment' && wallet.type !== 'credit';
}

export function investmentMovement(wallets: Wallet[], entry: Entry): InvestmentMovement | undefined {
  if (entry.type !== 'transfer') return;
  const target = wallets.find(wallet => wallet.id === entry.targetWalletId);
  if (target?.type === 'investment') return { investmentId: target.id, direction: 'deposit' };
  const source = wallets.find(wallet => wallet.id === entry.walletId);
  if (source?.type === 'investment') return { investmentId: source.id, direction: 'withdrawal' };
}

export const expenseCategories = ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'];
export const incomeCategories = ['Gaji', 'Bonus', 'Usaha', 'Investasi', 'Lainnya'];
export const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export function addDays(date: string, days: number): string {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export const countDays = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;

export function monthRange(key: string) {
  const [year, month] = key.split('-').map(Number);
  return { start: `${key}-01`, end: `${key}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}` };
}

// Anggaran lama tanpa tanggal tetap mengikuti bulan kalender.
export const budgetRange = (budget: Budget) => budget.startDate && budget.endDate
  ? { start: budget.startDate, end: budget.endDate }
  : monthRange(budget.period || monthKey(new Date()));

export const rangesOverlap = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start <= b.end && b.start <= a.end;

export const budgetsForMonth = (data: FinanceData, date: Date) => {
  const month = monthRange(monthKey(date));
  return data.budgets.filter(budget => rangesOverlap(budgetRange(budget), month));
};

export function budgetSpent(data: FinanceData, budget: Budget): number {
  const { start, end } = budgetRange(budget);
  return data.entries.reduce((sum, entry) => entry.type === 'expense' && entry.category === budget.category && entry.date >= start && entry.date <= end ? sum + entry.amount : sum, 0);
}
export const categoryColors: Record<string, string> = {
  'Makanan & Minuman': '#10b981', Transportasi: '#3b82f6', 'Tagihan & Utilitas': '#f59e0b', Belanja: '#f43f5e', Hiburan: '#8b5cf6', Kesehatan: '#14b8a6', Pendidikan: '#6366f1', Gaji: '#10b981', Bonus: '#22c55e', Usaha: '#0ea5e9', Investasi: '#8b5cf6', Lainnya: '#94a3b8',
};

export function newFinanceData(name: string): FinanceData {
  return {
    name,
    wallets: [{ id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 0, color: '#10b981' }],
    entries: [],
    budgets: [],
    recurring: [],
  };
}

export function seedData(today = new Date()): FinanceData {
  const d = (day: number, offset = 0) => {
    const value = new Date(today.getFullYear(), today.getMonth() + offset, day);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const sample: Omit<Entry, 'id'>[] = [
    { type: 'income', amount: 14500000, walletId: 'bca', category: 'Gaji', title: 'Gaji Bulanan', date: d(1) },
    { type: 'expense', amount: 1400000, walletId: 'bca', category: 'Makanan & Minuman', title: 'Belanja makan & kopi', date: d(3) },
    { type: 'expense', amount: 1650000, walletId: 'bca', category: 'Tagihan & Utilitas', title: 'Listrik & internet', date: d(5) },
    { type: 'expense', amount: 1100000, walletId: 'gopay', category: 'Belanja', title: 'Belanja bulanan', date: d(7) },
    { type: 'expense', amount: 650000, walletId: 'gopay', category: 'Transportasi', title: 'Transportasi & bensin', date: d(9) },
    { type: 'expense', amount: 450000, walletId: 'bca', category: 'Hiburan', title: 'Hiburan akhir pekan', date: d(10) },
    { type: 'expense', amount: 820000, walletId: 'bca', category: 'Kesehatan', title: 'Apotek dan pemeriksaan', date: d(11) },
    { type: 'expense', amount: 750000, walletId: 'cash', category: 'Pendidikan', title: 'Buku dan kursus', date: d(12) },
    { type: 'transfer', amount: 500000, walletId: 'bca', targetWalletId: 'gopay', category: 'Lainnya', title: 'Top up GoPay', date: d(13) },
    { type: 'expense', amount: 45000, walletId: 'gopay', category: 'Makanan & Minuman', title: 'Kopi Kenangan', date: d(Math.min(today.getDate(), 14)) },
  ];
  for (let offset = -5; offset < 0; offset++) {
    sample.push({ type: 'income', amount: 12400000 + (offset + 5) * 420000, walletId: 'bca', category: 'Gaji', title: 'Gaji Bulanan', date: d(1, offset) });
    sample.push({ type: 'expense', amount: 5700000 + (offset + 5) * 170000, walletId: 'bca', category: 'Lainnya', title: 'Pengeluaran bulanan', date: d(15, offset) });
  }
  return {
    name: 'Budi',
    wallets: [
      { id: 'bca', name: 'Bank BCA Utama', type: 'bank', openingBalance: 31000000, color: '#0f172a' },
      { id: 'gopay', name: 'GoPay & QRIS', type: 'ewallet', openingBalance: 2300000, color: '#3b82f6' },
      { id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 1900000, color: '#f59e0b' },
      { id: 'savings', name: 'Tabungan', type: 'bank', openingBalance: 13200000, color: '#10b981' },
    ],
    entries: sample.map((entry, index) => ({ ...entry, id: `sample-${index}` })),
    budgets: [
      { id: 'food', category: 'Makanan & Minuman', limit: 1500000, period: monthKey(today) },
      { id: 'transport', category: 'Transportasi', limit: 1000000, period: monthKey(today) },
      { id: 'utilities', category: 'Tagihan & Utilitas', limit: 1800000, period: monthKey(today) },
      { id: 'shopping', category: 'Belanja', limit: 2000000, period: monthKey(today) },
      { id: 'entertainment', category: 'Hiburan', limit: 1200000, period: monthKey(today) },
      { id: 'health', category: 'Kesehatan', limit: 1500000, period: monthKey(today) },
      { id: 'education', category: 'Pendidikan', limit: 1000000, period: monthKey(today) },
    ],
    recurring: [
      { id: 'salary', title: 'Gaji Bulanan', type: 'income', amount: 14500000, walletId: 'bca', category: 'Gaji', frequency: 'monthly', nextDate: d(1, 1), active: true },
      { id: 'internet', title: 'Internet rumah', type: 'expense', amount: 450000, walletId: 'bca', category: 'Tagihan & Utilitas', frequency: 'monthly', nextDate: d(20), active: true },
      { id: 'spotify', title: 'Spotify Premium', type: 'expense', amount: 55000, walletId: 'gopay', category: 'Hiburan', frequency: 'monthly', nextDate: d(24), active: true },
    ],
  };
}

export function walletBalance(data: FinanceData, id: string, excludeEntryId?: string): number {
  const wallet = data.wallets.find(w => w.id === id);
  if (!wallet) return 0;
  return data.entries.reduce((sum, entry) => {
    if (entry.id === excludeEntryId) return sum;
    const outgoing = entry.walletId === id ? (entry.type === 'income' ? entry.amount : -entry.amount) : 0;
    const incoming = entry.type === 'transfer' && entry.targetWalletId === id ? entry.amount : 0;
    return sum + outgoing + incoming;
  }, wallet.openingBalance);
}

export function monthEntries(data: FinanceData, date: Date): Entry[] {
  const prefix = monthKey(date);
  return data.entries.filter(entry => entry.date.startsWith(prefix));
}

export function nextOccurrence(date: string, frequency: Recurring['frequency'], anchorDay?: number): string {
  const next = new Date(`${date}T12:00:00`);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else {
    const day = anchorDay || next.getDate();
    const year = frequency === 'yearly' ? next.getFullYear() + 1 : next.getFullYear();
    const month = frequency === 'monthly' ? next.getMonth() + 1 : next.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    next.setFullYear(year, month, Math.min(day, lastDay));
  }
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}
