import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from './auth-store';

/**
 * Redirect ke login screen kalau user belum login saat screen ini ter-focus.
 * Pakai di tiap screen yang butuh authentication (Obat, ICD-10, Riwayat, Profil, dll.).
 */
export function useAuthGate() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const ready = useAuthStore((s) => s.ready);

  useFocusEffect(
    useCallback(() => {
      if (ready && !session) {
        router.replace('/(auth)/login');
      }
    }, [ready, session, router])
  );

  return { isLoggedIn: !!session, ready };
}
