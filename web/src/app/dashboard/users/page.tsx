'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type User = {
  id: string; email: string; name: string; profession: string;
  trialEndsAt: string; isActive: boolean; createdAt: string;
  currentSessionId: string | null;
  subscriptions: Array<{ id: string; status: string; plan: string; endsAt: string }>;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');

  const load = async () => {
    const r = await adminApi<{ items: User[] }>('/admin/users');
    setUsers(r.items);
  };
  useEffect(() => { load(); }, []);

  const grant = async (userId: string) => {
    const months = Number(prompt('Berapa bulan?', '1'));
    if (!months) return;
    const plan = months >= 12 ? 'YEARLY' : 'MONTHLY';
    await adminApi('/admin/subscriptions/grant', { method: 'POST', body: { userId, plan, months } });
    alert('Langganan ditambahkan.');
    load();
  };

  const forceLogout = async (userId: string) => {
    if (!confirm('Force logout pengguna ini?')) return;
    await adminApi(`/admin/users/${userId}/force-logout`, { method: 'POST' });
    load();
  };

  const filtered = users.filter((u) =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pengguna</h2>
      <input placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full border border-stone-300 rounded px-3 py-2 mb-4" />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left">
            <tr><th className="p-3">Nama</th><th>Email</th><th>Profesi</th><th>Trial s/d</th><th>Langganan</th><th>Sesi</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const sub = u.subscriptions[0];
              const subActive = sub && sub.status === 'ACTIVE' && new Date(sub.endsAt) > new Date();
              return (
                <tr key={u.id} className="border-t border-stone-200 hover:bg-stone-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="text-stone-600">{u.email}</td>
                  <td className="text-stone-600">{u.profession}</td>
                  <td className="text-stone-600">{new Date(u.trialEndsAt).toLocaleDateString('id-ID')}</td>
                  <td>{subActive ? `✅ ${sub.plan} s/d ${new Date(sub.endsAt).toLocaleDateString('id-ID')}` : '—'}</td>
                  <td>{u.currentSessionId ? '🟢 Aktif' : '—'}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => grant(u.id)} className="text-primary hover:underline">Beri Langganan</button>
                    {u.currentSessionId && <button onClick={() => forceLogout(u.id)} className="text-red-600 hover:underline">Force Logout</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
