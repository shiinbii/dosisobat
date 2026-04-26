'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, adminToken, AdminApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (adminToken.get()) router.replace('/dashboard');
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await adminApi<{ token: string }>('/admin/login', {
        method: 'POST', auth: false, body: { email, password },
      });
      adminToken.set(r.token);
      router.push('/dashboard');
    } catch (e) {
      setErr(e instanceof AdminApiError && e.code === 'INVALID_CREDENTIALS'
        ? 'Email atau password salah.'
        : 'Login gagal.');
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded px-3 py-2"
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
