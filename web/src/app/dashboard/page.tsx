'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardHome() {
  const [stats, setStats] = useState<{ drugs: number; icd10: number; users: number } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('Drug').select('id', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Icd10').select('code', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])
      .then(([d, i, u]) => {
        setStats({
          drugs: d.count ?? 0,
          icd10: i.count ?? 0,
          users: u.count ?? 0,
        });
      })
      .catch(() => setStats({ drugs: 0, icd10: 0, users: 0 }));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Beranda</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Obat" value={stats?.drugs} />
        <Card label="ICD-10" value={stats?.icd10} />
        <Card label="Pengguna" value={stats?.users} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-stone-500 text-sm">{label}</div>
      <div className="text-3xl font-bold text-primary mt-2">{value ?? '…'}</div>
    </div>
  );
}
