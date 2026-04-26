import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/auth-store';
import { syncCatalog } from '../../db/sync';
import { flagStorage, FLAG_LAST_SYNC_AT } from '../../lib/storage';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, session, subscription, refreshMe } = useAuthStore();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const isLoggedIn = !!session;

  useEffect(() => {
    if (isLoggedIn) refreshMe();
    flagStorage.get(FLAG_LAST_SYNC_AT).then(setLastSync);
    if (isLoggedIn) {
      (async () => {
        const hasSync = await flagStorage.get(FLAG_LAST_SYNC_AT);
        if (!hasSync) doSync();
      })();
    }
  }, [isLoggedIn]);

  const requireLogin = () => {
    router.push('/(auth)/login');
  };

  const doSync = async () => {
    if (!isLoggedIn) return requireLogin();
    setSyncing(true);
    try {
      const r = await syncCatalog();
      const ts = new Date().toISOString();
      setLastSync(ts);
      Alert.alert('Sinkron selesai', `${r.drugs} obat & ${r.icd10} ICD-10 ter-update.`);
    } catch (e: any) {
      Alert.alert('Sinkron gagal', e?.message ?? 'Cek koneksi internet.');
    } finally {
      setSyncing(false);
    }
  };

  const subBadge = (() => {
    if (!subscription) return null;
    if (subscription.kind === 'TRIAL') return { label: `Trial • ${subscription.daysRemaining} hari tersisa`, color: colors.warning };
    if (subscription.kind === 'PAID') return { label: `Aktif • ${subscription.daysRemaining} hari`, color: colors.success };
    if (subscription.kind === 'EXPIRED') return { label: 'Trial Berakhir', color: colors.danger };
    return null;
  })();

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: space.lg }}>
      {isLoggedIn ? (
        <>
          <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0] ?? 'Sejawat'} 👋</Text>
          {subBadge && (
            <View style={[styles.badge, { backgroundColor: subBadge.color }]}>
              <Text style={styles.badgeText}>{subBadge.label}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.loginCta}>
          <Text style={styles.loginCtaTitle}>Selamat datang di Dosis Obat</Text>
          <Text style={styles.loginCtaText}>
            Login atau daftar dulu untuk mulai cari obat, hitung dosis, dan simpan riwayat pasien.
          </Text>
          <Pressable onPress={requireLogin} style={styles.loginCtaBtn}>
            <Text style={styles.loginCtaBtnText}>Masuk / Daftar</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.grid}>
        <Pressable
          style={styles.tile}
          onPress={() => (isLoggedIn ? router.push('/(app)/drugs') : requireLogin())}
        >
          <Text style={styles.tileEmoji}>💊</Text>
          <Text style={styles.tileTitle}>Cari Obat</Text>
          <Text style={styles.tileSub}>Hitung dosis dewasa & anak</Text>
        </Pressable>

        <Pressable
          style={styles.tile}
          onPress={() => (isLoggedIn ? router.push('/(app)/icd10') : requireLogin())}
        >
          <Text style={styles.tileEmoji}>📋</Text>
          <Text style={styles.tileTitle}>ICD-10</Text>
          <Text style={styles.tileSub}>Diagnosis pasien</Text>
        </Pressable>

        <Pressable
          style={styles.tile}
          onPress={() => (isLoggedIn ? router.push('/(app)/history') : requireLogin())}
        >
          <Text style={styles.tileEmoji}>📚</Text>
          <Text style={styles.tileTitle}>Riwayat</Text>
          <Text style={styles.tileSub}>Per pasien</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={doSync} disabled={syncing}>
          <Text style={styles.tileEmoji}>{syncing ? '⏳' : '🔄'}</Text>
          <Text style={styles.tileTitle}>{syncing ? 'Menyinkron…' : 'Sinkron'}</Text>
          <Text style={styles.tileSub}>
            {!isLoggedIn
              ? 'Login dulu'
              : lastSync
                ? `Terakhir: ${new Date(lastSync).toLocaleString('id-ID')}`
                : 'Belum sinkron'}
          </Text>
        </Pressable>
      </View>

      {isLoggedIn && subscription?.kind === 'EXPIRED' && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Trial telah berakhir</Text>
          <Text style={styles.warningBody}>
            Hubungi admin untuk mengaktifkan langganan. Fitur kalkulator dosis sementara dinonaktifkan.
          </Text>
        </View>
      )}

      {syncing && <ActivityIndicator color={colors.primary} style={{ marginTop: space.lg }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  greeting: { fontSize: fontSize.xl, color: colors.text, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.lg, marginTop: space.sm },
  badgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '600' },
  loginCta: {
    padding: space.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    marginBottom: space.md,
  },
  loginCtaTitle: { color: '#fff', fontSize: fontSize.xl, fontWeight: '700' },
  loginCtaText: { color: '#fff', fontSize: fontSize.sm, marginTop: space.xs, lineHeight: 20, opacity: 0.95 },
  loginCtaBtn: {
    marginTop: space.md,
    backgroundColor: '#fff',
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  loginCtaBtnText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl },
  tile: {
    flexBasis: '47%',
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.lg, padding: space.lg, gap: space.xs,
  },
  tileEmoji: { fontSize: 32 },
  tileTitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  tileSub: { fontSize: fontSize.sm, color: colors.textMuted },
  warningBox: {
    marginTop: space.xl, padding: space.lg, backgroundColor: '#fef2f2',
    borderLeftWidth: 4, borderLeftColor: colors.danger, borderRadius: radius.md,
  },
  warningTitle: { color: colors.danger, fontWeight: '600', fontSize: fontSize.md, marginBottom: space.xs },
  warningBody: { color: colors.text, fontSize: fontSize.sm },
});
