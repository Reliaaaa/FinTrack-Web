'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowDownRight, ArrowLeftRight, ArrowRight, ArrowUpRight, BarChart3, Bell, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard, Download, FileText, Filter, LayoutDashboard, LogOut, Menu, Moon, MoreHorizontal, Plus, Repeat2, Search, Settings, ShieldCheck, Sun, Trash2, TrendingUp, Wallet as WalletIcon, X } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Budget, categoryColors, Entry, EntryType, expenseCategories, FinanceData, incomeCategories, monthKey, budgetsForMonth, newFinanceData, Recurring, seedData, Wallet, walletBalance } from '@/lib/finance';
import { byCategory, cashflow, metrics } from '@/lib/metrics';
import { compact, dateLabel, monthLabel, rupiah } from '@/lib/format';
import { download, downloadCsv, downloadIcs, downloadXlsx } from '@/lib/export';
import { MotionButton, RollingLabel } from './MotionButton';
import { SidebarNav } from './SidebarNav';

type Tab = 'dashboard' | 'transactions' | 'wallets' | 'budgets' | 'recurring' | 'reports' | 'settings';
type Editor = { kind: 'transaction'; item?: Entry } | { kind: 'wallet'; item?: Wallet } | { kind: 'budget'; item?: Budget } | { kind: 'recurring'; item?: Recurring } | null;
type AuthOptions = { google: boolean; passwordReset: boolean };
type AccountSnapshot = { user: { id: string }; version: string; data: FinanceData };
const nav: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard }, { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight }, { id: 'wallets', label: 'Dompet & Akun', icon: WalletIcon }, { id: 'budgets', label: 'Anggaran', icon: BarChart3 }, { id: 'recurring', label: 'Tagihan Berulang', icon: Repeat2 }, { id: 'reports', label: 'Laporan & Analitik', icon: TrendingUp }, { id: 'settings', label: 'Pengaturan', icon: Settings },
];
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const id = () => crypto.randomUUID();
const money = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;
const demoKey = 'fintrack-demo-v1';
const localModeKey = 'fintrack-local-mode';
const sessionChangeKey = 'fintrack-session-change';
const draftKey = (accountId: string) => `fintrack-pending-change:${accountId}`;

function signalSessionChange() {
  try { localStorage.setItem(sessionChangeKey, crypto.randomUUID()); } catch { /* verify when the tab gains focus */ }
}

function readDemoData(startEmpty = false): FinanceData {
  try {
    const raw = localStorage.getItem(demoKey);
    if (raw) return JSON.parse(raw);
  } catch { /* fall back to sample data */ }
  return startEmpty ? newFinanceData('Pengguna') : seedData();
}

export default function FinanceApp({ startOnLogin = false }: { startOnLogin?: boolean }) {
  const [data, setData] = useState<FinanceData>(() => seedData());
  const [ready, setReady] = useState(false);
  const [serverMode, setServerMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(startOnLogin);
  const [accountEnabled, setAccountEnabled] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [authOptions, setAuthOptions] = useState<AuthOptions>({ google: false, passwordReset: false });
  const [serviceIssue, setServiceIssue] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [checkingSession, setCheckingSession] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const versionRef = useRef('1');
  const accountRef = useRef('');
  const savingRef = useRef(false);
  const [tab, setTabState] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState(() => new Date());
  const [dark, setDark] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const editorOpener = useRef<HTMLElement | null>(null);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const restoreAccount = useCallback((snapshot: AccountSnapshot) => {
    try { sessionStorage.removeItem(localModeKey); } catch { /* use the account session */ }
    if (startOnLogin) {
      signalSessionChange();
      location.replace('/');
      return;
    }
    accountRef.current = snapshot.user.id;
    versionRef.current = snapshot.version;
    let draft: FinanceData | undefined;
    try {
      const raw = sessionStorage.getItem(draftKey(snapshot.user.id));
      if (raw) {
        const pending = JSON.parse(raw) as FinanceData;
        if (pending && Array.isArray(pending.wallets) && Array.isArray(pending.entries)
          && Array.isArray(pending.budgets) && Array.isArray(pending.recurring)) draft = pending;
      }
    } catch { /* use the server snapshot */ }
    setData(draft ?? snapshot.data);
    setConflict(Boolean(draft));
    setServerMode(true);
    setLocalMode(false);
    setAuthRequired(false);
    setAuthNotice('');
    setCheckingSession(false);
    signalSessionChange();
  }, [startOnLogin]);

  const hideAccount = useCallback((notice = '') => {
    accountRef.current = '';
    setData(seedData());
    setConflict(false);
    setEditor(null);
    setMobileMenu(false);
    setServerMode(false);
    setAuthNotice(notice);
    setAuthRequired(true);
    setCheckingSession(false);
    setToast('');
  }, []);

  useEffect(() => {
    let disposed = false;
    let checking = false;
    let sessionChanged = false;
    const verifySession = async () => {
      const accountId = accountRef.current;
      if (!accountId || checking) return;
      const mustVerify = sessionChanged;
      sessionChanged = false;
      checking = true;
      try {
        const response = await fetch('/api/v1/auth/me', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (!response.ok && response.status !== 401) throw new Error('Gagal memeriksa sesi');
        const changed = response.status === 401 || (await response.json()).user?.id !== accountId;
        if (changed && !disposed && accountRef.current === accountId) hideAccount('Sesi akun berubah. Silakan masuk untuk melanjutkan.');
      } catch {
        if (mustVerify && !disposed && accountRef.current === accountId) hideAccount('Sesi belum dapat diperiksa. Silakan masuk lagi.');
      } finally {
        checking = false;
        if (sessionChanged && !disposed) void verifySession();
        else if (mustVerify && !disposed) setCheckingSession(false);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== sessionChangeKey || !accountRef.current) return;
      sessionChanged = true;
      setCheckingSession(true);
      void verifySession();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void verifySession();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', verifySession);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', verifySession);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hideAccount]);

  useEffect(() => {
    const savedTab = location.pathname.slice(1) as Tab;
    if (nav.some(n => n.id === savedTab)) setTabState(savedTab);
    const onPop = () => { const path = location.pathname.slice(1) as Tab; setTabState(nav.some(n => n.id === path) ? path : 'dashboard'); };
    window.addEventListener('popstate', onPop);
    try { setDark(localStorage.getItem('fintrack-theme') === 'dark'); } catch { /* use the default theme */ }
    (async () => {
      try {
        if (!startOnLogin) {
          let local = new URLSearchParams(location.search).get('mode') === 'lokal';
          try {
            local ||= sessionStorage.getItem(localModeKey) === '1';
            if (local) sessionStorage.setItem(localModeKey, '1');
          } catch { /* the URL still works when storage is restricted */ }
          if (local) {
            setLocalMode(true);
            setData(readDemoData(true));
            return;
          }
        }
        const response = await fetch('/api/v1/bootstrap', { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        const body = await response.json();
        if (response.status >= 500) {
          setServiceIssue(body.error || 'Server sedang tidak tersedia. Mode demo lokal aktif.');
          setData(readDemoData());
        } else if (body.configured) {
          setAccountEnabled(true);
          if (body.authOptions) setAuthOptions(body.authOptions);
          if (response.status === 401) setAuthRequired(true);
          else if (response.ok && body.user?.id && body.data && body.version) restoreAccount(body);
          else throw new Error('Respons akun tidak lengkap');
        } else {
          setData(readDemoData());
        }
      } catch {
        setServiceIssue('Koneksi server gagal. Mode demo lokal aktif; perubahan di sini tidak tersinkron ke akun.');
        setData(readDemoData());
      } finally { setReady(true); }
    })();
    return () => window.removeEventListener('popstate', onPop);
  }, [restoreAccount, startOnLogin]);

  useEffect(() => { if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { if (ready) localStorage.setItem('fintrack-theme', dark ? 'dark' : 'light'); } catch { /* the current theme still applies */ }
  }, [dark, ready]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  const setTab = (next: Tab) => {
    setTabState(next);
    setMobileMenu(false);
    history.pushState(null, '', next === 'dashboard' ? '/' : `/${next}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const openEditor = (next: Editor) => {
    editorOpener.current = document.activeElement as HTMLElement;
    if ((next?.kind === 'transaction' || next?.kind === 'recurring') && !next.item && !data.wallets.some(wallet => !wallet.archived)) {
      setToast('Tambahkan dompet aktif terlebih dahulu.');
      setEditor({ kind: 'wallet' });
      return;
    }
    setEditor(next);
  };
  const closeEditor = () => { setEditor(null); requestAnimationFrame(() => editorOpener.current?.focus()); };
  const commit = async (next: FinanceData, message: string) => {
    if (serverMode && conflict) { setToast('Selesaikan konflik data sebelum menyimpan lagi.'); return false; }
    if (savingRef.current) { setToast('Tunggu hingga perubahan sebelumnya selesai disimpan.'); return false; }
    const previous = data;
    setData(next);
    if (serverMode) {
      savingRef.current = true; setSaving(true);
      const accountId = accountRef.current;
      try {
        const response = await fetch('/api/v1/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId, version: versionRef.current, data: next }) });
        if (response.status === 401 || response.status === 412) {
          try { sessionStorage.setItem(draftKey(accountId), JSON.stringify(next)); } catch { /* still clear the screen */ }
          if (accountId === accountRef.current) hideAccount('Sesi akun berubah. Silakan masuk untuk melanjutkan.');
          return false;
        }
        if (response.status === 409) {
          sessionStorage.setItem(draftKey(accountId), JSON.stringify(next));
          if (accountId !== accountRef.current) return false;
          setConflict(true);
          setToast('Perubahan di perangkat lain terdeteksi. Draf lokal tetap tersimpan.');
          return true;
        }
        if (accountId !== accountRef.current) return false;
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal menyimpan');
        const { version } = await response.json();
        if (accountId !== accountRef.current) return false;
        versionRef.current = version;
      } catch (error) {
        if (accountId === accountRef.current) {
          setData(previous);
          setToast(error instanceof Error ? error.message : 'Gagal menyimpan');
        }
        return false;
      }
      finally { savingRef.current = false; setSaving(false); }
    } else {
      try { localStorage.setItem(demoKey, JSON.stringify(next)); }
      catch { setData(previous); setToast('Penyimpanan browser penuh. Ekspor data dan hapus struk lama.'); return false; }
    }
    setToast(message);
    return true;
  };
  const saveConflictDraft = () => download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'fintrack-draf-konflik.json');
  const loadLatest = async () => {
    const accountId = accountRef.current;
    saveConflictDraft();
    try {
      const response = await fetch('/api/v1/bootstrap', { cache: 'no-store' });
      if (response.status === 401 && accountRef.current === accountId) {
        hideAccount('Sesi akun berubah. Silakan masuk untuk melanjutkan.');
        return;
      }
      if (!response.ok) throw new Error('Gagal mengambil data terbaru');
      const body = await response.json();
      if (accountRef.current !== accountId) return;
      if (body.user?.id !== accountId) {
        hideAccount('Sesi akun berubah. Silakan masuk untuk melanjutkan.');
        return;
      }
      if (!body.data || !body.version) throw new Error('Respons server tidak lengkap');
      setData(body.data); versionRef.current = body.version; setConflict(false);
      sessionStorage.removeItem(draftKey(accountId));
      setToast('Data server terbaru dimuat. Draf lokal sudah diunduh.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Gagal memuat data'); }
  };
  const current = useMemo(() => metrics(data, period), [data, period]);
  const categories = useMemo(() => byCategory(data, period), [data, period]);
  const trend = useMemo(() => cashflow(data, period), [data, period]);
  const activeWallets = data.wallets.filter(w => !w.archived);
  const enterLocalMode = () => {
    try { sessionStorage.setItem(localModeKey, '1'); } catch { /* the URL carries the choice */ }
    if (startOnLogin) {
      location.assign('/?mode=lokal');
      return;
    }
    accountRef.current = '';
    setData(readDemoData(true));
    setServerMode(false);
    setLocalMode(true);
    setAuthRequired(false);
    setConflict(false);
    setServiceIssue('');
  };
  const logout = async () => {
    if (savingRef.current) { setToast('Tunggu hingga perubahan selesai disimpan.'); return; }
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Gagal keluar. Coba lagi.');
      hideAccount();
      signalSessionChange();
    } catch { setToast('Gagal keluar. Coba lagi.'); }
  };
  const deleteEntry = (entry: Entry) => { if (confirm(`Hapus transaksi “${entry.title}”?`)) commit({ ...data, entries: data.entries.filter(e => e.id !== entry.id) }, 'Transaksi dihapus'); };
  const deleteWallet = (wallet: Wallet) => {
    if (data.entries.some(e => e.walletId === wallet.id || e.targetWalletId === wallet.id) || data.recurring.some(r => r.walletId === wallet.id)) { setToast('Dompet masih dipakai transaksi atau jadwal. Arsipkan saja.'); return; }
    if (confirm(`Hapus dompet “${wallet.name}”?`)) commit({ ...data, wallets: data.wallets.filter(w => w.id !== wallet.id) }, 'Dompet dihapus');
  };
  const saveEditor = async (item: Entry | Wallet | Budget | Recurring) => {
    if (!editor) return;
    let saved = false;
    if (editor.kind === 'transaction') {
      const next = item as Entry;
      saved = await commit({ ...data, entries: editor.item ? data.entries.map(e => e.id === next.id ? next : e) : [next, ...data.entries] }, 'Transaksi tersimpan');
    } else if (editor.kind === 'wallet') {
      const next = item as Wallet;
      saved = await commit({ ...data, wallets: editor.item ? data.wallets.map(w => w.id === next.id ? next : w) : [...data.wallets, next] }, 'Dompet tersimpan');
    } else if (editor.kind === 'budget') {
      const next = item as Budget;
      saved = await commit({ ...data, budgets: editor.item ? data.budgets.map(b => b.id === next.id ? next : b) : [...data.budgets, next] }, 'Anggaran tersimpan');
    } else {
      const next = item as Recurring;
      saved = await commit({ ...data, recurring: editor.item ? data.recurring.map(r => r.id === next.id ? next : r) : [...data.recurring, next] }, 'Jadwal tersimpan');
    }
    if (saved) closeEditor();
  };
  if (!ready) return <div className="loading-screen"><div className="logo-mark"><TrendingUp size={23} /></div><span>Menyiapkan FinTrack…</span></div>;
  if (authRequired) return <AuthScreen available={accountEnabled} connectionIssue={Boolean(serviceIssue)} options={authOptions} sessionNotice={authNotice} onSuccess={async () => {
    const response = await fetch('/api/v1/bootstrap', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok || !body.user?.id || !body.data || !body.version) throw new Error('Gagal memuat akun. Coba lagi.');
    if (body.authOptions) setAuthOptions(body.authOptions);
    setServiceIssue('');
    restoreAccount(body);
  }} onLocal={enterLocalMode} />;
  return <>
  {checkingSession && <div className="loading-screen" role="status">Memeriksa sesi akun…</div>}
  <div className="app-shell" style={checkingSession ? { display: 'none' } : undefined}>
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <MotionButton className="brand" onClick={() => setTab('dashboard')} aria-label="FinTrack, buka dasbor"><span className="logo-mark"><TrendingUp size={21} strokeWidth={2.6} /></span><span><strong><RollingLabel>FinTrack</RollingLabel></strong><small>KEUANGAN PRIBADI</small></span></MotionButton>
      <MotionButton className="button button-dark sidebar-cta" onClick={() => openEditor({ kind: 'transaction' })}><Plus size={18} /> Catat Transaksi</MotionButton>
      <p className="sidebar-caption">MENU UTAMA</p>
      <SidebarNav items={nav} active={tab} onSelect={setTab} />
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19} /><strong>Butuh bantuan?</strong><p>Pahami arus kas Anda dengan FinTrack.</p><a href="https://github.com/Reliaaaa/FinTrack-Web#readme" target="_blank" rel="noreferrer"><RollingLabel>Lihat panduan</RollingLabel> <ArrowRight size={14} /></a></div><MotionButton className="profile-button" onClick={() => setTab('settings')}><span className="avatar">{data.name.charAt(0).toUpperCase()}</span><span><strong><RollingLabel>{data.name}</RollingLabel></strong><small>{serverMode ? 'Akun pribadi' : 'Mode demo lokal'}</small></span><MoreHorizontal size={17} /></MotionButton></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><MotionButton className="icon-button mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Buka menu"><Menu size={22} /></MotionButton><span className="topbar-title">{nav.find(n => n.id === tab)?.label}</span><span className="topbar-divider" /><span className="topbar-subtitle">Ruang keuangan Anda</span>{saving && <span className="status-pill blue" role="status">Menyimpan…</span>}</div><div className="topbar-actions"><label className="period-select"><CalendarDays size={16} /><input type="month" aria-label="Pilih bulan" value={`${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`} onChange={e => { if (e.target.value) { const [year, month] = e.target.value.split('-').map(Number); setPeriod(new Date(year, month - 1, 1)); } }} /></label><MotionButton className="search-trigger" onClick={() => setTab('transactions')}><Search size={17} /> Cari transaksi...</MotionButton><MotionButton className="icon-button" aria-label={dark ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</MotionButton><MotionButton className="icon-button notification" aria-label="Lihat anggaran" onClick={() => setTab('budgets')}><Bell size={19} />{budgetsForMonth(data, period).some(b => current.entries.filter(e => e.type === 'expense' && e.category === b.category).reduce((a, e) => a + e.amount, 0) >= b.limit * .8) && <i />}</MotionButton><span className="avatar header-avatar">{data.name.charAt(0).toUpperCase()}</span></div></header>
      <main className="content">
        {!serverMode && <div className="demo-banner" role={serviceIssue ? 'alert' : undefined}>
          <ShieldCheck size={17} />
          <span><strong>{serviceIssue ? 'Server tidak tersedia.' : localMode ? 'Mode lokal.' : 'Mode demo.'}</strong> {serviceIssue || 'Data tersimpan di browser ini.'}</span>
          <a href="/login"><RollingLabel>Masuk / Daftar</RollingLabel> <ArrowRight size={14} /></a>
        </div>}
        {serverMode && conflict && <div className="demo-banner" role="alert"><ShieldCheck size={17} /><span><strong>Konflik data.</strong> Perubahan lokal Anda tersimpan sebagai draf di browser. Unduh salinannya sebelum memakai data server terbaru.</span><MotionButton onClick={saveConflictDraft}>Unduh draf <Download size={14} /></MotionButton><MotionButton onClick={loadLatest}>Muat data terbaru <ArrowRight size={14} /></MotionButton></div>}
        {tab === 'dashboard' && <Dashboard data={data} current={current} categories={categories} trend={trend} period={period} open={openEditor} go={setTab} />}
        {tab === 'transactions' && <Transactions data={data} entries={data.entries} open={openEditor} remove={deleteEntry} />}
        {tab === 'wallets' && <Wallets data={data} open={openEditor} remove={deleteWallet} commit={commit} />}
        {tab === 'budgets' && <Budgets data={data} current={current} period={period} open={openEditor} commit={commit} />}
        {tab === 'recurring' && <RecurringPage data={data} open={openEditor} commit={commit} serverMode={serverMode} />}
        {tab === 'reports' && <Reports data={data} current={current} categories={categories} trend={trend} period={period} />}
        {tab === 'settings' && <SettingsPage data={data} dark={dark} setDark={setDark} commit={commit} serverMode={serverMode} onLogout={logout} />}
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Navigasi bawah">{(['dashboard', 'transactions', 'budgets', 'wallets'] as Tab[]).map((item, index) => { const n = nav.find(x => x.id === item)!; return <div className="bottom-slot" key={item}>{index === 2 && <MotionButton className="mobile-add" onClick={() => openEditor({ kind: 'transaction' })} aria-label="Catat transaksi"><Plus size={25} /></MotionButton>}<MotionButton className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}><n.icon size={20} />{item === 'dashboard' ? 'Dasbor' : item === 'transactions' ? 'Transaksi' : item === 'budgets' ? 'Anggaran' : 'Dompet'}</MotionButton></div>; })}</nav>
    {editor && <EditorDialog editor={editor} data={data} period={period} saving={saving} onClose={closeEditor} onSave={saveEditor} />}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}<MotionButton onClick={() => setToast('')} aria-label="Tutup notifikasi"><X size={15} /></MotionButton></div>}
    {mobileMenu && <MotionButton className="menu-backdrop" aria-label="Tutup menu" onClick={() => setMobileMenu(false)} />}
  </div>
  </>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-actions">{action}</div>}</div>; }
function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }
function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) { return <div className="empty-state"><span className="empty-icon"><FileText size={24} /></span><h3>{title}</h3><p>{detail}</p>{action}</div>; }
function BudgetBar({ spent, limit }: { spent: number; limit: number }) { const percent = limit ? Math.round(spent / limit * 100) : 0; return <><div className="progress-track" role="progressbar" aria-valuenow={spent} aria-valuemin={0} aria-valuemax={limit} aria-label="Penggunaan anggaran"><span className={percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : ''} style={{ width: `${Math.min(100, percent)}%` }} /></div><div className="progress-label"><span>Terpakai {rupiah(spent)}</span><span>dari {rupiah(limit)}</span></div></>; }
function EntrySymbol({ type }: { type: EntryType }) { return <span className={`entry-symbol ${type}`}>{type === 'income' ? <ArrowDownLeft size={18} /> : type === 'transfer' ? <ArrowLeftRight size={17} /> : <ArrowUpRight size={18} />}</span>; }
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) { if (!active || !payload?.length) return null; return <div className="chart-tip"><strong>{label}</strong>{payload.map(p => <div key={p.name}><span style={{ background: p.color }} />{p.name}: {rupiah(p.value)}</div>)}</div>; }

function Dashboard({ data, current, categories, trend, period, open, go }: {
  data: FinanceData;
  current: ReturnType<typeof metrics>;
  categories: ReturnType<typeof byCategory>;
  trend: ReturnType<typeof cashflow>;
  period: Date;
  open: (editor: Editor) => void;
  go: (tab: Tab) => void;
}) {
  const budgets = budgetsForMonth(data, period);
  const recent = [...data.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const upcoming = data.recurring
    .filter(item => item.active && item.type === 'expense')
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 4);
  const cards = [
    { label: 'Kekayaan bersih', value: current.balance, icon: WalletIcon, detail: data.wallets.length + ' dompet tercatat' },
    { label: 'Pemasukan', value: current.income, icon: ArrowDownLeft, detail: 'Total pada bulan terpilih' },
    { label: 'Pengeluaran', value: current.expense, icon: ArrowUpRight, detail: 'Total pada bulan terpilih' },
    { label: 'Sisa anggaran', value: current.budgetLimit ? current.budgetRemaining : null, icon: ShieldCheck, detail: current.budgetLimit ? Math.round(current.spending / current.budgetLimit * 100) + '% terpakai' : 'Belum ada anggaran' },
  ];
  const chartColors = ['#235347', '#8eb69b', '#467d6d', '#aecdb4', '#688f7c', '#163832'];
  const visibleCategories = categories.slice(0, 5);
  if (categories.length > 5) {
    visibleCategories.push({ name: 'Kategori lainnya', value: categories.slice(5).reduce((total, item) => total + item.value, 0) });
  }
  let offset = 0;
  const segments = visibleCategories.map((category, index) => {
    const start = offset;
    offset += category.value / current.expense * 100;
    return chartColors[index] + ' ' + start + '% ' + offset + '%';
  });

  return <section className="dashboard-overview">
    <PageHeading
      eyebrow={'Ringkasan · ' + monthLabel(period)}
      title={'Selamat datang, ' + data.name + '!'}
      description="Pantau saldo, pengeluaran, dan tagihan dalam satu tempat."
      action={<MotionButton className="button button-outline" onClick={() => window.print()}><Download size={17} /> Unduh ringkasan</MotionButton>}
    />
    <div className="kpi-grid">
      {cards.map((card, index) => <div className={`card kpi-card ${index === 0 ? 'kpi-primary' : ''}`} key={card.label}>
        <div className="kpi-head"><span>{card.label}</span><span className="kpi-icon"><card.icon size={19} /></span></div>
        <strong className="kpi-value">{card.value === null ? '—' : rupiah(card.value)}</strong>
        <p className="kpi-caption">{card.detail}</p>
      </div>)}
    </div>

    <div className="dashboard-chart-grid">
      <div className="card donut-card">
        <SectionHeading title="Pengeluaran per Kategori" subtitle={monthLabel(period)} />
        {visibleCategories.length ? <div className="donut-layout">
          <div className="donut-wrap">
            <div className="donut-ring" aria-hidden="true" style={{ background: 'conic-gradient(' + segments.join(',') + ')' }} />
            <div className="donut-center"><span>Total belanja</span><strong>{compact(current.expense)}</strong></div>
          </div>
          <div className="category-legend">
            {visibleCategories.map((item, index) => <div key={item.name}>
              <span><i style={{ background: chartColors[index] }} /><span title={item.name}>{item.name}</span></span>
              <strong>{rupiah(item.value)}</strong>
            </div>)}
          </div>
        </div> : <Empty title="Belum ada pengeluaran" detail="Kategori akan muncul setelah Anda mencatat pengeluaran." />}
      </div>
      <div className="card chart-card">
        <SectionHeading title="Arus Kas" subtitle="Pemasukan dan pengeluaran enam bulan terakhir" action={<MotionButton className="text-link" onClick={() => go('reports')}>Laporan <ArrowRight size={15} /></MotionButton>} />
        <div className="chart-legend"><span><i className="income-dot" /> Pemasukan</span><span><i className="expense-dot" /> Pengeluaran</span></div>
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} barGap={4} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 4" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={value => `${value / 1_000_000} jt`} width={38} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="var(--chart-income)" radius={[5, 5, 0, 0]} maxBarSize={24} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="var(--chart-expense)" radius={[5, 5, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="dashboard-bottom-grid">
      <div className="card padded-card">
        <SectionHeading title="Tagihan Berikutnya" action={<MotionButton className="text-link" onClick={() => go('recurring')}>Jadwal <ArrowRight size={14} /></MotionButton>} />
        {upcoming.length ? <div className="recent-list">
          {upcoming.map(item => <div className="recent-row" key={item.id}>
            <span className="bill-icon"><CalendarDays size={15} /></span>
            <div className="recent-details"><strong>{item.title}</strong><span>{dateLabel(item.nextDate)}</span></div>
            <strong className="amount">{rupiah(item.amount)}</strong>
          </div>)}
        </div> : <Empty title="Belum ada tagihan terjadwal" detail="Tambahkan jadwal untuk melihat tagihan berikutnya." />}
      </div>
      <div className="card padded-card">
        <SectionHeading title="Status Anggaran" action={<MotionButton className="text-link" onClick={() => go('budgets')}>Kelola <ArrowRight size={14} /></MotionButton>} />
        {budgets.length ? <div className="budget-mini-list">
          {budgets.slice(0, 3).map(budget => {
            const spent = categories.find(category => category.name === budget.category)?.value ?? 0;
            const percent = Math.round(spent / budget.limit * 100);
            return <div className="budget-mini" key={budget.id}>
              <div className="budget-title"><span>{budget.category}</span><strong className={percent >= 80 ? 'warning-text' : ''}>{percent}%</strong></div>
              <BudgetBar spent={spent} limit={budget.limit} />
            </div>;
          })}
        </div> : <Empty title="Belum ada anggaran" detail="Tetapkan batas belanja untuk mulai memantau." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'budget' })}>Atur anggaran</MotionButton>} />}
      </div>
      <div className="card padded-card">
        <SectionHeading title="Transaksi Terbaru" action={<MotionButton className="text-link" onClick={() => go('transactions')}>Lihat semua <ArrowRight size={14} /></MotionButton>} />
        {recent.length ? <div className="recent-list">
          {recent.map(entry => <div className="recent-row" key={entry.id}>
            <EntrySymbol type={entry.type} />
            <div className="recent-details"><strong>{entry.title}</strong><span>{entry.category} · {dateLabel(entry.date)}</span></div>
            <strong className={`amount ${entry.type}`}>{entry.type === 'expense' ? '-' : entry.type === 'income' ? '+' : ''}{rupiah(entry.amount)}</strong>
          </div>)}
        </div> : <Empty title="Belum ada transaksi" detail="Pilih Catat Transaksi untuk mulai." />}
      </div>
    </div>
  </section>;
}

function Transactions({ data, entries, open, remove }: { data: FinanceData; entries: Entry[]; open: (editor: Editor) => void; remove: (entry: Entry) => void }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [wallet, setWallet] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const filtered = [...entries].filter(e => (type === 'all' || e.type === type) && (wallet === 'all' || e.walletId === wallet) && (categoryFilter === 'all' || e.category === categoryFilter) && (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate) && `${e.title} ${e.category} ${e.note || ''} ${e.amount}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const visible = filtered.slice((Math.min(page, pages) - 1) * 10, Math.min(page, pages) * 10);
  return <><PageHeading eyebrow="BUKU BESAR" title="Semua Transaksi" description="Cari, saring, dan kelola setiap pergerakan uang Anda." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'transaction' })}><Plus size={18} /> Catat Transaksi</MotionButton>} /><div className="card filter-card"><div className="field-search"><Search size={18} /><input aria-label="Cari transaksi" placeholder="Cari transaksi, kategori, nominal..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></div><div className="filter-controls"><label className="select-wrap"><WalletIcon size={16} /><select aria-label="Filter dompet" value={wallet} onChange={e => { setWallet(e.target.value); setPage(1); }}><option value="all">Semua dompet</option>{data.wallets.map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select><ChevronDown size={14} /></label><label className="select-wrap"><Filter size={16} /><select aria-label="Filter tipe" value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="all">Semua tipe</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option></select><ChevronDown size={14} /></label><MotionButton className="button button-outline" onClick={() => downloadCsv(data, filtered)}><Download size={16} /> CSV</MotionButton></div></div><div className="filter-extra"><label>Kategori<select aria-label="Filter kategori" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}><option value="all">Semua kategori</option>{[...new Set(entries.map(e => e.category))].sort().map(c => <option key={c}>{c}</option>)}</select></label><label>Dari tanggal<input aria-label="Dari tanggal" type="date" value={startDate} max={endDate || undefined} onChange={e => { setStartDate(e.target.value); setPage(1); }} /></label><label>Sampai tanggal<input aria-label="Sampai tanggal" type="date" value={endDate} min={startDate || undefined} onChange={e => { setEndDate(e.target.value); setPage(1); }} /></label></div><div className="card table-card"><div className="table-top"><div><h2>Riwayat Transaksi</h2><p>{filtered.length} transaksi ditemukan</p></div><span className="subtle-badge">Terbaru dulu</span></div>{visible.length ? <><div className="table-scroll"><table><thead><tr><th>TANGGAL</th><th>TRANSAKSI</th><th>KATEGORI</th><th>DOMPET</th><th className="align-right">NOMINAL</th><th className="align-right">AKSI</th></tr></thead><tbody>{visible.map(entry => <tr key={entry.id}><td className="muted-cell">{dateLabel(entry.date)}</td><td><div className="table-title"><EntrySymbol type={entry.type} /><span><strong>{entry.title}</strong><small>{entry.note || (entry.type === 'transfer' ? `Ke ${data.wallets.find(w => w.id === entry.targetWalletId)?.name || 'dompet lain'}` : entry.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}</small></span></div></td><td><span className="category-badge"><i style={{ background: categoryColors[entry.category] || '#94a3b8' }} />{entry.category}</span></td><td className="muted-cell">{data.wallets.find(w => w.id === entry.walletId)?.name || 'Dompet dihapus'}</td><td className={`align-right amount ${entry.type}`}>{entry.type === 'expense' ? '-' : entry.type === 'income' ? '+' : ''}{rupiah(entry.amount)}</td><td className="align-right"><MotionButton className="row-action" onClick={() => open({ kind: 'transaction', item: entry })} aria-label={`Ubah ${entry.title}`}>Ubah</MotionButton><MotionButton className="row-action delete" onClick={() => remove(entry)} aria-label={`Hapus ${entry.title}`}><Trash2 size={16} /></MotionButton></td></tr>)}</tbody></table></div><div className="table-bottom"><span>Menampilkan {visible.length} dari {filtered.length} transaksi</span><div><MotionButton disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</MotionButton><span>{Math.min(page, pages)} / {pages}</span><MotionButton disabled={page >= pages} onClick={() => setPage(page + 1)}>Berikutnya</MotionButton></div></div></> : <Empty title="Tidak ada transaksi" detail="Coba ubah filter atau catat transaksi baru." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'transaction' })}>Catat transaksi</MotionButton>} />}</div></>;
}

function Wallets({ data, open, remove, commit }: { data: FinanceData; open: (editor: Editor) => void; remove: (wallet: Wallet) => void; commit: (next: FinanceData, message: string) => void }) {
  const active = data.wallets.filter(w => !w.archived);
  return <><PageHeading eyebrow="SUMBER DANA" title="Dompet & Akun" description="Semua saldo Anda, tersusun dalam satu tempat." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'wallet' })}><Plus size={18} /> Tambah Dompet</MotionButton>} /><div className="wallet-summary card"><div><span>Total saldo gabungan</span><strong>{rupiah(active.reduce((a, w) => a + walletBalance(data, w.id), 0))}</strong><small>Dari {active.length} dompet aktif</small></div><div className="wallet-summary-icon"><WalletIcon size={29} /></div></div><div className="wallet-grid">{active.map((wallet, index) => <div className={`wallet-card card ${index === 0 ? 'featured' : ''}`} key={wallet.id}><div className="wallet-card-top"><span className="wallet-card-icon" style={{ color: wallet.color }}><CreditCard size={21} /></span><span className="wallet-type">{wallet.type === 'bank' ? 'REKENING BANK' : wallet.type === 'ewallet' ? 'E-WALLET' : wallet.type === 'credit' ? 'KARTU KREDIT' : 'TUNAI'}</span></div><div><h2>{wallet.name}</h2><span>Saldo saat ini</span><strong>{rupiah(walletBalance(data, wallet.id))}</strong></div><div className="wallet-card-actions"><MotionButton onClick={() => open({ kind: 'wallet', item: wallet })}>Ubah</MotionButton><MotionButton onClick={() => commit({ ...data, wallets: data.wallets.map(w => w.id === wallet.id ? { ...w, archived: true } : w) }, 'Dompet diarsipkan')}>Arsipkan</MotionButton><MotionButton className="delete" onClick={() => remove(wallet)}>Hapus</MotionButton></div></div>)}<MotionButton className="add-wallet-card" onClick={() => open({ kind: 'wallet' })}><span><Plus size={24} /></span><strong><RollingLabel>Tambah Dompet Baru</RollingLabel></strong><small>Pisahkan dana sesuai kebutuhan</small></MotionButton></div>{data.wallets.some(w => w.archived) && <div className="archived-section"><h2>Dompet diarsipkan</h2>{data.wallets.filter(w => w.archived).map(w => <div className="archived-row" key={w.id}><span>{w.name}</span><MotionButton onClick={() => commit({ ...data, wallets: data.wallets.map(x => x.id === w.id ? { ...x, archived: false } : x) }, 'Dompet diaktifkan')}>Aktifkan kembali</MotionButton></div>)}</div>}</>;
}

function Budgets({ data, current, period, open, commit }: { data: FinanceData; current: ReturnType<typeof metrics>; period: Date; open: (editor: Editor) => void; commit: (next: FinanceData, message: string) => void }) {
  const monthlyBudgets = budgetsForMonth(data, period);
  const used = monthlyBudgets.reduce((a, b) => a + current.entries.filter(e => e.type === 'expense' && e.category === b.category).reduce((s, e) => s + e.amount, 0), 0);
  return <><PageHeading eyebrow="RENCANA KEUANGAN" title="Anggaran Bulanan" description={`Jaga pengeluaran tetap sejalan dengan rencana ${monthLabel(period)}.`} action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'budget' })}><Plus size={18} /> Atur Anggaran</MotionButton>} /><div className="budget-summary card"><div><span>Total dianggarkan</span><strong>{rupiah(current.budgetLimit)}</strong></div><div><span>Total terpakai</span><strong>{rupiah(used)}</strong></div><div><span>Sisa tersedia</span><strong className={current.budgetRemaining < 0 ? 'danger-text' : 'green-text'}>{rupiah(current.budgetRemaining)}</strong></div><div className="budget-summary-progress"><BudgetBar spent={used} limit={current.budgetLimit} /></div></div>{monthlyBudgets.length ? <div className="budget-grid">{monthlyBudgets.map(b => { const spent = current.entries.filter(e => e.type === 'expense' && e.category === b.category).reduce((a, e) => a + e.amount, 0); const percent = Math.round(spent / b.limit * 100); return <div className="card budget-card" key={b.id}><div className="budget-card-head"><span className="budget-icon" style={{ color: categoryColors[b.category] || '#64748b', background: `${categoryColors[b.category] || '#64748b'}18` }}><BarChart3 size={20} /></span><span className={`status-pill ${percent >= 100 ? 'rose' : percent >= 80 ? 'amber' : 'green'}`}>{percent >= 100 ? 'Melebihi batas' : percent >= 80 ? 'Mendekati batas' : 'Terkendali'}</span></div><h2>{b.category}</h2><div className="budget-figures"><strong>{rupiah(spent)}</strong><span> / {rupiah(b.limit)}</span></div><BudgetBar spent={spent} limit={b.limit} /><div className="budget-card-footer"><span>{percent}% digunakan</span><div><MotionButton onClick={() => open({ kind: 'budget', item: b })}>Ubah</MotionButton><MotionButton className="delete" onClick={() => { if (confirm(`Hapus anggaran ${b.category}?`)) commit({ ...data, budgets: data.budgets.filter(x => x.id !== b.id) }, 'Anggaran dihapus'); }}>Hapus</MotionButton></div></div></div>; })}</div> : <div className="card"><Empty title="Mulai dari satu kategori" detail="Buat batas belanja bulanan dan lihat progresnya di sini." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'budget' })}>Buat anggaran</MotionButton>} /></div>}</>;
}

function RecurringPage({ data, open, commit, serverMode }: { data: FinanceData; open: (editor: Editor) => void; commit: (next: FinanceData, message: string) => void; serverMode: boolean }) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const visible = data.recurring.filter(r => filter === 'all' || r.type === filter).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const expense = data.recurring.filter(r => r.type === 'expense' && r.active).reduce((a, r) => a + r.amount, 0);
  const income = data.recurring.filter(r => r.type === 'income' && r.active).reduce((a, r) => a + r.amount, 0);
  const upcoming = data.recurring.filter(r => r.active).sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
  return <><PageHeading eyebrow="OTOMATISASI" title="Tagihan Berulang" description="Pantau pemasukan dan tagihan yang datang secara rutin." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'recurring' })}><Plus size={18} /> Buat Jadwal</MotionButton>} /><div className="recurring-stats"><div className="card"><span>Tagihan rutin</span><strong>{rupiah(expense)}</strong><small>Per siklus jadwal aktif</small></div><div className="card"><span>Pemasukan terjadwal</span><strong>{rupiah(income)}</strong><small>Per siklus jadwal aktif</small></div><div className="card"><span>Jadwal berikutnya</span><strong className="date-stat">{upcoming ? dateLabel(upcoming.nextDate) : '—'}</strong><small>{upcoming?.title || 'Belum ada jadwal aktif'}</small></div></div><div className="card table-card"><div className="table-top recurring-top"><div><h2>Daftar Jadwal</h2><p>{data.recurring.length} jadwal tersimpan</p></div><div className="segmented"><MotionButton className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Semua</MotionButton><MotionButton className={filter === 'expense' ? 'selected' : ''} onClick={() => setFilter('expense')}>Pengeluaran</MotionButton><MotionButton className={filter === 'income' ? 'selected' : ''} onClick={() => setFilter('income')}>Pemasukan</MotionButton></div></div>{visible.length ? <div className="schedule-list">{visible.map(item => <div className="schedule-row" key={item.id}><EntrySymbol type={item.type} /><div className="schedule-details"><strong>{item.title}</strong><span>{item.frequency === 'weekly' ? 'Mingguan' : item.frequency === 'yearly' ? 'Tahunan' : 'Bulanan'} · {data.wallets.find(w => w.id === item.walletId)?.name || 'Dompet'} · Berikutnya {dateLabel(item.nextDate)}</span></div><strong className={`amount ${item.type}`}>{item.type === 'income' ? '+' : '-'}{rupiah(item.amount)}</strong><label className="switch" aria-label={`${item.active ? 'Jeda' : 'Aktifkan'} ${item.title}`}><input type="checkbox" checked={item.active} onChange={e => commit({ ...data, recurring: data.recurring.map(r => r.id === item.id ? { ...r, active: e.target.checked } : r) }, e.target.checked ? 'Jadwal diaktifkan' : 'Jadwal dijeda')} /><span /></label><div className="schedule-actions"><MotionButton onClick={() => downloadIcs(item)} title="Unduh kalender" aria-label={`Unduh jadwal ${item.title} ke kalender`}><CalendarDays size={17} /></MotionButton><MotionButton onClick={() => open({ kind: 'recurring', item })} title="Ubah" aria-label={`Ubah ${item.title}`}><Settings size={17} /></MotionButton><MotionButton onClick={() => { if (confirm(`Hapus jadwal “${item.title}”?`)) commit({ ...data, recurring: data.recurring.filter(r => r.id !== item.id) }, 'Jadwal dihapus'); }} title="Hapus" aria-label={`Hapus ${item.title}`}><Trash2 size={17} /></MotionButton></div></div>)}</div> : <Empty title="Belum ada jadwal" detail="Atur tagihan atau pemasukan rutin pertama Anda." action={<MotionButton className="button button-dark" onClick={() => open({ kind: 'recurring' })}>Buat jadwal</MotionButton>} />}</div><p className="small-note"><CircleHelp size={15} /> {serverMode ? 'Jadwal aktif diproses otomatis setiap hari pukul 08.00 WIB. Unduh file kalender untuk pengingat pribadi.' : 'Dalam mode demo, jadwal menjadi pengingat. Unduh file kalender untuk menambahkannya ke Google Calendar.'}</p></>;
}

function Reports({ data, current, categories, trend, period }: { data: FinanceData; current: ReturnType<typeof metrics>; categories: ReturnType<typeof byCategory>; trend: ReturnType<typeof cashflow>; period: Date }) {
  const top = [...current.entries].filter(e => e.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const last = new Date(period.getFullYear(), period.getMonth() - 1, 1);
  const previous = metrics(data, last);
  return <><PageHeading eyebrow="ANALITIK" title="Laporan Keuangan" description="Temukan pola dan buat keputusan yang lebih jelas." action={<><MotionButton className="button button-outline" onClick={() => downloadCsv(data, current.entries)}><Download size={17} /> CSV</MotionButton><MotionButton className="button button-outline" onClick={() => downloadXlsx(data, current.entries)}><Download size={17} /> Excel</MotionButton><MotionButton className="button button-dark" onClick={() => window.print()}><FileText size={17} /> Simpan PDF</MotionButton></>} /><div className="report-stats"><div className="card"><span>Rata-rata pemasukan 6 bulan</span><strong>{rupiah(Math.round(trend.reduce((a, b) => a + b.pemasukan, 0) / 6))}</strong></div><div className="card"><span>Rata-rata pengeluaran 6 bulan</span><strong>{rupiah(Math.round(trend.reduce((a, b) => a + b.pengeluaran, 0) / 6))}</strong></div><div className="card"><span>Rasio tabungan bulan ini</span><strong>{current.savingsRate}%</strong></div></div><div className="card chart-card report-chart"><SectionHeading title="Pergerakan Arus Kas" subtitle="Enam bulan terakhir" /><div className="report-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-income)" stopOpacity={.28} /><stop offset="100%" stopColor="var(--chart-income)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} width={45} tickFormatter={value => `${value / 1_000_000} jt`} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><Tooltip content={<ChartTip />} /><Area dataKey="pemasukan" name="Pemasukan" type="monotone" stroke="var(--chart-income)" fill="url(#incomeFill)" strokeWidth={3} /><Area dataKey="pengeluaran" name="Pengeluaran" type="monotone" stroke="var(--chart-expense)" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div><div className="report-bottom"><div className="card padded-card"><SectionHeading title="Pengeluaran per Kategori" subtitle={`${monthLabel(period)} dibanding bulan sebelumnya`} /><div className="category-report-list">{categories.length ? categories.map(c => { const before = byCategory(data, last).find(x => x.name === c.name)?.value || 0; return <div key={c.name}><div className="category-report-name"><span><i style={{ background: categoryColors[c.name] || '#94a3b8' }} />{c.name}</span><strong>{rupiah(c.value)}</strong></div><div className="mini-bars"><span style={{ width: `${Math.min(100, c.value / Math.max(...categories.map(x => x.value), 1) * 100)}%`, background: categoryColors[c.name] || '#94a3b8' }} /><span className="last-month-bar" style={{ width: `${Math.min(100, before / Math.max(...categories.map(x => x.value), 1) * 100)}%` }} /></div></div>; }) : <Empty title="Belum ada data" detail="Catat pengeluaran untuk melihat analitik." />}</div><p className="small-note">Total bulan lalu: {rupiah(previous.expense)}</p></div><div className="card padded-card"><SectionHeading title="Pengeluaran Terbesar" subtitle={`Lima transaksi teratas ${monthLabel(period)}`} /><div className="top-spend-list">{top.map((entry, index) => <div key={entry.id}><span className="rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{entry.title}</strong><small>{entry.category} · {dateLabel(entry.date)}</small></div><strong>{rupiah(entry.amount)}</strong></div>)}</div></div></div></>;
}

function SettingsPage({ data, dark, setDark, commit, serverMode, onLogout }: { data: FinanceData; dark: boolean; setDark: (next: boolean) => void; commit: (next: FinanceData, message: string) => void; serverMode: boolean; onLogout: () => void }) {
  const [name, setName] = useState(data.name);
  const [categoryName, setCategoryName] = useState('');
  return <><PageHeading eyebrow="PREFERENSI" title="Pengaturan" description="Sesuaikan pengalaman FinTrack untuk kebutuhan Anda." /><div className="settings-grid"><div className="card padded-card"><SectionHeading title="Profil" subtitle="Nama yang ditampilkan pada dasbor" /><form className="settings-form" onSubmit={e => { e.preventDefault(); if (name.trim()) commit({ ...data, name: name.trim() }, 'Profil diperbarui'); }}><label>Nama tampilan<input value={name} onChange={e => setName(e.target.value)} required maxLength={60} /></label><MotionButton className="button button-dark" type="submit">Simpan perubahan</MotionButton></form></div><div className="card padded-card"><SectionHeading title="Tampilan" subtitle="Pilih tema yang nyaman untuk Anda" /><div className="setting-toggle"><div><Moon size={19} /><span><strong>Mode gelap</strong><small>Warna lebih redup untuk malam hari</small></span></div><label className="switch" aria-label="Mode gelap"><input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /><span /></label></div></div><div className="card padded-card"><SectionHeading title="Data & Privasi" subtitle={serverMode ? 'Data tersimpan di akun Anda' : 'Mode demo menyimpan data hanya di browser ini'} /><p className="setting-description">{serverMode ? 'Sesi terlindungi cookie HTTP-only. Data disimpan dalam PostgreSQL.' : 'Data demo dapat hilang jika penyimpanan browser dibersihkan. Ekspor CSV sebelum berpindah perangkat.'}</p><MotionButton className="button button-outline" onClick={() => downloadCsv(data, data.entries)}><Download size={17} /> Ekspor semua transaksi</MotionButton>{serverMode && <MotionButton className="button button-outline logout-button" onClick={onLogout}><LogOut size={17} /> Keluar</MotionButton>}</div><div className="card padded-card"><SectionHeading title="Kategori" subtitle="Kategori khusus untuk pencatatan Anda" /><div className="setting-categories">{[...new Set([...expenseCategories, ...incomeCategories, ...data.entries.map(e => e.category)])].map(category => <span key={category}><i style={{ background: categoryColors[category] || '#94a3b8' }} />{category}</span>)}</div><form className="settings-form inline" onSubmit={e => { e.preventDefault(); if (categoryName.trim()) { commit({ ...data, budgets: [...data.budgets, { id: id(), category: categoryName.trim(), limit: 1_000_000, period: monthKey(new Date()) }] }, 'Kategori dan anggaran dibuat'); setCategoryName(''); } }}><label>Kategori baru<input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Nama kategori" maxLength={40} /></label><MotionButton className="button button-outline" type="submit">Tambah</MotionButton></form></div></div></>;
}

function EditorDialog({ editor, data, period, saving, onClose, onSave }: { editor: NonNullable<Editor>; data: FinanceData; period: Date; saving: boolean; onClose: () => void; onSave: (item: Entry | Wallet | Budget | Recurring) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const current = editor.item;
  const [type, setType] = useState<EntryType>(editor.kind === 'transaction' || editor.kind === 'recurring' ? editor.item?.type || 'expense' : 'expense');
  const [title, setTitle] = useState(editor.kind === 'transaction' || editor.kind === 'recurring' ? editor.item?.title || '' : editor.kind === 'wallet' ? editor.item?.name || '' : '');
  const [amount, setAmount] = useState(editor.kind === 'transaction' || editor.kind === 'recurring' ? String(editor.item?.amount || '') : editor.kind === 'budget' ? String(editor.item?.limit || '') : editor.kind === 'wallet' ? String(editor.item?.openingBalance || '') : '');
  const [walletId, setWalletId] = useState(editor.kind === 'transaction' || editor.kind === 'recurring' ? editor.item?.walletId || data.wallets.find(w => !w.archived)?.id || '' : '');
  const [targetWalletId, setTargetWalletId] = useState(editor.kind === 'transaction' ? editor.item?.targetWalletId || '' : '');
  const [category, setCategory] = useState(editor.kind === 'transaction' || editor.kind === 'recurring' || editor.kind === 'budget' ? editor.item?.category || 'Makanan & Minuman' : '');
  const [date, setDate] = useState(editor.kind === 'transaction' ? editor.item?.date || today() : editor.kind === 'recurring' ? editor.item?.nextDate || today() : today());
  const [note, setNote] = useState(editor.kind === 'transaction' ? editor.item?.note || '' : '');
  const [receipt, setReceipt] = useState(editor.kind === 'transaction' ? editor.item?.receipt || '' : '');
  const [walletType, setWalletType] = useState<Wallet['type']>(editor.kind === 'wallet' ? editor.item?.type || 'bank' : 'bank');
  const [color, setColor] = useState(editor.kind === 'wallet' ? editor.item?.color || '#10b981' : '#10b981');
  const [frequency, setFrequency] = useState<Recurring['frequency']>(editor.kind === 'recurring' ? editor.item?.frequency || 'monthly' : 'monthly');
  const [error, setError] = useState('');
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('input,select,textarea')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])') || [])].filter(item => item.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, []);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = money(amount);
    if (value <= 0 && editor.kind !== 'wallet') { setError('Masukkan nominal lebih dari nol.'); return; }
    if (editor.kind === 'transaction') {
      if (!walletId || (type === 'transfer' && (!targetWalletId || targetWalletId === walletId))) { setError('Pilih dompet asal dan tujuan yang berbeda.'); return; }
      onSave({ id: editor.item?.id || id(), type, amount: value, title: title.trim() || (type === 'transfer' ? 'Transfer antar dompet' : 'Transaksi'), walletId, targetWalletId: type === 'transfer' ? targetWalletId : undefined, category: type === 'transfer' ? 'Lainnya' : category, note: note.trim(), date, receipt });
    } else if (editor.kind === 'wallet') {
      if (!title.trim()) { setError('Isi nama dompet.'); return; }
      onSave({ id: editor.item?.id || id(), name: title.trim(), type: walletType, openingBalance: value, color, archived: editor.item?.archived || false });
    } else if (editor.kind === 'budget') {
      if (budgetsForMonth(data, period).some(b => b.category === category && b.id !== editor.item?.id)) { setError('Kategori ini sudah memiliki anggaran.'); return; }
      onSave({ id: editor.item?.id || id(), category, limit: value, period: monthKey(period) });
    } else {
      if (!title.trim() || !walletId) { setError('Isi nama dan dompet jadwal.'); return; }
      onSave({ id: editor.item?.id || id(), title: title.trim(), type: type === 'income' ? 'income' : 'expense', amount: value, walletId, category, frequency, nextDate: date, anchorDay: editor.item?.nextDate === date ? editor.item.anchorDay || Number(date.slice(-2)) : Number(date.slice(-2)), active: editor.item?.active ?? true });
    }
  };
  const heading = editor.kind === 'transaction' ? 'Catat Transaksi' : editor.kind === 'wallet' ? 'Dompet' : editor.kind === 'budget' ? 'Anggaran' : 'Jadwal Berulang';
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-head"><div><span className="eyebrow">{current ? 'UBAH DATA' : 'DATA BARU'}</span><h2 id="dialog-title">{current ? `Ubah ${heading}` : editor.kind === 'transaction' ? heading + ' Baru' : `Tambah ${heading}`}</h2></div><MotionButton className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20} /></MotionButton></div><form onSubmit={submit} className="modal-form">
    {(editor.kind === 'transaction' || editor.kind === 'recurring') && <div className="type-tabs" role="group" aria-label="Tipe transaksi">{(['expense', 'income', ...(editor.kind === 'transaction' ? ['transfer'] : [])] as EntryType[]).map(t => <MotionButton type="button" className={type === t ? `active ${t}` : ''} onClick={() => { setType(t); setCategory(t === 'income' ? 'Gaji' : 'Makanan & Minuman'); }} key={t}>{t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}</MotionButton>)}</div>}
    {editor.kind === 'budget' && <label>Kategori<select value={category} onChange={e => setCategory(e.target.value)}>{[...new Set([...expenseCategories, ...data.budgets.map(b => b.category)])].map(c => <option key={c}>{c}</option>)}</select></label>}
    {(editor.kind === 'transaction' || editor.kind === 'recurring' || editor.kind === 'wallet') && <label>{editor.kind === 'wallet' ? 'Nama dompet' : editor.kind === 'recurring' ? 'Nama jadwal' : 'Judul transaksi'}<input value={title} onChange={e => setTitle(e.target.value)} placeholder={editor.kind === 'wallet' ? 'Contoh: Bank BCA' : editor.kind === 'recurring' ? 'Contoh: Listrik bulanan' : 'Contoh: Belanja makan siang'} maxLength={100} autoFocus /></label>}
    <label>{editor.kind === 'budget' ? 'Batas bulanan' : editor.kind === 'wallet' ? 'Saldo awal' : 'Nominal'}<div className="amount-input"><span>Rp</span><input inputMode="numeric" pattern="[0-9.]*" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" aria-label="Nominal rupiah" /></div></label>
    {editor.kind === 'wallet' && <div className="form-row"><label>Jenis dompet<select value={walletType} onChange={e => setWalletType(e.target.value as Wallet['type'])}><option value="bank">Rekening bank</option><option value="ewallet">E-Wallet</option><option value="cash">Tunai</option><option value="credit">Kartu kredit</option></select></label><label>Warna identitas<input type="color" value={color} onChange={e => setColor(e.target.value)} className="color-input" /></label></div>}
    {(editor.kind === 'transaction' || editor.kind === 'recurring') && <><div className="form-row"><label>Dompet asal<select value={walletId} onChange={e => setWalletId(e.target.value)} required>{data.wallets.filter(w => !w.archived).map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select></label>{type === 'transfer' ? <label>Dompet tujuan<select value={targetWalletId} onChange={e => setTargetWalletId(e.target.value)} required><option value="">Pilih dompet</option>{data.wallets.filter(w => !w.archived && w.id !== walletId).map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select></label> : <label>Kategori<select value={category} onChange={e => setCategory(e.target.value)}>{[...new Set([...(type === 'income' ? incomeCategories : expenseCategories), ...data.budgets.map(b => b.category), ...data.entries.map(e => e.category)])].map(c => <option key={c}>{c}</option>)}</select></label>}</div><div className="form-row"><label>{editor.kind === 'recurring' ? 'Jadwal berikutnya' : 'Tanggal'}<input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>{editor.kind === 'recurring' && <label>Frekuensi<select value={frequency} onChange={e => setFrequency(e.target.value as Recurring['frequency'])}><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option></select></label>}</div></>}
    {editor.kind === 'transaction' && <><label>Catatan (opsional)<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tambahkan detail transaksi..." rows={2} maxLength={500} /></label><label className="receipt-label">Foto struk (opsional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_000_000) { setError('Ukuran struk maksimal 1 MB.'); return; } const reader = new FileReader(); reader.onload = () => setReceipt(String(reader.result)); reader.readAsDataURL(file); }} />{receipt && <span className="receipt-ready"><Check size={15} /> Struk siap disimpan <MotionButton type="button" onClick={() => setReceipt('')}>Hapus</MotionButton></span>}</label></>}
    {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><MotionButton type="button" className="button button-outline" onClick={onClose}>Batal</MotionButton><MotionButton type="submit" className="button button-dark" disabled={saving}>{saving ? 'Menyimpan…' : `Simpan ${editor.kind === 'transaction' ? 'Transaksi' : heading}`}</MotionButton></div></form></div></div>;
}

function AuthScreen({ available, connectionIssue, options, sessionNotice, onSuccess, onLocal }: {
  available: boolean;
  connectionIssue: boolean;
  options: AuthOptions;
  sessionNotice: string;
  onSuccess: () => Promise<void>;
  onLocal: () => void;
}) {
  const [register, setRegister] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = new URL(location.href);
    const reason = url.searchParams.get('auth_error');
    if (!reason) return;
    setError(reason === 'email_exists' ? 'Email sudah terdaftar. Masuk dengan kata sandi Anda.' : 'Masuk dengan Google gagal. Coba lagi.');
    url.searchParams.delete('auth_error');
    history.replaceState(null, '', url);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const action = forgot ? 'forgot-password' : register ? 'register' : 'login';
      const response = await fetch('/api/v1/auth/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgot ? { email } : { name, email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Permintaan gagal. Coba lagi.');
      if (forgot) {
        setNotice('Jika email terdaftar, tautan pemulihan akan dikirim.');
        setForgot(false);
      } else {
        await onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  };
  const toggleForgot = () => {
    setForgot(!forgot);
    setRegister(false);
    setPassword('');
    setError('');
    setNotice('');
  };
  const toggleRegister = () => {
    setRegister(!register);
    setForgot(false);
    setPassword('');
    setError('');
    setNotice('');
  };
  return (
    <main className="auth-page">
      <div className="auth-form-side">
        <div className="auth-brand"><span className="logo-mark"><TrendingUp size={21} /></span><strong>FinTrack</strong></div>
        <div className="auth-form-wrap">
          <span className="eyebrow">KEUANGAN LEBIH JELAS</span>
          <h1>{!available ? 'Masuk ke FinTrack' : forgot ? 'Pulihkan kata sandi' : register ? 'Daftar akun FinTrack' : 'Selamat datang kembali'}</h1>
          <p>{available ? 'Kelola arus kas, anggaran, dan tabungan Anda dalam satu dasbor.' : connectionIssue ? 'Akun online sedang tidak dapat diakses.' : 'Akun online belum tersedia.'}</p>
          {sessionNotice && <p role="status">{sessionNotice}</p>}
          {available && <form onSubmit={submit}>
            {register && <label>Nama lengkap<input value={name} onChange={e => setName(e.target.value)} required maxLength={60} /></label>}
            <label>Alamat email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="nama@email.com" /></label>
            {!forgot && <label>Kata sandi<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={register ? 72 : 128} autoComplete={register ? 'new-password' : 'current-password'} placeholder="Minimal 8 karakter" /></label>}
            {notice && <p role="status">{notice}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <MotionButton className="button button-dark auth-submit" type="submit" disabled={busy}>
              {busy ? 'Memproses…' : forgot ? 'Kirim tautan pemulihan' : register ? 'Buat Akun' : 'Masuk ke Dasbor'} <ArrowRight size={17} />
            </MotionButton>
          </form>}
          {available && options.passwordReset && !register && <p className="auth-switch"><MotionButton type="button" disabled={busy} onClick={toggleForgot}>{forgot ? 'Kembali ke masuk' : 'Lupa kata sandi?'}</MotionButton></p>}
          {available && options.google && !forgot && <p className="auth-switch"><a href="/api/v1/auth/google"><RollingLabel>Lanjutkan dengan Google</RollingLabel></a></p>}
          {available && !forgot && <p className="auth-switch">{register ? 'Sudah punya akun?' : 'Belum punya akun?'} <MotionButton type="button" disabled={busy} onClick={toggleRegister}>{register ? 'Masuk' : 'Daftar gratis'}</MotionButton></p>}
          {available ? (
            <div className="auth-demo"><span>Data tersimpan di browser ini.</span><MotionButton type="button" disabled={busy} onClick={onLocal}>Gunakan tanpa akun <ArrowRight size={15} /></MotionButton></div>
          ) : (
            <div>
              <p>Anda bisa mencatat transaksi dan anggaran di browser ini.</p>
              <MotionButton className="button button-dark auth-submit" type="button" onClick={onLocal}>Gunakan tanpa akun <ArrowRight size={17} /></MotionButton>
            </div>
          )}
        </div>
        <small className="auth-copyright">© {new Date().getFullYear()} FinTrack Web</small>
      </div>
      <div className="auth-visual">
        <div className="auth-glow" />
        <span className="auth-visual-eyebrow">KENDALI DI TANGAN ANDA</span>
        <h2>Satu tempat untuk setiap keputusan keuangan.</h2>
        <p>Lihat yang masuk, pahami yang keluar, dan rencanakan langkah berikutnya dengan tenang.</p>
        <div className="auth-preview">
          <span>Total saldo gabungan</span>
          <strong>Rp 48.750.000</strong>
          <div className="auth-preview-bars">{[35, 47, 43, 62, 56, 68, 85, 76, 96, 90, 100].map((height, i) => <i key={i} style={{ height: height + '%' }} />)}</div>
          <div className="auth-preview-foot"><span><TrendingUp size={16} /> +8,4% bulan ini</span><span>Keuangan bertumbuh</span></div>
        </div>
      </div>
    </main>
  );
}
