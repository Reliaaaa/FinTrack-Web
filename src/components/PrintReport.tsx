import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { transactionRows, transactionTotals } from '@/lib/export';
import { dateLabel, monthLabel, rupiah } from '@/lib/format';
import type { Entry, FinanceData } from '@/lib/finance';

export function PrintReport({ data, entries, period }: { data: FinanceData; entries: readonly Entry[]; period: Date }) {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const prepare = () => flushSync(() => setPrinting(true));
    const finish = () => setPrinting(false);
    window.addEventListener('beforeprint', prepare);
    window.addEventListener('afterprint', finish);
    return () => {
      window.removeEventListener('beforeprint', prepare);
      window.removeEventListener('afterprint', finish);
    };
  }, []);

  if (!printing) return null;

  const rows = transactionRows(data, entries);
  const totals = transactionTotals(entries);
  return (
    <article className="print-report">
      <header className="print-report-header">
        <span className="print-report-brand">FinTrack</span>
        <h1>Laporan Keuangan Bulanan</h1>
        <p>{monthLabel(period)} · {rows.length} transaksi · IDR</p>
      </header>
      <dl className="print-report-totals">
        <div><dt>Pemasukan</dt><dd>{rupiah(totals.income)}</dd></div>
        <div><dt>Pengeluaran</dt><dd>{rupiah(totals.expense)}</dd></div>
        <div><dt>Arus kas bersih</dt><dd>{rupiah(totals.net)}</dd></div>
      </dl>
      <h2>Rincian transaksi</h2>
      <p className="print-report-note">Transfer antardompet sebesar {rupiah(totals.transfer)} tercatat di tabel dan tidak masuk arus kas bersih.</p>
      {rows.length ? (
        <table>
          <colgroup>
            <col className="print-date" /><col /><col className="print-wallet" /><col className="print-amount" />
          </colgroup>
          <thead><tr><th scope="col">Tanggal</th><th scope="col">Transaksi</th><th scope="col">Dompet</th><th scope="col">Nominal</th></tr></thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td>{dateLabel(row.date)}</td>
                <td><strong>{row.title}</strong><small>{row.type} · {row.category}</small>{row.note && <small className="print-report-entry-note">{row.note}</small>}</td>
                <td>{row.source || '—'}{row.destination && <small>Ke {row.destination}</small>}</td>
                <td className={`print-report-${row.kind}`}>{rupiah(row.kind === 'expense' ? -row.amount : row.amount, row.kind === 'income')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="print-report-empty">Belum ada transaksi pada periode ini.</p>}
      <footer>FinTrack · Laporan transaksi pribadi</footer>
    </article>
  );
}
