'use client';
import { useEffect, useState } from 'react';
export default function ResetPage() {
  const [token, setToken] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(location.hash.slice(1)).get('reset_token') || new URLSearchParams(location.search).get('reset_token') || ''); history.replaceState(null, '', '/reset'); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { const response = await fetch('/api/v1/auth/reset-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({token,password}) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setDone(true); setToken(''); setMessage('Kata sandi berhasil diubah. Silakan masuk kembali.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan'); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-form-side"><div className="auth-form-wrap"><h1>Atur ulang kata sandi</h1>{!done && <form onSubmit={submit}><label>Kata sandi baru<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button className="button button-dark auth-submit" disabled={busy || !token}>{busy ? 'Memproses…' : 'Simpan kata sandi'}</button></form>}{message && <p role="status">{message}</p>}<p><a href="/login">Kembali ke masuk</a></p></div></div></main>;
}
