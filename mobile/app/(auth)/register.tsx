import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore, type Profession } from '../../lib/auth-store';
import { supabase } from '../../lib/supabase';
import { normalizeIdPhone } from '../../lib/auth-helpers';
import { colors, space, fontSize, radius } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

const PROFESSIONS: { value: Profession; label: string }[] = [
  { value: 'DOKTER', label: 'Dokter' },
  { value: 'APOTEKER', label: 'Apoteker' },
  { value: 'PERAWAT', label: 'Perawat' },
  { value: 'BIDAN', label: 'Bidan' },
  { value: 'MAHASISWA', label: 'Mahasiswa' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [profession, setProfession] = useState<Profession>('DOKTER');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Lengkapi', 'Nama wajib diisi.');
    if (!email.trim()) return Alert.alert('Lengkapi', 'Email wajib diisi.');
    if (!email.includes('@')) return Alert.alert('Format salah', 'Email tidak valid.');
    if (!phone.trim()) return Alert.alert('Lengkapi', 'Nomor HP wajib diisi.');
    const phoneE164 = normalizeIdPhone(phone);
    if (!phoneE164) return Alert.alert('Format salah', 'Nomor HP tidak valid (contoh: 08123456789).');
    if (password.length < 6) return Alert.alert('Password lemah', 'Password minimal 6 karakter.');
    if (password !== password2) return Alert.alert('Tidak cocok', 'Konfirmasi password tidak sama.');

    setBusy(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        profession,
        phone: phoneE164,
      });
      Alert.alert(
        'Akun dibuat',
        'Cek email Anda untuk konfirmasi (jika diaktifkan), lalu login. Trial 14 hari aktif setelah login pertama.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (/already registered|user already|email.*exist/i.test(msg)) {
        Alert.alert('Pendaftaran gagal', 'Email sudah terdaftar.');
      } else if (/network|fetch/i.test(msg)) {
        Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      } else {
        Alert.alert('Error', msg || 'Terjadi kesalahan.');
      }
    } finally {
      setBusy(false);
    }
  };

  const registerWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const redirectTo = Linking.createURL('/(auth)/complete-profile');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Tidak ada URL OAuth.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) return;

      const url = new URL(result.url);
      const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (setErr) throw setErr;
        // _layout akan deteksi profile.phone null → arahkan ke complete-profile
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (/provider.*not.*enabled|unsupported.*provider/i.test(msg)) {
        Alert.alert(
          'Google login belum aktif',
          'Admin perlu mengaktifkan Google Provider di Supabase Dashboard.'
        );
      } else {
        Alert.alert('Daftar Google gagal', msg || 'Coba lagi.');
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: space.lg }}>
          <Text style={{ color: colors.primary, fontSize: fontSize.md }}>← Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Daftar Akun Baru</Text>
        <Text style={styles.subtitle}>Free trial 14 hari, langganan setelahnya.</Text>

        <Pressable onPress={registerWithGoogle} style={[styles.googleBtn, googleBusy && { opacity: 0.5 }]} disabled={googleBusy}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>{googleBusy ? 'Memuat…' : 'Daftar dengan Google'}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau daftar manual</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nama lengkap</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
        </View>

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
          <Text style={styles.label}>Nomor HP</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="08123456789"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password (min 6 karakter)</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Konfirmasi password</Text>
          <TextInput style={styles.input} secureTextEntry value={password2} onChangeText={setPassword2} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Profesi</Text>
          <View style={styles.chips}>
            {PROFESSIONS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => setProfession(p.value)}
                style={[styles.chip, profession === p.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, profession === p.value && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={submit} style={[styles.btn, busy && { opacity: 0.5 }]} disabled={busy}>
          <Text style={styles.btnText}>{busy ? 'Memproses…' : 'Daftar'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: space.xl },
  field: { marginBottom: space.lg },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: space.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: space.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.bgSubtle,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingVertical: space.sm, paddingHorizontal: space.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.sm },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: {
    marginTop: space.md, backgroundColor: colors.primary, padding: space.lg,
    borderRadius: radius.md, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space.md, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
    padding: space.lg, borderRadius: radius.md, marginBottom: space.lg,
  },
  googleIcon: { fontSize: 20, fontWeight: '900', color: '#4285F4' },
  googleText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { paddingHorizontal: space.md, color: colors.textMuted, fontSize: fontSize.sm },
});
