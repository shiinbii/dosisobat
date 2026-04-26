import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sensitive: token. Use SecureStore.
const TOKEN_KEY = 'dosis.token';

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (v: string) => SecureStore.setItemAsync(TOKEN_KEY, v),
  remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

// Non-sensitive flags
export const flagStorage = {
  get: (k: string) => AsyncStorage.getItem(k),
  set: (k: string, v: string) => AsyncStorage.setItem(k, v),
  remove: (k: string) => AsyncStorage.removeItem(k),
};

export const FLAG_DISCLAIMER_ACCEPTED = 'dosis.disclaimer.accepted.v1';
export const FLAG_LAST_SYNC_AT = 'dosis.lastSyncAt';
export const FLAG_CATALOG_VERSION = 'dosis.catalogVersion';
