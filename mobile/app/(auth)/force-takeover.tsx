import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { ApiError } from '../../lib/api';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function ForceTakeoverScreen() {
  const router = useRouter();
  const {
    pendingLoginEmail, pendingLoginPassword, conflictDeviceName,
    login, clearConflict,
  } = useAuthStore();
  const [busy, setBusy] = useState(false);

  const cancel = () => {
    clearConflict();
    router.replace('/(auth)/login');
  };

  const force = async () => {
    if (!pendingLoginEmail || !pendingLoginPassword) {
      cancel();
      return;
    }
    setBusy(true);
    try {
      await login(pendingLoginEmail, pendingLoginPassword, true);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Gagal mengambil alih sesi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Sesi aktif di perangkat lain</Text>
        <Text style={styles.body}>
          Akun ini saat ini sedang login di{' '}
          <Text style={{ fontWeight: 'bold' }}>{conflictDeviceName ?? 'perangkat lain'}</Text>.
        </Text>
        <Text style={styles.body}>
          Setiap akun hanya boleh aktif di 1 perangkat. Untuk login di perangkat ini,
          Anda harus mengambil alih sesi (perangkat lama akan otomatis logout).
        </Text>

        <Pressable onPress={force} disabled={busy} style={[styles.btn, busy && { opacity: 0.5 }]}>
          <Text style={styles.btnText}>{busy ? 'Memproses…' : 'Login di sini & logout perangkat lama'}</Text>
        </Pressable>

        <Pressable onPress={cancel} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Batal</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  box: { padding: space.xl },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: space.md },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: space.lg },
  body: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: space.md, lineHeight: 22 },
  btn: { marginTop: space.xl, backgroundColor: colors.primary, padding: space.lg, borderRadius: radius.md, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  btnSecondary: { marginTop: space.md, padding: space.md, alignItems: 'center' },
  btnSecondaryText: { color: colors.textMuted, fontSize: fontSize.md },
});
