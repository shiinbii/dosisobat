'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
        setErr('Login berhasil tapi user kosong. Hubungi admin.');
        return;
      }
      const { data: role, error: roleErr } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (roleErr) {
        await supabase.auth.signOut();
        setErr('Gagal memeriksa role admin.');
        return;
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">Dosis Obat — Admin</h1>
        <div>
          <label className="block text-sm font-medium text-stone-700">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
            autoComplete="email"
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
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full bg-primary text-white rounded py-2 font-medium hover:bg-primaryDark disabled:opacity-50"
        >
          {busy ? 'Memuat…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
