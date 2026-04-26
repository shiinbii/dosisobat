import { create } from 'zustand';
import { api, ApiError } from './api';
import { tokenStorage } from './storage';
import { getDeviceId, getDeviceName, getPlatform } from './device';

export type Profession = 'DOKTER' | 'APOTEKER' | 'PERAWAT' | 'BIDAN' | 'MAHASISWA' | 'LAINNYA';

export type SubscriptionStatus = {
  isActive: boolean;
  kind: 'TRIAL' | 'PAID' | 'EXPIRED' | 'NONE';
  endsAt: string | null;
  daysRemaining: number | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  profession: Profession;
  trialEndsAt?: string;
};

type State = {
  ready: boolean;
  user: CurrentUser | null;
  subscription: SubscriptionStatus | null;

  // login flow / device conflict
  pendingLoginEmail: string | null;
  pendingLoginPassword: string | null;
  conflictDeviceName: string | null;

  init: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; profession: Profession }) => Promise<void>;
  login: (email: string, password: string, force?: boolean) => Promise<{ ok: boolean; conflict?: boolean }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  clearConflict: () => void;
};

export const useAuthStore = create<State>((set, get) => ({
  ready: false,
  user: null,
  subscription: null,
  pendingLoginEmail: null,
  pendingLoginPassword: null,
  conflictDeviceName: null,

  async init() {
    try {
      const token = await tokenStorage.get();
      if (!token) {
        set({ ready: true });
        return;
      }
      try {
        const me = await api<{ user: CurrentUser; subscription: SubscriptionStatus }>('/auth/me');
        set({ user: me.user, subscription: me.subscription, ready: true });
      } catch (err) {
        // token invalid or session replaced — clear
        await tokenStorage.remove();
        set({ user: null, subscription: null, ready: true });
      }
    } catch {
      set({ ready: true });
    }
  },

  async register(data) {
    await api('/auth/register', { method: 'POST', body: data, auth: false });
  },

  async login(email, password, force = false) {
    const deviceId = await getDeviceId();
    const deviceName = getDeviceName();
    const platform = getPlatform();
    try {
      const res = await api<{ token: string; user: CurrentUser; subscription: SubscriptionStatus }>(
        '/auth/login',
        {
          method: 'POST',
          auth: false,
          body: { email, password, deviceId, deviceName, platform, force },
        }
      );
      await tokenStorage.set(res.token);
      set({
        user: res.user,
        subscription: res.subscription,
        pendingLoginEmail: null,
        pendingLoginPassword: null,
        conflictDeviceName: null,
      });
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.code === 'DEVICE_CONFLICT') {
        set({
          pendingLoginEmail: email,
          pendingLoginPassword: password,
          conflictDeviceName: (err.details as any)?.activeDeviceName ?? 'perangkat lain',
        });
        return { ok: false, conflict: true };
      }
      throw err;
    }
  },

  async logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    await tokenStorage.remove();
    set({ user: null, subscription: null });
  },

  async refreshMe() {
    try {
      const me = await api<{ user: CurrentUser; subscription: SubscriptionStatus }>('/auth/me');
      set({ user: me.user, subscription: me.subscription });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await tokenStorage.remove();
        set({ user: null, subscription: null });
      }
    }
  },

  clearConflict() {
    set({ pendingLoginEmail: null, pendingLoginPassword: null, conflictDeviceName: null });
  },
}));
