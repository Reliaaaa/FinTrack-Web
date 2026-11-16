import { z } from 'zod';
const name = z.string().trim().min(1).max(100);
const amount = z.number().finite().nonnegative().max(1_000_000_000_000);
const id = z.string().min(1).max(100);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const wallet = z.object({ id, name, type: z.enum(['bank', 'ewallet', 'cash', 'credit']), openingBalance: amount, color: z.string().regex(/^#[0-9a-fA-F]{6}$/), archived: z.boolean().optional() });
const entry = z.object({ id, type: z.enum(['income', 'expense', 'transfer']), amount: amount.positive(), walletId: id, targetWalletId: id.optional(), category: name, title: name, note: z.string().max(500).optional(), date, receipt: z.string().max(1_500_000).refine(v => !v || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)).optional() });
const budget = z.object({ id, category: name, limit: amount.positive(), period: z.string().regex(/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/).optional() });
const recurring = z.object({ id, title: name, type: z.enum(['income', 'expense']), amount: amount.positive(), walletId: id, category: name, frequency: z.enum(['weekly', 'monthly', 'yearly']), nextDate: date, anchorDay: z.number().int().min(1).max(31).optional(), active: z.boolean() });
export const financeSchema = z.object({ wallets: z.array(wallet).max(100), entries: z.array(entry).max(10000), budgets: z.array(budget).max(200), recurring: z.array(recurring).max(500), name: z.string().trim().min(1).max(60) }).superRefine((data, ctx) => {
  const walletIds = new Set(data.wallets.map(w => w.id));
  for (const [index, item] of data.entries.entries()) if (!walletIds.has(item.walletId) || (item.type === 'transfer' && (!item.targetWalletId || !walletIds.has(item.targetWalletId) || item.walletId === item.targetWalletId))) ctx.addIssue({ code: 'custom', message: `Dompet transaksi ${index} tidak valid`, path: ['entries', index] });
  for (const [index, item] of data.recurring.entries()) if (!walletIds.has(item.walletId)) ctx.addIssue({ code: 'custom', message: `Dompet jadwal ${index} tidak valid`, path: ['recurring', index] });
  for (const key of ['wallets', 'entries', 'budgets', 'recurring'] as const) if (new Set(data[key].map(item => item.id)).size !== data[key].length) ctx.addIssue({ code: 'custom', message: `ID ${key} duplikat`, path: [key] });
});
