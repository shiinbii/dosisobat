'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type Code = { code: string; description: string; descriptionId: string | null; category: string | null; isActive: boolean };

const empty: Code = { code: '', description: '', descriptionId: '', category: '', isActive: true };

export default function Icd10Page() {
  const [items, setItems] = useState<Code[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Code | null>(null);

  const load = async () => {
    const r = await adminApi<{ items: Code[] }>('/admin/icd10');
    setItems(r.items);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    await adminApi('/admin/icd10', { method: 'POST', body: editing });
    setEditing(null);
    load();
  };

  const remove = async (code: string) => {
    if (!confirm(`Nonaktifkan ${code}?`)) return;
    await adminApi(`/admin/icd10/${code}`, { method: 'DELETE' });
    load();
  };

  const filtered = items.filter((i) =>
    !q ||
    i.code.toLowerCase().includes(q.toLowerCase()) ||
    i.description.toLowerCase().includes(q.toLowerCase()) ||
    (i.descriptionId ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">ICD-10</h2>
        <button onClick={() => setEditing({ ...empty })} className="bg-primary text-white px-4 py-2 rounded hover:bg-primaryDark">
          + Tambah Kode
        </button>
      </div>
      <input
        placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border border-stone-300 rounded px-3 py-2 mb-4"
      />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left">
            <tr><th className="p-3">Kode</th><th>Deskripsi (ID)</th><th>Deskripsi (EN)</th><th>Kategori</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code} className="border-t border-stone-200 hover:bg-stone-50">
                <td className="p-3 font-mono font-medium">{c.code}</td>
                <td>{c.descriptionId}</td>
                <td className="text-stone-600">{c.description}</td>
                <td className="text-stone-600">{c.category}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => setEditing({ ...c })} className="text-primary hover:underline">Edit</button>
                  <button onClick={() => remove(c.code)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{empty.code === editing.code ? 'Tambah' : 'Edit'} Kode ICD-10</h3>
            <Input label="Kode (cth: J06.9)" value={editing.code} onChange={(v) => setEditing({ ...editing, code: v.toUpperCase() })} />
            <Input label="Deskripsi (Bahasa Indonesia)" value={editing.descriptionId ?? ''} onChange={(v) => setEditing({ ...editing, descriptionId: v })} />
            <Input label="Description (English)" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
            <Input label="Kategori" value={editing.category ?? ''} onChange={(v) => setEditing({ ...editing, category: v })} />
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="bg-primary text-white px-4 py-2 rounded">Simpan</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded border border-stone-300">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-stone-700 font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full border border-stone-300 rounded px-3 py-2" />
    </label>
  );
}
