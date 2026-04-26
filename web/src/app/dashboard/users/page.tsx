'use client';

import { useEffect, useState } from 'react';
import { listUsers, grantSubscription, forceLogoutUser, type AdminUserRow } from './actions';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const items = await listUsers();
      setUsers(items);
    } catch (e: any) {
      alert(e?.message ?? 'Gagal memuat user.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const grant = async (userId: string) => {
    const monthsStr = prompt('Berapa bulan?', '1');
    if (!monthsStr) return;
    const months = Number(monthsStr);
    if (!months || months < 1) return alert('Jumlah bulan tidak valid.');
    const plan = months >= 12 ? 'YEARLY' : 'MONTHLY';
    try {
      await grantSubscription(userId, plan, months);
      alert('Langganan ditambahkan.');
      load();
    } catch (e: any) {
      alert(e?.message ?? 'Gagal grant.');
    }
  };

  const forceLogout = async (userId: string) => {
    if (!confirm('Force logout pengguna ini?')) return;
    try {
      await forceLogoutUser(userId);
      load();
    } catch (e: any) {
      alert(e?.message ?? 'Gagal force logout.');
    }
  };

  const filtered = users.filter((u) =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pengguna</h2>
      <input
        placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border border-stone-300 rounded px-3 py-2 mb-4"
      />
      {loading ? <p>Memuat…</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left">
              <tr><th className="p-3">Nama</th><th>Email</th><th>Profesi</th><th>Trial s/d</th><th>Langganan</th><th>Sesi</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const sub = u.subscription;
                const subActive = sub && (sub.status === 'ACTIVE' || sub.status === 'TRIAL') && new Date(sub.ends_at) > new Date();
                return (
                  <tr key={u.id} className="border-t border-stone-200 hover:bg-stone-50">
                    <td className="p-3 font-medium">{u.name || '—'}</td>
                    <td className="text-stone-600">{u.email}</td>
                    <td className="text-stone-600">{u.profession}</td>
                    <td className="text-stone-600">
                      {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td>
                      {subActive
                        ? `✅ ${sub!.plan} s/d ${new Date(sub!.ends_at).toLocaleDateString('id-ID')}`
                        : sub ? `🚫 ${sub.status}` : '—'}
                    </td>
                    <td>{u.currentDeviceId ? '🟢 Aktif' : '—'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => grant(u.id)} className="text-primary hover:underline">Beri Langganan</button>
                      {u.currentDeviceId && (
                        <button onClick={() => forceLogout(u.id)} className="text-red-600 hover:underline">Force Logout</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
