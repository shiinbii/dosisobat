import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { detectIdentifier } from '../../lib/auth-helpers';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const value = identifier.trim();
    if (!value) return;
    const kind = detectIdentifier(value);
    if (kind === 'phone') {
      Alert.alert(
        'Belum didukung',
        'Reset password via SMS/WhatsApp belum aktif. Gunakan email untuk sekarang.'
      );
      return;
    }
    if (kind !== 'email') {
      Alert.alert('Format salah', 'Masukkan email yang valid.');
      return;
    }
    setBusy(true);
    try {
      const redirectTo = Linking.createURL('/(auth)/reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(value, { redirectTo });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak dapat mengirim email reset.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: space.lg }}>
            <Text style={{ color: colors.primary, fontSize: fontSize.md }}>← Kembali</Text>
          </Pressable>

          <Text style={styles.title}>Lupa Password</Text>
          <Text style={styles.subtitle}>
            Masukkan email yang terdaftar. Kami akan kirim link untuk reset password.
          </Text>

          {sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentIcon}>📧</Text>
              <Text style={styles.sentTitle}>Email terkirim</Text>
              <Text style={styles.sentBody}>
                Cek inbox (atau folder spam) di <Text style={{ fontWeight: '600' }}>{identifier}</Text>.
                Klik link di email untuk lanjut reset password.
              </Text>
              <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.btn}>
                <Text style={styles.btnText}>Kembali ke Login</Text>
              </Pressable>
            </View>
          ) : (
            <>
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
              <Pressable onPress={submit} style={[styles.btn, busy && styles.btnDisabled]} disabled={busy}>
                <Text style={styles.btnText}>{busy ? 'Mengirim…' : 'Kirim Link Reset'}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingTop: space.xl },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, marginTop: space.xs, marginBottom: space.xl, lineHeight: 22 },
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
  sentBox: {
    padding: space.lg,
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    borderRadius: radius.md,
  },
  sentIcon: { fontSize: 40, textAlign: 'center', marginBottom: space.sm },
  sentTitle: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: space.sm },
  sentBody: { fontSize: fontSize.sm, color: colors.text, textAlign: 'center', lineHeight: 20, marginBottom: space.lg },
});
