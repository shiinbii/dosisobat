import AsyncStorage from '@react-native-async-storage/async-storage';

// Non-sensitive flags. Token sudah di-handle Supabase Auth (AsyncStorage internal).
export const flagStorage = {
  get: (k: string) => AsyncStorage.getItem(k),
  set: (k: string, v: string) => AsyncStorage.setItem(k, v),
  remove: (k: string) => AsyncStorage.removeItem(k),
};

export const FLAG_DISCLAIMER_ACCEPTED = 'dosis.disclaimer.accepted.v1';
export const FLAG_LAST_SYNC_AT = 'dosis.lastSyncAt';
export const FLAG_CATALOG_VERSION = 'dosis.catalogVersion';
