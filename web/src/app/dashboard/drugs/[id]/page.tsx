'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DrugForm } from '../DrugForm';
import { getDrugById, updateDrug, type DrugInput } from '../actions';

export default function EditDrug() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [drug, setDrug] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    getDrugById(params.id)
      .then(setDrug)
      .catch((e) => alert(`Gagal memuat: ${e.message}`));
  }, [params.id]);

  if (!drug) return <p>Memuat…</p>;

  const save = async (data: DrugInput) => {
    setBusy(true);
    try {
      await updateDrug(params.id, data);
      router.push('/dashboard/drugs');
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Obat</h2>
      <DrugForm initial={drug} onSubmit={save} busy={busy} />
    </div>
  );
}
