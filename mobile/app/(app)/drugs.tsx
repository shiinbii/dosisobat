import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchDrugs, type LocalDrug } from '../../db/sync';
import { useAuthGate } from '../../lib/use-auth-gate';
import { colors, space, fontSize, radius } from '../../lib/theme';

const ROUTES = [
  { value: '', label: 'Semua' },
  { value: 'ORAL', label: 'Oral' },
  { value: 'INJECTION', label: 'Injeksi' },
  { value: 'TOPICAL', label: 'Topikal' },
  { value: 'INHALATION', label: 'Inhalasi' },
  { value: 'RECTAL', label: 'Rektal' },
];

export default function DrugsScreen() {
  useAuthGate();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [route, setRoute] = useState('');
  const [items, setItems] = useState<LocalDrug[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await searchDrugs({ q, route: route || undefined });
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [q, route]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q, route, load]);

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Cari nama obat / merek…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
        <View style={styles.chips}>
          {ROUTES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRoute(r.value)}
              style={[styles.chip, route === r.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, route === r.value && styles.chipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: space.lg }} />}

      <FlatList
        data={items}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/(app)/drug/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            {!!item.brandNames && (
              <Text style={styles.brands} numberOfLines={1}>{item.brandNames}</Text>
            )}
            <View style={styles.cardRow}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.routes}>{item.routes.replace(/,/g, ' • ')}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', padding: space.xl }}>
              {q ? 'Tidak ditemukan.' : 'Mulai cari obat di atas, atau lakukan sinkron jika belum.'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: space.lg, gap: space.md, backgroundColor: colors.bgSubtle, borderBottomWidth: 1, borderBottomColor: colors.border },
  search: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: space.md,
    borderWidth: 1, borderColor: colors.border, fontSize: fontSize.md, color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { paddingVertical: 6, paddingHorizontal: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: colors.bgSubtle, padding: space.md, borderRadius: radius.md,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  brands: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs, gap: space.sm },
  category: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  routes: { fontSize: fontSize.xs, color: colors.textMuted },
});
