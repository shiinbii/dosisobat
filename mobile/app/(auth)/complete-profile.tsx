import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore, type Profession } from '../../lib/auth-store';
import { normalizeIdPhone } from '../../lib/auth-helpers';
import { colors, space, fontSize, radius } from '../../lib/theme';

const PROFESSIONS: { value: Profession; label: string }[] = [
  { value: 'DOKTER', label: 'Dokter' },
  { value: 'APOTEKER', label: 'Apoteker' },
  { value: 'PERAWAT', label: 'Perawat' },
  { value: 'BIDAN', label: 'Bidan' },
  { value: 'MAHASISWA', label: 'Mahasiswa' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, refreshMe } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState<Profession>('DOKTER');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.profession && user.profession !== 'LAINNYA') setProfession(user.profession);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const submit = async () => {
    if (!phone.trim()) return Alert.alert('Lengkapi', 'Nomor HP wajib diisi.');
    const phoneE164 = normalizeIdPhone(phone);
    if (!phoneE164) return Alert.alert('Format salah', 'Nomor HP tidak valid (contoh: 08123456789).');

    setBusy(true);
    try {
      if (!user) throw new Error('Belum login.');
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phoneE164, profession })
        .eq('id', user.id);
      if (error) throw error;
      await refreshMe();
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert('Gagal', e?.message ?? 'Tidak dapat menyimpan profil.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Lengkapi Profil</Text>
        <Text style={styles.subtitle}>
          Halo {user.name?.split(' ')[0] ?? user.email}! Lengkapi data berikut untuk mulai pakai aplikasi.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.readonlyValue}>{user.email}</Text>
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
          <Text style={styles.btnText}>{busy ? 'Menyimpan…' : 'Simpan & Masuk Aplikasi'}</Text>
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
  readonlyValue: {
    padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgSubtle,
    fontSize: fontSize.md, color: colors.textMuted,
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
