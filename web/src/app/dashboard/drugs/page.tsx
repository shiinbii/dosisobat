'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { adminApi } from '@/lib/api';

type Drug = { id: string; name: string; brandNames: string; category: string; routes: string; isActive: boolean };

export default function DrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Drug')
        .select('id, name, brandNames, category, routes, isActive')
        .eq('isActive', true)
        .order('nameLower', { ascending: true });
      if (error) throw error;
      setDrugs((data ?? []) as Drug[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = drugs.filter((d) =>
    !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.brandNames.toLowerCase().includes(q.toLowerCase())
  );

  // CRUD masih via backend lama — akan diganti ke Server Action di Fase 4.
  const remove = async (id: string) => {
    if (!confirm('Nonaktifkan obat ini?')) return;
    await adminApi(`/admin/drugs/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Obat</h2>
        <Link href="/dashboard/drugs/new" className="bg-primary text-white px-4 py-2 rounded hover:bg-primaryDark">
          + Tambah Obat
        </Link>
      </div>
      <input
        placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border border-stone-300 rounded px-3 py-2 mb-4"
      />
      {loading ? <p>Memuat…</p> : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-left">
              <tr><th className="p-3">Nama</th><th>Merek</th><th>Kategori</th><th>Rute</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-stone-200 hover:bg-stone-50">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="text-stone-600">{d.brandNames}</td>
                  <td className="text-stone-600">{d.category}</td>
                  <td className="text-stone-600">{d.routes}</td>
                  <td>{d.isActive ? '✅' : '🚫'}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link href={`/dashboard/drugs/${d.id}`} className="text-primary hover:underline">Edit</Link>
                    <button onClick={() => remove(d.id)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
