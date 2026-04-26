import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';

// Placeholder: single-device flow lama dihapus. Fase 5 akan repurpose
// screen ini untuk notice "Anda di-logout karena login di device lain".
export default function ForceTakeoverScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(auth)/login');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
