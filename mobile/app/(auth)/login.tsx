import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../lib/auth-store';
import { detectIdentifier } from '../../lib/auth-helpers';
import { supabase } from '../../lib/supabase';
import { colors, space, fontSize, radius } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { login, forceLogoutReason, clearForceLogoutReason } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async () => {
    const id = identifier.trim();
    if (!id || !password) return;

    const kind = detectIdentifier(id);
    if (kind === 'phone') {
      Alert.alert(
        'Login dengan HP belum didukung',
        'Saat ini login hanya via email atau Google. Login dengan nomor HP akan tersedia di update berikutnya.'
      );
      return;
    }
    if (kind !== 'email') {
      Alert.alert('Format salah', 'Masukkan email yang valid.');
      return;
    }

    setBusy(true);
    try {
      await login(id, password);
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

  const loginWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const redirectTo = Linking.createURL('/(auth)/login');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Tidak ada URL OAuth dari Supabase.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        // user cancel atau error
        return;
      }
      // Parse hash fragment untuk dapat tokens
      const url = new URL(result.url);
      const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (setErr) throw setErr;
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (/provider.*not.*enabled|unsupported.*provider/i.test(msg)) {
        Alert.alert(
          'Google login belum aktif',
          'Admin perlu mengaktifkan Google Provider di Supabase Dashboard → Authentication → Providers → Google.'
        );
      } else {
        Alert.alert('Login Google gagal', msg || 'Coba lagi.');
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Dosis Obat</Text>
          <Text style={styles.subtitle}>Masuk untuk mulai menghitung</Text>

          {forceLogoutReason && (
            <View style={styles.notice}>
              <Text style={styles.noticeIcon}>ℹ️</Text>
              <Text style={styles.noticeText}>{forceLogoutReason}</Text>
              <Text onPress={clearForceLogoutReason} style={styles.noticeDismiss}>×</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email atau Nomor HP</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="nama@email.com / 08xx (HP belum aktif)"
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

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: space.md }}>
            <Text style={styles.linkSmall}>Lupa password?</Text>
          </Pressable>

          <Pressable onPress={submit} style={[styles.btn, busy && styles.btnDisabled]} disabled={busy}>
            <Text style={styles.btnText}>{busy ? 'Memuat…' : 'Masuk'}</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={loginWithGoogle} style={[styles.googleBtn, googleBusy && styles.btnDisabled]} disabled={googleBusy}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>{googleBusy ? 'Memuat…' : 'Masuk dengan Google'}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/register')} style={{ marginTop: space.lg }}>
            <Text style={styles.registerText}>
              Belum punya akun? <Text style={{ fontWeight: 'bold', color: colors.primary }}>Daftar</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingTop: space.xxl },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: space.xxl },
  field: { marginBottom: space.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: space.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.bgSubtle,
  },
  linkSmall: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  btn: {
    backgroundColor: colors.primary, padding: space.lg,
    borderRadius: radius.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: space.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { paddingHorizontal: space.md, color: colors.textMuted, fontSize: fontSize.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    borderRadius: radius.md,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  registerText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: fontSize.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.lg,
  },
  noticeIcon: { fontSize: fontSize.lg },
  noticeText: { flex: 1, color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  noticeDismiss: { color: colors.textMuted, fontSize: 24, lineHeight: 24, paddingHorizontal: space.sm },
});
