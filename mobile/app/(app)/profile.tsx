import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../lib/auth-store';
import { colors, space, fontSize, radius } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, subscription, logout } = useAuthStore();

  const doLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
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
          Akun ini hanya boleh aktif di 1 perangkat. Login di perangkat lain akan otomatis logout perangkat ini.
        </Text>
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
});
