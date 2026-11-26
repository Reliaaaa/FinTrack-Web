import { useId, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, PiggyBank, Plus, Wallet as WalletIcon } from 'lucide-react';
import { isFundingWallet, investmentMovement, walletBalance, type Entry, type FinanceData, type InvestmentMovement, type Wallet } from '@/lib/finance';
import { dateLabel, rupiah } from '@/lib/format';
import { EditorModal } from './EditorModal';
import { MotionButton } from './MotionButton';

type SavingsCardsProps = {
  data: FinanceData;
  onCreate: () => void;
  onRename: (wallet: Wallet) => void;
  onRemove: (wallet: Wallet) => void;
  onTransfer: (movement: InvestmentMovement) => void;
  onAddWallet: () => void;
  onViewTransactions: () => void;
};

export function SavingsCards({ data, onCreate, onRename, onRemove, onTransfer, onAddWallet, onViewTransactions }: SavingsCardsProps) {
  const savings = data.wallets.filter(wallet => wallet.type === 'investment').map(wallet => ({
    wallet,
    balance: walletBalance(data, wallet.id),
  }));
  const fundingWallets = data.wallets.filter(wallet => isFundingWallet(wallet) && !wallet.archived);
  const canDeposit = fundingWallets.some(wallet => walletBalance(data, wallet.id) > 0);
  const history = data.entries.flatMap(entry => {
    const movement = investmentMovement(data.wallets, entry);
    return movement ? [{ entry, movement }] : [];
  });
  const usedSavings = new Set(history.map(({ movement }) => movement.investmentId));
  const recent = history.sort((a, b) => b.entry.date.localeCompare(a.entry.date)).slice(0, 5);
  const names = new Map(data.wallets.map(wallet => [wallet.id, wallet.name]));

  return <>
    <div className="wallet-summary card">
      <div>
        <span>Total dana tersimpan</span>
        <strong>{rupiah(savings.reduce((total, item) => total + item.balance, 0))}</strong>
        <small>{savings.length} simpanan</small>
      </div>
      <div className="wallet-summary-icon"><PiggyBank size={28} aria-hidden="true" /></div>
    </div>

    {!savings.length ? (
      <section className="card savings-empty">
        <div className="savings-icon"><PiggyBank size={24} aria-hidden="true" /></div>
        <h2>Belum ada simpanan</h2>
        <p>Buat simpanan untuk dana darurat, biaya sekolah, atau tujuan lain.</p>
        <MotionButton className="button button-dark" onClick={onCreate}><Plus size={17} /> Buat simpanan pertama</MotionButton>
      </section>
    ) : <>
      {!fundingWallets.length && (
        <div className="demo-banner">
          <WalletIcon size={17} aria-hidden="true" />
          <span>Tambahkan dompet bank, e-wallet, atau tunai untuk memindahkan dana.</span>
          <MotionButton onClick={onAddWallet}>Tambah dompet <ArrowRight size={15} /></MotionButton>
        </div>
      )}
      {fundingWallets.length > 0 && !canDeposit && (
        <p className="small-note">Catat pemasukan di dompet untuk mulai menyetor ke simpanan.</p>
      )}
      <div className="wallet-grid">
        {savings.map(({ wallet, balance }) => (
          <article className="card savings-card" key={wallet.id} aria-label={wallet.name}>
            <div className="savings-card-head">
              <div className="savings-icon"><PiggyBank size={19} aria-hidden="true" /></div>
              <MotionButton className="text-link" onClick={() => onRename(wallet)} aria-label={`Ubah nama ${wallet.name}`}>Ubah</MotionButton>
            </div>
            <div className="savings-balance">
              <h2>{wallet.name}</h2>
              <strong>{rupiah(balance)}</strong>
            </div>
            <div className="savings-actions">
              <MotionButton className="button button-dark" disabled={!canDeposit} onClick={() => onTransfer({ investmentId: wallet.id, direction: 'deposit' })}>
                <ArrowDownLeft size={16} aria-hidden="true" /> Setor
              </MotionButton>
              <MotionButton className="button button-outline" disabled={balance <= 0 || !fundingWallets.length} onClick={() => onTransfer({ investmentId: wallet.id, direction: 'withdrawal' })}>
                <ArrowUpRight size={16} aria-hidden="true" /> Tarik
              </MotionButton>
              {!usedSavings.has(wallet.id) && <MotionButton className="text-link savings-remove" onClick={() => onRemove(wallet)} aria-label={`Hapus ${wallet.name}`}>Hapus</MotionButton>}
            </div>
          </article>
        ))}
      </div>
      <section className="card padded-card savings-history" aria-labelledby="savings-history-title">
        <div className="section-heading">
          <div><h2 id="savings-history-title">Riwayat simpanan</h2></div>
          {history.length > 0 && <MotionButton className="text-link" onClick={onViewTransactions}>Semua transaksi <ArrowRight size={15} /></MotionButton>}
        </div>
        {recent.length ? <ul className="savings-activity">
          {recent.map(({ entry, movement }) => {
            const deposit = movement.direction === 'deposit';
            const Icon = deposit ? ArrowDownLeft : ArrowUpRight;
            return <li key={entry.id}>
              <span className="savings-icon"><Icon size={18} aria-hidden="true" /></span>
              <div className="savings-activity-details">
                <strong>{entry.title}</strong>
                <small>{names.get(entry.walletId)} → {names.get(entry.targetWalletId ?? '')} · {dateLabel(entry.date)}</small>
              </div>
              <strong className={deposit ? 'green-text' : undefined}>{deposit ? '+' : '−'}{rupiah(entry.amount)}</strong>
            </li>;
          })}
        </ul> : <p className="small-note">Setoran dan penarikan akan muncul di sini.</p>}
      </section>
    </>}
  </>;
}

type InvestmentTransferDialogProps = {
  movement: InvestmentMovement;
  entry?: Entry;
  data: FinanceData;
  initialDate: string;
  saving: boolean;
  onClose: () => void;
  onSave: (entry: Entry) => void;
};

export function InvestmentTransferDialog({ movement, entry, data, initialDate, saving, onClose, onSave }: InvestmentTransferDialogProps) {
  const balanceId = useId();
  const deposit = movement.direction === 'deposit';
  const investment = data.wallets.find(wallet => wallet.id === movement.investmentId);
  const previousWalletId = deposit ? entry?.walletId : entry?.targetWalletId;
  const wallets = data.wallets.filter(wallet => isFundingWallet(wallet) && (!wallet.archived || wallet.id === previousWalletId));
  const [walletId, setWalletId] = useState(() => previousWalletId ?? (
    deposit ? wallets.find(wallet => walletBalance(data, wallet.id) > 0)?.id : wallets[0]?.id
  ) ?? '');
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '');
  const [date, setDate] = useState(entry?.date ?? initialDate);
  const [error, setError] = useState('');
  const sourceId = deposit ? walletId : movement.investmentId;
  const targetId = deposit ? movement.investmentId : walletId;
  const available = walletBalance(data, sourceId, entry?.id);
  const action = deposit ? 'Setor dana' : 'Tarik dana';

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!wallets.some(wallet => wallet.id === walletId) || !investment) {
      setError('Pilih dompet untuk transfer ini.');
      return;
    }
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000_000) {
      setError('Masukkan nominal antara Rp1 dan Rp1.000.000.000.000.');
      return;
    }
    if (value > available) {
      setError(deposit ? 'Saldo dompet asal tidak cukup.' : 'Saldo simpanan tidak cukup.');
      return;
    }
    if (entry?.targetWalletId && walletBalance(data, entry.targetWalletId, entry.id) +
      (entry.targetWalletId === targetId ? value : 0) < 0) {
      setError('Saldo tujuan sebelumnya tidak cukup untuk mengubah transfer ini.');
      return;
    }
    onSave({
      ...entry,
      id: entry?.id ?? crypto.randomUUID(),
      type: 'transfer',
      title: deposit ? 'Setoran simpanan' : 'Penarikan simpanan',
      category: 'Investasi',
      walletId: sourceId,
      targetWalletId: targetId,
      amount: value,
      date,
    });
  }

  return <EditorModal title={entry ? (deposit ? 'Ubah setoran' : 'Ubah penarikan') : action} eyebrow={investment?.name} submitLabel={entry ? 'Simpan perubahan' : action} saving={saving} error={error} onClose={onClose} onSubmit={submit}>
    <label>
      {deposit ? 'Dompet sumber' : 'Dompet tujuan'}
      <select value={walletId} onChange={event => setWalletId(event.target.value)} required>
        <option value="">Pilih dompet</option>
        {wallets.map(wallet => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}{wallet.archived ? ' (diarsipkan)' : ''}
          </option>
        ))}
      </select>
    </label>
    <label>
      Nominal rupiah
      <div className="amount-input">
        <span>Rp</span>
        <input inputMode="numeric" aria-describedby={balanceId} value={amount} onChange={event => setAmount(event.target.value.replace(/[^\d]/g, ''))} placeholder="0" required />
      </div>
    </label>
    <span className="savings-available" id={balanceId}>Saldo tersedia {rupiah(Math.max(available, 0))}</span>
    <label>Tanggal<input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label>
    <p className="savings-available">Untuk rekening bank dan e-wallet, lakukan transfer di aplikasi penyedia lalu catat di FinTrack.</p>
  </EditorModal>;
}
