import { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { searchIcd10 } from '../../db/sync';
import { useAuthGate } from '../../lib/use-auth-gate';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function Icd10Screen() {
  useAuthGate();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Array<{ code: string; description: string; descriptionId: string | null; category: string | null }>>([]);

  const load = useCallback(async () => {
    const r = await searchIcd10({ q });
    setItems(r);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Cari kode atau diagnosis (mis. demam, A09, J45)"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.code}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.descId}>{item.descriptionId ?? item.description}</Text>
            <Text style={styles.descEn}>{item.description}</Text>
            {!!item.category && <Text style={styles.cat}>{item.category}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: 'center', padding: space.xl }}>
            {q ? 'Tidak ditemukan.' : 'Mulai mengetik di atas.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: space.lg, backgroundColor: colors.bgSubtle, borderBottomWidth: 1, borderBottomColor: colors.border },
  search: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: space.md, fontSize: fontSize.md, color: colors.text,
  },
  card: {
    padding: space.md, borderRadius: radius.md, backgroundColor: colors.bgSubtle,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  code: { fontSize: fontSize.lg, color: colors.primary, fontWeight: 'bold' },
  descId: { fontSize: fontSize.md, color: colors.text, marginTop: 2 },
  descEn: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  cat: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: space.xs },
});
