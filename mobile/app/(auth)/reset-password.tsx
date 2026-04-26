import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // User sampai di screen ini setelah klik link reset di email.
    // Supabase otomatis tukar token recovery → session sementara.
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  const submit = async () => {
    if (pw.length < 6) return Alert.alert('Error', 'Password minimal 6 karakter.');
    if (pw !== pw2) return Alert.alert('Error', 'Konfirmasi password tidak cocok.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      Alert.alert('Berhasil', 'Password berhasil diganti. Silakan login dengan password baru.', [
        { text: 'OK', onPress: async () => { await supabase.auth.signOut(); router.replace('/(auth)/login'); } },
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak dapat mengganti password.');
    } finally {
      setBusy(false);
    }
  };

  if (hasSession === null) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.title}>Link sudah kadaluarsa</Text>
          <Text style={styles.subtitle}>
            Link reset password sudah tidak berlaku. Silakan minta link baru lewat halaman lupa password.
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/forgot-password')} style={styles.btn}>
            <Text style={styles.btnText}>Minta Link Baru</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ganti Password</Text>
        <Text style={styles.subtitle}>Masukkan password baru untuk akun Anda.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Password baru (min 6 karakter)</Text>
          <TextInput style={styles.input} secureTextEntry value={pw} onChangeText={setPw} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Konfirmasi password baru</Text>
          <TextInput style={styles.input} secureTextEntry value={pw2} onChangeText={setPw2} />
        </View>
        <Pressable onPress={submit} style={[styles.btn, busy && { opacity: 0.5 }]} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Menyimpan…' : 'Simpan Password Baru'}</Text>
        </Pressable>
      </ScrollView>
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
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
});
