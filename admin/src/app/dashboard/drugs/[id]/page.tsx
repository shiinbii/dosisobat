'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { DrugForm } from '../DrugForm';

export default function EditDrug() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [drug, setDrug] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi<{ items: any[] }>('/admin/drugs').then((r) => {
      const d = r.items.find((x) => x.id === params.id);
      setDrug(d ?? null);
    });
  }, [params.id]);

  if (!drug) return <p>Memuat…</p>;

  const save = async (data: any) => {
    setBusy(true);
    try {
      await adminApi(`/admin/drugs/${params.id}`, { method: 'PUT', body: data });
      router.push('/dashboard/drugs');
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menyimpan.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Obat</h2>
      <DrugForm initial={drug} onSubmit={save} busy={busy} />
    </div>
  );
}
