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
  const { ready, session, init } = useAuthStore();
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
    if (disclaimerAccepted && !session && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }
    if (disclaimerAccepted && session && (inAuth || onDisclaimer)) {
      router.replace('/(app)');
      return;
    }
  }, [ready, session, segments, disclaimerAccepted]);

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
