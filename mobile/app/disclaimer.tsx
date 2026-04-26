import { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { flagStorage, FLAG_DISCLAIMER_ACCEPTED } from '../lib/storage';
import { colors, space, fontSize, radius } from '../lib/theme';

export default function Disclaimer() {
  const router = useRouter();
  const [agree, setAgree] = useState(false);

  const accept = async () => {
    if (!agree) return;
    await flagStorage.set(FLAG_DISCLAIMER_ACCEPTED, '1');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Peringatan Medis</Text>
        <Text style={styles.p}>
          Aplikasi <Text style={{ fontWeight: 'bold' }}>Dosis Obat</Text> adalah alat bantu
          referensi dosis obat untuk tenaga kesehatan profesional. Aplikasi ini{' '}
          <Text style={{ fontWeight: 'bold' }}>BUKAN</Text> pengganti penilaian klinis dokter,
          apoteker, atau petugas medis berlisensi.
        </Text>
        <Text style={styles.p}>
          Anda bertanggung jawab penuh atas keputusan klinis yang Anda buat. Selalu verifikasi
          dosis dengan referensi resmi (BNF for Children, IDAI, Pionas BPOM, brosur produk),
          mempertimbangkan kondisi spesifik pasien (usia, berat badan, fungsi ginjal/hati,
          alergi, riwayat penyakit, kehamilan/menyusui, interaksi obat).
        </Text>
        <Text style={styles.p}>
          Pengembang aplikasi tidak bertanggung jawab atas kerugian, cedera, atau hasil klinis
          yang timbul dari penggunaan aplikasi ini.
        </Text>
        <Text style={styles.p}>
          Dengan melanjutkan, Anda menyatakan bahwa Anda adalah tenaga kesehatan profesional
          atau mahasiswa kesehatan yang memahami batasan ini.
        </Text>

        <View style={styles.agreeRow}>
          <Switch value={agree} onValueChange={setAgree} thumbColor={agree ? colors.primary : '#888'} />
          <Text style={styles.agreeText}>
            Saya memahami dan menyetujui peringatan di atas.
          </Text>
        </View>

        <Pressable
          onPress={accept}
          disabled={!agree}
          style={[styles.btn, !agree && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>Lanjutkan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  h1: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.danger, marginBottom: space.lg },
  p: { fontSize: fontSize.md, color: colors.text, marginBottom: space.md, lineHeight: 22 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg, gap: space.md },
  agreeText: { flex: 1, fontSize: fontSize.md, color: colors.text },
  btn: {
    marginTop: space.xl,
    backgroundColor: colors.primary,
    padding: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
});
