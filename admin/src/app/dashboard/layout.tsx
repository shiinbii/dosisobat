'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { adminToken } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!adminToken.get()) router.replace('/');
  }, [router]);

  const logout = () => {
    adminToken.remove();
    router.replace('/');
  };

  const linkCls = (path: string) =>
    `block px-4 py-2 rounded transition ${
      pathname === path || pathname.startsWith(path + '/')
        ? 'bg-primary text-white' : 'text-stone-700 hover:bg-stone-200'
    }`;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-stone-200 p-4 space-y-1">
        <h1 className="text-xl font-bold text-primary mb-6">Dosis Obat</h1>
        <Link href="/dashboard" className={linkCls('/dashboard')}>📊 Beranda</Link>
        <Link href="/dashboard/drugs" className={linkCls('/dashboard/drugs')}>💊 Obat</Link>
        <Link href="/dashboard/icd10" className={linkCls('/dashboard/icd10')}>📋 ICD-10</Link>
        <Link href="/dashboard/users" className={linkCls('/dashboard/users')}>👥 Pengguna</Link>
        <button onClick={logout} className="block w-full text-left mt-6 px-4 py-2 rounded text-red-600 hover:bg-red-50">
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
