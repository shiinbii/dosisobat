import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      // onAuthStateChange di store + effect di _layout akan handle redirect ke (app)
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (/invalid login credentials|invalid_credentials/i.test(msg)) {
        Alert.alert('Login gagal', 'Email atau password salah.');
      } else if (/email not confirmed/i.test(msg)) {
        Alert.alert('Email belum dikonfirmasi', 'Cek email konfirmasi dari Supabase.');
      } else if (/network|fetch/i.test(msg)) {
        Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      } else {
        Alert.alert('Error', msg || 'Terjadi kesalahan.');
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
});
