import { create } from 'zustand';
import type { Session, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getDeviceId } from './device';

export type Profession = 'DOKTER' | 'APOTEKER' | 'PERAWAT' | 'BIDAN' | 'MAHASISWA' | 'LAINNYA';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  profession: Profession;
  trialEndsAt: string | null;
};

export type SubscriptionStatus = {
  isActive: boolean;
  kind: 'TRIAL' | 'PAID' | 'EXPIRED' | 'NONE';
  endsAt: string | null;
  daysRemaining: number | null;
};

type ProfileRow = {
  id: string;
  name: string;
  profession: Profession;
  current_device_id: string | null;
  trial_ends_at: string | null;
};

type SubscriptionRow = {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  plan: 'TRIAL' | 'MONTHLY' | 'YEARLY';
  starts_at: string;
  ends_at: string;
};

type State = {
  ready: boolean;
  session: Session | null;
  user: CurrentUser | null;
  subscription: SubscriptionStatus | null;
  /** Set kalau user di-logout paksa karena login di device lain. */
  forceLogoutReason: string | null;

  init: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; profession: Profession }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearForceLogoutReason: () => void;
};

function deriveStatus(profile: ProfileRow | null, sub: SubscriptionRow | null): SubscriptionStatus {
  const now = Date.now();
  const subEnds = sub ? new Date(sub.ends_at).getTime() : null;
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at).getTime() : null;
  const endsAt = subEnds ?? trialEnds;
  const isActive =
    !!sub &&
    (sub.status === 'TRIAL' || sub.status === 'ACTIVE') &&
    subEnds !== null &&
    subEnds > now;

  let kind: SubscriptionStatus['kind'] = 'NONE';
  if (sub) {
    if (isActive && sub.status === 'TRIAL') kind = 'TRIAL';
    else if (isActive && sub.status === 'ACTIVE') kind = 'PAID';
    else kind = 'EXPIRED';
  }

  const daysRemaining =
    isActive && endsAt !== null
      ? Math.max(0, Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24)))
      : null;

  return {
    isActive,
    kind,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    daysRemaining,
  };
}

async function fetchProfileAndSub(userId: string) {
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = (profileRes.data as ProfileRow | null) ?? null;
  const sub = (subRes.data as SubscriptionRow | null) ?? null;
  return { profile, sub };
}

function buildUser(session: Session, profile: ProfileRow | null): CurrentUser {
  const meta = (session.user.user_metadata ?? {}) as Record<string, string>;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: profile?.name ?? meta.name ?? '',
    profession: (profile?.profession ?? (meta.profession as Profession) ?? 'LAINNYA') as Profession,
    trialEndsAt: profile?.trial_ends_at ?? null,
  };
}

// ============================================================
// Realtime listener — single-active-device enforcement
// ============================================================

let realtimeChannel: RealtimeChannel | null = null;
let listenerDeviceId: string | null = null;
let listenerUserId: string | null = null;

function stopRealtimeListener() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  listenerDeviceId = null;
  listenerUserId = null;
}

function startRealtimeListener(userId: string, myDeviceId: string) {
  // Kalau sudah listen untuk user+device yang sama, skip.
  if (realtimeChannel && listenerUserId === userId && listenerDeviceId === myDeviceId) return;
  stopRealtimeListener();

  listenerUserId = userId;
  listenerDeviceId = myDeviceId;

  realtimeChannel = supabase
    .channel(`profile-changes:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      async (payload) => {
        const newDevice = (payload.new as any)?.current_device_id as string | null | undefined;
        if (newDevice && newDevice !== myDeviceId) {
          // Device lain login — kita harus logout.
          await supabase.auth.signOut();
          useAuthStore.setState({
            forceLogoutReason: 'Akun Anda login di perangkat lain. Sesi di perangkat ini diakhiri.',
          });
        }
      }
    )
    .subscribe();
}

async function claimDevice(userId: string, deviceId: string) {
  // Update current_device_id ke device kita. Trigger realtime UPDATE → device
  // sebelumnya (kalau ada) akan menerima event dan logout sendiri.
  const { error } = await supabase
    .from('profiles')
    .update({ current_device_id: deviceId })
    .eq('id', userId);
  if (error) {
    console.warn('[auth] gagal claim device:', error.message);
  }
}

// ============================================================
// Store
// ============================================================

export const useAuthStore = create<State>((set, get) => ({
  ready: false,
  session: null,
  user: null,
  subscription: null,
  forceLogoutReason: null,

  async init() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const userId = data.session.user.id;
      const myDeviceId = await getDeviceId();
      const { profile, sub } = await fetchProfileAndSub(userId);

      // Kalau profile.current_device_id sudah berubah ke device lain saat
      // app ini offline → langsung sign out.
      if (profile && profile.current_device_id && profile.current_device_id !== myDeviceId) {
        await supabase.auth.signOut();
        set({
          session: null,
          user: null,
          subscription: null,
          ready: true,
          forceLogoutReason: 'Akun Anda login di perangkat lain.',
        });
      } else {
        // Re-claim device & start realtime listener.
        await claimDevice(userId, myDeviceId);
        startRealtimeListener(userId, myDeviceId);
        set({
          session: data.session,
          user: buildUser(data.session, profile),
          subscription: deriveStatus(profile, sub),
          ready: true,
        });
      }
    } else {
      set({ session: null, user: null, subscription: null, ready: true });
    }

    supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!newSession) {
        stopRealtimeListener();
        set({ session: null, user: null, subscription: null });
        return;
      }
      const myDeviceId = await getDeviceId();
      const { profile, sub } = await fetchProfileAndSub(newSession.user.id);

      // Untuk SIGNED_IN (login baru) — claim device.
      // Untuk TOKEN_REFRESHED / INITIAL_SESSION — sudah di-handle di init().
      if (event === 'SIGNED_IN') {
        await claimDevice(newSession.user.id, myDeviceId);
      }
      startRealtimeListener(newSession.user.id, myDeviceId);

      set({
        session: newSession,
        user: buildUser(newSession, profile),
        subscription: deriveStatus(profile, sub),
      });
    });
  },

  async register({ email, password, name, profession }) {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), profession },
      },
    });
    if (error) throw error;
  },

  async login(email, password) {
    set({ forceLogoutReason: null });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    // claimDevice + state refresh dijalankan oleh onAuthStateChange handler.
  },

  async logout() {
    stopRealtimeListener();
    await supabase.auth.signOut();
  },

  async refreshMe() {
    const session = get().session;
    if (!session) return;
    const { profile, sub } = await fetchProfileAndSub(session.user.id);
    set({
      user: buildUser(session, profile),
      subscription: deriveStatus(profile, sub),
    });
  },

  clearForceLogoutReason() {
    set({ forceLogoutReason: null });
  },
}));
