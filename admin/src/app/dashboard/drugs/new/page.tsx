'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { DrugForm } from '../DrugForm';

export default function NewDrug() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const save = async (data: any) => {
    setBusy(true);
    try {
      await adminApi('/admin/drugs', { method: 'POST', body: data });
      router.push('/dashboard/drugs');
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menyimpan.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Obat</h2>
      <DrugForm onSubmit={save} busy={busy} />
    </div>
  );
}
