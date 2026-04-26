'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DrugForm } from '../DrugForm';
import { createDrug, type DrugInput } from '../actions';

export default function NewDrug() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const save = async (data: DrugInput) => {
    setBusy(true);
    try {
      await createDrug(data);
      router.push('/dashboard/drugs');
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Obat</h2>
      <DrugForm onSubmit={save} busy={busy} />
    </div>
  );
}
