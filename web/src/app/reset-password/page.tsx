'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 6) { setErr('Password minimal 6 karakter.'); return; }
    if (pw !== pw2) { setErr('Konfirmasi password tidak cocok.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      await supabase.auth.signOut();
    } catch (e: any) {
      setErr(e?.message ?? 'Tidak dapat mengganti password.');
    } finally {
      setBusy(false);
    }
  };

  if (hasSession === null) {
    return <div className="min-h-screen flex items-center justify-center"><p>Memuat…</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">Ganti Password</h1>

        {done ? (
          <div className="space-y-3">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-stone-700">
                Password berhasil diganti. Silakan login dengan password baru.
              </p>
            </div>
            <button
              onClick={() => router.replace('/')}
              className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-primaryDark"
            >
              Login
            </button>
          </div>
        ) : !hasSession ? (
          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-stone-700">
                Link reset password sudah tidak berlaku atau Anda mengakses halaman ini langsung.
                Silakan minta link baru.
              </p>
            </div>
            <Link href="/forgot-password" className="block text-center text-primary hover:underline">
              Minta Link Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-stone-600">Masukkan password baru untuk akun Anda.</p>
            <div>
              <label className="block text-sm font-medium text-stone-700">Password baru (min 6 karakter)</label>
              <input
                type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
                className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Konfirmasi password</label>
              <input
                type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)}
                className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
              />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button
              type="submit" disabled={busy}
              className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-primaryDark disabled:opacity-50"
            >
              {busy ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
