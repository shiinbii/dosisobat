'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { detectIdentifier } from '@/lib/auth-helpers';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const value = identifier.trim();
    const kind = detectIdentifier(value);
    if (kind === 'phone') {
      setErr('Reset via SMS/WhatsApp belum aktif. Gunakan email.');
      return;
    }
    if (kind !== 'email') {
      setErr('Format email tidak valid.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(value, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? 'Tidak dapat mengirim email reset.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">Lupa Password</h1>

        {sent ? (
          <div className="space-y-3">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="font-semibold text-stone-800">📧 Email terkirim</p>
              <p className="text-sm text-stone-600 mt-1">
                Cek inbox di <span className="font-semibold">{identifier}</span>. Klik link
                di email untuk lanjut reset password.
              </p>
            </div>
            <Link href="/" className="block text-center text-primary hover:underline">
              ← Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-stone-600">
              Masukkan email yang terdaftar. Kami akan kirim link untuk reset password.
            </p>
            <div>
              <label className="block text-sm font-medium text-stone-700">Email atau Nomor HP</label>
              <input
                type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button
              type="submit" disabled={busy}
              className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-primaryDark disabled:opacity-50"
            >
              {busy ? 'Mengirim…' : 'Kirim Link Reset'}
            </button>
            <Link href="/" className="block text-center text-sm text-stone-500 hover:underline">
              ← Kembali ke Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
