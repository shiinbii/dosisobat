import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../lib/auth-store';
import { flagStorage, FLAG_DISCLAIMER_ACCEPTED } from '../lib/storage';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { ready, session, user, init } = useAuthStore();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const v = await flagStorage.get(FLAG_DISCLAIMER_ACCEPTED);
      setDisclaimerAccepted(!!v);
      await init();
      SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  useEffect(() => {
    if (!ready || disclaimerAccepted === null) return;
    const inAuth = segments[0] === '(auth)';
    const inApp = segments[0] === '(app)';
    const onDisclaimer = segments[0] === 'disclaimer';

    if (!disclaimerAccepted && !onDisclaimer) {
      router.replace('/disclaimer');
      return;
    }
    // Logged-in user yang profilnya belum lengkap (mis. baru daftar via Google
    // tanpa nomor HP) → arahkan ke complete-profile.
    const onCompleteProfile = segments.join('/').includes('complete-profile');
    if (disclaimerAccepted && session && user && !user.phone && !onCompleteProfile) {
      router.replace('/(auth)/complete-profile');
      return;
    }
    // Logged-in user dengan profil lengkap di halaman auth/disclaimer → masuk app.
    if (disclaimerAccepted && session && user?.phone && (inAuth || onDisclaimer)) {
      router.replace('/(app)');
      return;
    }
    // Unauthenticated user TIDAK dipaksa ke login. Bisa lihat home,
    // tapi tiap fitur akan redirect sendiri ke login lewat useFocusEffect /
    // onPress handler di screen masing-masing.
  }, [ready, session, user, segments, disclaimerAccepted]);

  if (!ready || disclaimerAccepted === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="disclaimer" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
