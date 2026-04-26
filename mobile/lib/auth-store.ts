import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

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

  init: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; profession: Profession }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
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

export const useAuthStore = create<State>((set, get) => ({
  ready: false,
  session: null,
  user: null,
  subscription: null,

  async init() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { profile, sub } = await fetchProfileAndSub(data.session.user.id);
      set({
        session: data.session,
        user: buildUser(data.session, profile),
        subscription: deriveStatus(profile, sub),
        ready: true,
      });
    } else {
      set({ session: null, user: null, subscription: null, ready: true });
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        const { profile, sub } = await fetchProfileAndSub(newSession.user.id);
        set({
          session: newSession,
          user: buildUser(newSession, profile),
          subscription: deriveStatus(profile, sub),
        });
      } else {
        set({ session: null, user: null, subscription: null });
      }
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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    // onAuthStateChange listener akan refresh state otomatis
  },

  async logout() {
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
}));
