import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { ApiError } from '../../lib/api';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, conflictDeviceName } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setBusy(true);
    try {
      const res = await login(email.trim(), password);
      if (res.conflict) {
        // navigate to force-takeover screen
        router.push('/(auth)/force-takeover');
      }
      // On success, _layout effect will route to (app)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        Alert.alert('Login gagal', 'Email atau password salah.');
      } else if (err instanceof ApiError) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Dosis Obat</Text>
          <Text style={styles.subtitle}>Masuk untuk mulai menghitung</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Pressable onPress={submit} style={[styles.btn, busy && styles.btnDisabled]} disabled={busy}>
            <Text style={styles.btnText}>{busy ? 'Memuat…' : 'Masuk'}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/register')} style={{ marginTop: space.lg }}>
            <Text style={{ color: colors.primary, textAlign: 'center', fontSize: fontSize.md }}>
              Belum punya akun? <Text style={{ fontWeight: 'bold' }}>Daftar</Text>
            </Text>
          </Pressable>

          {conflictDeviceName && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                Akun ini sedang aktif di {conflictDeviceName}.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingTop: space.xxl * 2 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: space.xxl },
  field: { marginBottom: space.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: space.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.bgSubtle,
  },
  btn: {
    marginTop: space.md, backgroundColor: colors.primary, padding: space.lg,
    borderRadius: radius.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
  warning: {
    marginTop: space.xl, padding: space.md, backgroundColor: colors.badge, borderRadius: radius.md,
  },
  warningText: { color: colors.warning, fontSize: fontSize.sm },
});
