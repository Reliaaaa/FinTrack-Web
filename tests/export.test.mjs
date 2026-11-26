import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { csvText, exportWorkbook, transactionTotals } from '../src/lib/export.ts';

const entries = [
  { id: 'i', date: '2026-11-01', type: 'income', title: 'Gaji', category: 'Gaji', walletId: 'bank', amount: 100000 },
  { id: 'e', date: '2026-11-02', type: 'expense', title: 'Kopi, "pagi"', category: 'Makanan', walletId: 'cash', amount: 17000, note: 'Catatan\nbaris kedua' },
  { id: 't', date: '2026-11-03', type: 'transfer', title: '=literal', category: 'Transfer', walletId: 'bank', targetWalletId: 'cash', amount: 20000 },
];
const data = { name: 'Pengguna', entries, budgets: [], recurring: [], wallets: [
  { id: 'bank', name: 'Bank & Rekening', type: 'bank', openingBalance: 0, color: '#235347' },
  { id: 'cash', name: 'Tunai', type: 'cash', openingBalance: 0, color: '#8eb69b' },
] };

test('CSV keeps a rectangular ledger with numeric amounts and escaped text', () => {
  const csv = csvText(data, entries);
  assert.ok(csv.startsWith('\uFEFF"Tanggal","Tipe","Judul","Kategori","Dompet asal","Nominal (IDR)","Catatan","Dompet tujuan"\r\n'));
  assert.ok(csv.includes('"2026-11-03","Transfer","\'=literal","Transfer","Bank & Rekening",20000,"","Tunai"'));
  assert.ok(csv.includes('"Kopi, ""pagi""","Makanan","Tunai",17000,"Catatan\nbaris kedua"'));
  assert.equal(csvText(data, []).split('\r\n').length, 2);
});

test('XLSX has a styled summary and a filterable ledger with typed dates and amounts', async () => {
  assert.deepEqual(transactionTotals(entries), { income: 100000, expense: 17000, transfer: 20000, net: 83000 });
  const zip = await JSZip.loadAsync(await exportWorkbook(data, entries, new Date(2026, 10, 1)));
  const workbook = await zip.file('xl/workbook.xml').async('string');
  const summary = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const detail = await zip.file('xl/worksheets/sheet2.xml').async('string');
  assert.match(workbook, /name="Ringkasan".*name="Transaksi"/);
  assert.ok(zip.file('xl/styles.xml'));
  assert.match(summary, /November 2026/);
  assert.match(summary, /<c r="B7" s="5"><v>83000<\/v><\/c>/);
  assert.match(detail, /<pane ySplit="1"/);
  assert.match(detail, /<autoFilter ref="A1:H4"/);
  assert.match(detail, /<c r="A2" s="6"><v>\d+<\/v><\/c>/);
  assert.match(detail, /<c r="F2" s="5"><v>20000<\/v><\/c>/);
  assert.match(detail, /<c r="C2" s="4" t="inlineStr"><is><t xml:space="preserve">=literal<\/t>/);
  assert.match(detail, /Bank &amp; Rekening/);
  const empty = await JSZip.loadAsync(await exportWorkbook(data, []));
  assert.match(await empty.file('xl/worksheets/sheet2.xml').async('string'), /<autoFilter ref="A1:H1"/);
});
