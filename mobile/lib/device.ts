import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'dosis.deviceId';

/**
 * Persistent device id for single-device session enforcement.
 * Generated once and stored in SecureStore so it survives app reinstalls
 * (on iOS) and re-launches.
 */
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (id) return id;

  // Try platform-stable identifier first
  if (Platform.OS === 'android') {
    id = (await Application.getAndroidId()) ?? null;
  } else if (Platform.OS === 'ios') {
    id = (await Application.getIosIdForVendorAsync()) ?? null;
  }
  if (!id) {
    // Fallback: random uuid-ish
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

export function getDeviceName(): string {
  return [Device.brand, Device.modelName].filter(Boolean).join(' ') || `${Platform.OS} device`;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}
