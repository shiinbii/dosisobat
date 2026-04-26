import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listPatients, listHistory } from '../../db/sync';
import { colors, space, fontSize, radius } from '../../lib/theme';

type Patient = { patientName: string; patientDob: string; lastAt: string; count: number };
type HistoryRow = {
  id: number; patientName: string; patientDob: string; drugName: string;
  doseType: string; weightKg: number | null; perDoseMg: number; perDayMg: number;
  freqPerDay: number; icdCode: string | null; createdAt: string;
};

export default function HistoryScreen() {
  const [view, setView] = useState<'patients' | 'detail'>('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [rows, setRows] = useState<HistoryRow[]>([]);

  const reload = useCallback(async () => {
    const p = (await listPatients()) as Patient[];
    setPatients(p);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const openPatient = async (p: Patient) => {
    setSelected(p);
    const r = (await listHistory({ patientName: p.patientName, patientDob: p.patientDob })) as HistoryRow[];
    setRows(r);
    setView('detail');
  };

  if (view === 'patients') {
    return (
      <View style={styles.safe}>
        <FlatList
          data={patients}
          keyExtractor={(p) => `${p.patientName}-${p.patientDob}`}
          contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openPatient(item)}>
              <Text style={styles.name}>{item.patientName}</Text>
              <Text style={styles.dob}>Lahir: {item.patientDob}</Text>
              <Text style={styles.count}>{item.count} perhitungan • Terakhir: {new Date(item.lastAt).toLocaleString('id-ID')}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', padding: space.xl }}>
              Belum ada riwayat. Hitung dosis lalu simpan ke pasien.
            </Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => { setView('patients'); setSelected(null); }}>
          <Text style={{ color: colors.primary, fontSize: fontSize.md }}>← Pasien</Text>
        </Pressable>
        {selected && (
          <View style={{ marginTop: space.sm }}>
            <Text style={styles.name}>{selected.patientName}</Text>
            <Text style={styles.dob}>Lahir: {selected.patientDob}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowDrug}>{item.drugName} <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>({item.doseType === 'PEDIATRIC' ? 'Anak' : 'Dewasa'})</Text></Text>
            <Text style={styles.rowDose}>{item.perDoseMg.toFixed(2)} mg × {item.freqPerDay}/hari = {item.perDayMg.toFixed(2)} mg/hari</Text>
            {item.weightKg ? <Text style={styles.rowMeta}>BB: {item.weightKg} kg</Text> : null}
            {item.icdCode ? <Text style={styles.rowMeta}>ICD-10: {item.icdCode}</Text> : null}
            <Text style={styles.rowDate}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: space.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgSubtle },
  card: {
    padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgSubtle,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  dob: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  count: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
  row: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgSubtle },
  rowDrug: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  rowDose: { fontSize: fontSize.sm, color: colors.text, marginTop: 2 },
  rowMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
});
