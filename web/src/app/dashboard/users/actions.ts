'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  profession: string;
  trialEndsAt: string | null;
  currentDeviceId: string | null;
  createdAt: string;
  subscription: {
    id: string;
    status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    plan: 'TRIAL' | 'MONTHLY' | 'YEARLY';
    starts_at: string;
    ends_at: string;
  } | null;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  // 1. Ambil semua auth.users (paged 1000 per request)
  const { data: page1, error: e1 } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (e1) throw new Error(`Gagal list auth.users: ${e1.message}`);
  const authUsers = page1.users;
  if (authUsers.length === 0) return [];

  const ids = authUsers.map((u) => u.id);

  // 2. Profiles
  const { data: profiles, error: eP } = await supabaseAdmin
    .from('profiles')
    .select('id, name, profession, current_device_id, trial_ends_at')
    .in('id', ids);
  if (eP) throw new Error(`Gagal list profiles: ${eP.message}`);

  // 3. Subscriptions (semua, lalu pilih terbaru per user)
  const { data: subs, error: eS } = await supabaseAdmin
    .from('subscriptions')
    .select('id, user_id, status, plan, starts_at, ends_at')
    .in('user_id', ids)
    .order('ends_at', { ascending: false });
  if (eS) throw new Error(`Gagal list subscriptions: ${eS.message}`);

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const subMap = new Map<string, AdminUserRow['subscription']>();
  for (const s of subs ?? []) {
    if (!subMap.has(s.user_id)) {
      subMap.set(s.user_id, {
        id: s.id,
        status: s.status as any,
        plan: s.plan as any,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
      });
    }
  }

  return authUsers
    .map((u) => {
      const p = profMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? '',
        name: p?.name ?? '',
        profession: p?.profession ?? 'LAINNYA',
        trialEndsAt: p?.trial_ends_at ?? null,
        currentDeviceId: p?.current_device_id ?? null,
        createdAt: u.created_at,
        subscription: subMap.get(u.id) ?? null,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function grantSubscription(
  userId: string,
  plan: 'MONTHLY' | 'YEARLY',
  months: number
): Promise<void> {
  const days = plan === 'YEARLY' ? months * 365 : months * 30;
  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    status: 'ACTIVE',
    plan,
    starts_at: new Date().toISOString(),
    ends_at: endsAt,
  });
  if (error) throw new Error(`Gagal grant: ${error.message}`);
  revalidatePath('/dashboard/users');
}

export async function forceLogoutUser(userId: string): Promise<void> {
  // Set current_device_id ke null. Realtime listener di mobile (Fase 5)
  // akan tangkap perubahan ini dan trigger logout otomatis.
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ current_device_id: null })
    .eq('id', userId);
  if (error) throw new Error(`Gagal force logout: ${error.message}`);
  revalidatePath('/dashboard/users');
}
