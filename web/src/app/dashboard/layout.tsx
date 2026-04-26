'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace('/');
        return;
      }
      // Cek apakah user ini admin
      const { data: role } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/');
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const linkCls = (path: string) =>
    `block px-4 py-2 rounded transition ${
      pathname === path || pathname.startsWith(path + '/')
        ? 'bg-primary text-white' : 'text-stone-700 hover:bg-stone-200'
    }`;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Memuat…</p>
      </div>
    );
  }

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
