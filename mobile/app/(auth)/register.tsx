import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore, type Profession } from '../../lib/auth-store';
import { ApiError } from '../../lib/api';
import { colors, space, fontSize, radius } from '../../lib/theme';

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
  const { register, login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profession, setProfession] = useState<Profession>('DOKTER');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Lengkapi semua field.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter.');
      return;
    }
    setBusy(true);
    try {
      await register({ email: email.trim(), password, name: name.trim(), profession });
      // auto-login
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        Alert.alert('Pendaftaran gagal', 'Email sudah terdaftar.');
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
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: space.lg }}>
          <Text style={{ color: colors.primary, fontSize: fontSize.md }}>← Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Daftar Akun Baru</Text>
        <Text style={styles.subtitle}>Free trial 14 hari, langganan setelahnya.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nama</Text>
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
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password (min 6 karakter)</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
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
});
