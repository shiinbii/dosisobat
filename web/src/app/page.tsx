'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { detectIdentifier } from '@/lib/auth-helpers';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const id = identifier.trim();
    const kind = detectIdentifier(id);
    if (kind === 'phone') {
      setErr('Login dengan nomor HP belum aktif. Gunakan email atau Google.');
      return;
    }
    if (kind !== 'email') {
      setErr('Format email tidak valid.');
      return;
    }
    setBusy(true);
    try {
      const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
        email: id,
        password,
      });
      if (signInErr) {
        setErr(/invalid login credentials|invalid_credentials/i.test(signInErr.message)
          ? 'Email atau password salah.'
          : signInErr.message);
        return;
      }
      const userId = signIn.user?.id;
      if (!userId) {
        setErr('Login berhasil tapi user kosong.');
        return;
      }
      const { data: role } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        setErr('Akun ini bukan admin.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? 'Login gagal.');
    } finally {
      setBusy(false);
    }
  };

  const loginWithGoogle = async () => {
    setGoogleBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      // Browser akan redirect ke Google.
    } catch (e: any) {
      setGoogleBusy(false);
      const msg = e?.message ?? '';
      if (/provider.*not.*enabled|unsupported.*provider/i.test(msg)) {
        setErr('Google login belum aktif. Aktifkan di Supabase Dashboard → Authentication → Providers.');
      } else {
        setErr(msg || 'Login Google gagal.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">Dosis Obat — Admin</h1>
        <div>
          <label className="block text-sm font-medium text-stone-700">Email atau Nomor HP</label>
          <input
            type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
            placeholder="nama@email.com / 08xx (HP belum aktif)"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
            autoComplete="current-password"
          />
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Lupa password?
          </Link>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit" disabled={busy}
          className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-primaryDark disabled:opacity-50"
        >
          {busy ? 'Memuat…' : 'Masuk'}
        </button>

        <div className="flex items-center gap-3 text-stone-400 text-xs">
          <div className="flex-1 h-px bg-stone-200" />
          <span>atau</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          disabled={googleBusy}
          className="w-full border border-stone-300 rounded py-2 font-medium hover:bg-stone-50 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="text-blue-600 font-black">G</span>
          {googleBusy ? 'Memuat…' : 'Masuk dengan Google'}
        </button>
      </form>
    </div>
  );
}
