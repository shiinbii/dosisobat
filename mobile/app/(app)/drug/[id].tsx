import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDrugById, addHistory, type LocalDrug } from '../../../db/sync';
import {
  calcPediatric, calcAdult, freqLabel, type PediatricResult, type AdultResult,
} from '../../../lib/dose-calc';
import { useAuthStore } from '../../../lib/auth-store';
import { colors, space, fontSize, radius } from '../../../lib/theme';

type Mode = 'PEDIATRIC' | 'ADULT';

export default function DrugDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { subscription } = useAuthStore();
  const [drug, setDrug] = useState<LocalDrug | null>(null);
  const [mode, setMode] = useState<Mode>('PEDIATRIC');
  const [weight, setWeight] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [pedResult, setPedResult] = useState<PediatricResult | null>(null);
  const [adultResult, setAdultResult] = useState<AdultResult | null>(null);

  // Save-history form
  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [icdCode, setIcdCode] = useState('');

  useEffect(() => {
    if (!id) return;
    getDrugById(id).then(setDrug);
  }, [id]);

  const subActive = subscription?.isActive ?? false;

  const calc = () => {
    if (!drug) return;
    if (!subActive) {
      Alert.alert('Akses dibatasi', 'Trial berakhir. Hubungi admin untuk aktifkan langganan.');
      return;
    }
    if (mode === 'PEDIATRIC') {
      const w = Number(weight);
      const a = ageMonths ? Number(ageMonths) : undefined;
      if (!w) {
        Alert.alert('Input', 'Masukkan berat badan.');
        return;
      }
      setPedResult(calcPediatric(drug, drug.forms, { weightKg: w, ageMonths: a }));
      setAdultResult(null);
    } else {
      setAdultResult(calcAdult(drug, drug.forms));
      setPedResult(null);
    }
  };

  const save = async () => {
    if (!drug) return;
    if (!patientName.trim() || !patientDob.trim()) {
      Alert.alert('Input', 'Isi nama pasien dan tanggal lahir (YYYY-MM-DD).');
      return;
    }
    const r = pedResult ?? adultResult;
    if (!r || !r.ok) {
      Alert.alert('Hitung dulu', 'Lakukan perhitungan terlebih dahulu.');
      return;
    }
    const perDoseMg = pedResult?.perDoseMg ?? adultResult?.perDoseMaxMg ?? 0;
    const perDayMg = pedResult?.perDayMg ?? adultResult?.perDayMaxMg ?? 0;
    const freqPerDay = pedResult?.freqPerDay ?? adultResult?.freqPerDay ?? 0;
    await addHistory({
      patientName: patientName.trim(),
      patientDob: patientDob.trim(),
      drugId: drug.id,
      drugName: drug.name,
      doseType: mode,
      weightKg: pedResult ? Number(weight) : undefined,
      perDoseMg, perDayMg, freqPerDay,
      icdCode: icdCode.trim() || undefined,
    });
    Alert.alert('Tersimpan', 'Riwayat perhitungan disimpan.');
  };

  if (!drug) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 2 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: space.md }}>
          <Text style={{ color: colors.primary }}>← Kembali</Text>
        </Pressable>

        <Text style={styles.h1}>{drug.name}</Text>
        {!!drug.brandNames && <Text style={styles.brands}>{drug.brandNames}</Text>}
        <Text style={styles.category}>{drug.category}</Text>
        <Text style={styles.routes}>Rute: {drug.routes.replace(/,/g, ', ')}</Text>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeBtn, mode === 'PEDIATRIC' && styles.modeBtnActive]} onPress={() => setMode('PEDIATRIC')}>
            <Text style={[styles.modeText, mode === 'PEDIATRIC' && styles.modeTextActive]}>Anak</Text>
          </Pressable>
          <Pressable style={[styles.modeBtn, mode === 'ADULT' && styles.modeBtnActive]} onPress={() => setMode('ADULT')}>
            <Text style={[styles.modeText, mode === 'ADULT' && styles.modeTextActive]}>Dewasa</Text>
          </Pressable>
        </View>

        {/* Pediatric input */}
        {mode === 'PEDIATRIC' && (
          <View style={styles.box}>
            <Text style={styles.label}>Berat badan (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              placeholder="contoh: 12.5"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Usia (bulan, opsional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={ageMonths}
              onChangeText={setAgeMonths}
              placeholder="contoh: 24"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <Pressable onPress={calc} style={styles.calcBtn}>
          <Text style={styles.calcBtnText}>Hitung Dosis</Text>
        </Pressable>
        {!subActive && (
          <Text style={styles.lockedNote}>🔒 Kalkulator dosis terkunci — trial telah berakhir.</Text>
        )}

        {/* Pediatric result */}
        {pedResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Hasil Perhitungan (Anak)</Text>
            {!pedResult.ok ? (
              <Text style={styles.resultErr}>{pedResult.reason}</Text>
            ) : (
              <>
                <Text style={styles.resultBig}>
                  {pedResult.perDoseMg.toFixed(2)} mg / dosis
                </Text>
                <Text style={styles.resultLine}>{freqLabel(pedResult.freqPerDay)}</Text>
                <Text style={styles.resultLine}>Total/hari: {pedResult.perDayMg.toFixed(2)} mg</Text>
                {pedResult.warnings.map((w, i) => (
                  <Text key={i} style={styles.resultWarn}>⚠️ {w}</Text>
                ))}
                <Text style={styles.resultSubTitle}>Konversi ke sediaan:</Text>
                {pedResult.formConversions.map((c) => (
                  <Text key={c.formId} style={styles.formLine}>
                    • {c.formType} {c.strength}: <Text style={{ fontWeight: 'bold' }}>{c.amountText}</Text>
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* Adult result */}
        {adultResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Hasil (Dewasa)</Text>
            {!adultResult.ok ? (
              <Text style={styles.resultErr}>{adultResult.reason}</Text>
            ) : (
              <>
                <Text style={styles.resultBig}>
                  {adultResult.perDoseMinMg === adultResult.perDoseMaxMg
                    ? `${adultResult.perDoseMaxMg} mg / dosis`
                    : `${adultResult.perDoseMinMg}–${adultResult.perDoseMaxMg} mg / dosis`}
                </Text>
                <Text style={styles.resultLine}>{freqLabel(adultResult.freqPerDay)}</Text>
                <Text style={styles.resultLine}>
                  Total/hari: {adultResult.perDayMinMg}–{adultResult.perDayMaxMg} mg
                </Text>
                {adultResult.warnings.map((w, i) => (
                  <Text key={i} style={styles.resultWarn}>⚠️ {w}</Text>
                ))}
                <Text style={styles.resultSubTitle}>Konversi (dosis maks):</Text>
                {adultResult.formConversions.map((c) => (
                  <Text key={c.formId} style={styles.formLine}>
                    • {c.formType} {c.strength}: <Text style={{ fontWeight: 'bold' }}>{c.amountText}</Text>
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* Save to history */}
        {(pedResult?.ok || adultResult?.ok) && (
          <View style={styles.box}>
            <Text style={styles.h2}>Simpan ke Riwayat Pasien</Text>
            <Text style={styles.label}>Nama pasien</Text>
            <TextInput style={styles.input} value={patientName} onChangeText={setPatientName} />
            <Text style={styles.label}>Tanggal lahir (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={patientDob}
              onChangeText={setPatientDob}
              placeholder="2020-05-12"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Kode ICD-10 (opsional)</Text>
            <TextInput
              style={styles.input}
              value={icdCode}
              onChangeText={setIcdCode}
              autoCapitalize="characters"
              placeholder="J06.9"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={save} style={[styles.calcBtn, { backgroundColor: colors.success, marginTop: space.md }]}>
              <Text style={styles.calcBtnText}>Simpan</Text>
            </Pressable>
          </View>
        )}

        {/* Sediaan */}
        <Text style={styles.h2}>Sediaan</Text>
        {drug.forms.map((f) => (
          <View key={f.id} style={styles.formCard}>
            <Text style={styles.formType}>{f.type}</Text>
            <Text style={styles.formStrength}>{f.strength}</Text>
            {!!f.packaging && <Text style={styles.formPack}>{f.packaging}</Text>}
          </View>
        ))}

        {/* Detail obat */}
        <Text style={styles.h2}>Detail</Text>
        {detailLine('Komposisi', drug.composition)}
        {detailLine('Indikasi', drug.indication)}
        {detailLine('Kontraindikasi', drug.contraindication)}
        {detailLine('Efek Samping', drug.sideEffects)}
        {detailLine('Peringatan', drug.warning)}
        {detailLine('Catatan dosis anak', drug.pediNotes)}
        {detailLine('Catatan dosis dewasa', drug.adultNotes)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function detailLine(label: string, value?: string | null) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  h1: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  h2: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginTop: space.xl, marginBottom: space.sm },
  brands: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  category: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: space.xs },
  routes: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  modeBtn: {
    flex: 1, padding: space.md, alignItems: 'center', borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border, backgroundColor: colors.bgSubtle,
  },
  modeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  modeText: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  box: { marginTop: space.lg, padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgSubtle, gap: space.xs },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: space.md,
    backgroundColor: '#fff', fontSize: fontSize.md, color: colors.text,
  },
  calcBtn: { marginTop: space.lg, backgroundColor: colors.primary, padding: space.lg, borderRadius: radius.md, alignItems: 'center' },
  calcBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
  lockedNote: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center', marginTop: space.sm },
  resultBox: { marginTop: space.lg, padding: space.lg, borderRadius: radius.md, backgroundColor: '#ecfeff', borderLeftWidth: 4, borderLeftColor: colors.primary },
  resultTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  resultBig: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.primary, marginTop: space.xs },
  resultLine: { fontSize: fontSize.md, color: colors.text, marginTop: 2 },
  resultErr: { color: colors.danger, fontSize: fontSize.md, marginTop: space.xs },
  resultWarn: { color: colors.warning, fontSize: fontSize.sm, marginTop: space.xs },
  resultSubTitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: space.md, fontWeight: '600' },
  formLine: { fontSize: fontSize.sm, color: colors.text, marginTop: 2 },
  formCard: {
    padding: space.md, marginTop: space.sm, borderRadius: radius.sm,
    backgroundColor: colors.bgSubtle, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  formType: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  formStrength: { fontSize: fontSize.md, color: colors.text, marginTop: 2 },
  formPack: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  detail: { marginTop: space.sm },
  detailLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  detailValue: { fontSize: fontSize.sm, color: colors.text, marginTop: 2, lineHeight: 20 },
});
