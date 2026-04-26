import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { syncHistoryFromCloud } from '../../db/sync';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, subscription, logout } = useAuthStore();
  const [syncingHistory, setSyncingHistory] = useState(false);

  const doLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const doSyncHistory = async () => {
    setSyncingHistory(true);
    try {
      const r = await syncHistoryFromCloud();
      Alert.alert(
        'Sinkron riwayat',
        `${r.inserted} riwayat baru dari cloud, ${r.existing} sudah ada di lokal.`
      );
    } catch (e: any) {
      Alert.alert('Sinkron gagal', e?.message ?? 'Cek koneksi internet.');
    } finally {
      setSyncingHistory(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: space.lg }}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.profession}>{user.profession}</Text>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Status Langganan</Text>
        {subscription ? (
          <>
            <Text style={styles.line}>
              Tipe:{' '}
              <Text style={{ fontWeight: '600' }}>
                {subscription.kind === 'TRIAL' ? 'Trial' : subscription.kind === 'PAID' ? 'Berlangganan' : 'Berakhir'}
              </Text>
            </Text>
            {subscription.endsAt && (
              <Text style={styles.line}>
                Berakhir: {new Date(subscription.endsAt).toLocaleDateString('id-ID')}
              </Text>
            )}
            {subscription.daysRemaining != null && subscription.isActive && (
              <Text style={styles.line}>Sisa {subscription.daysRemaining} hari</Text>
            )}
            {!subscription.isActive && (
              <Text style={[styles.line, { color: colors.danger }]}>
                Hubungi admin untuk aktivasi langganan.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.line}>Memuat…</Text>
        )}
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Perangkat</Text>
        <Text style={styles.line}>
          Login di perangkat lain akan otomatis logout perangkat ini (single-active-device).
        </Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>Riwayat Cloud</Text>
        <Text style={styles.line}>
          Riwayat perhitungan otomatis di-backup ke cloud. Tarik dari cloud untuk
          menggabungkan dengan riwayat lokal di perangkat ini.
        </Text>
        <Pressable onPress={doSyncHistory} disabled={syncingHistory} style={styles.syncBtn}>
          {syncingHistory ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.syncBtnText}>⬇ Tarik riwayat dari cloud</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={doLogout} style={styles.logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  name: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
  email: { fontSize: fontSize.md, color: colors.textMuted, marginTop: space.xs },
  profession: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: space.xs },
  box: { marginTop: space.xl, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.bgSubtle },
  boxTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: space.sm },
  line: { fontSize: fontSize.sm, color: colors.text, marginTop: 2, lineHeight: 20 },
  logout: { marginTop: space.xxl, padding: space.lg, alignItems: 'center', borderRadius: radius.md, backgroundColor: '#fef2f2' },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.md },
  syncBtn: {
    marginTop: space.md,
    padding: space.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  syncBtnText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
});
