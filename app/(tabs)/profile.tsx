import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useStore } from '@/store/StoreContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const { settings, orders, favorites, cartCount } = useStore();

  const links: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sub: string;
    href: string;
  }[] = [
    { icon: 'receipt-outline', label: 'Orders', sub: `${orders.length} order(s)`, href: '/orders' },
    { icon: 'heart-outline', label: 'Favorites', sub: `${favorites.length} saved`, href: '/favorites' },
    { icon: 'bag-outline', label: 'Cart', sub: `${cartCount} item(s)`, href: '/cart' },
    { icon: 'cube-outline', label: 'Product Management', sub: 'Add, edit, delete', href: '/manage/products' },
    { icon: 'archive-outline', label: 'Inventory', sub: 'Stock & availability', href: '/manage/inventory' },
    { icon: 'bar-chart-outline', label: 'Reports', sub: 'Sales & analytics', href: '/manage/reports' },
    { icon: 'settings-outline', label: 'Settings', sub: 'Store preferences', href: '/settings' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={COLORS.ink} />
          </View>
          <Text style={styles.name}>{settings.displayName || 'Howard'}</Text>
          <Text style={styles.sub}>Gadget Shop member</Text>
          <Text style={styles.status}>
            {settings.online ? '● Online' : '○ Offline (simulated)'}
          </Text>
        </View>
        {links.map((l) => (
          <Press key={l.label} onPress={() => router.push(l.href as never)} style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name={l.icon} size={22} color={COLORS.ink} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{l.label}</Text>
              <Text style={styles.rowSub}>{l.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.ink} />
          </Press>
        ))}
        <Text style={styles.note}>Logout is a placeholder in this demo build.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  container: { padding: 16, gap: 8, paddingBottom: 32 },
  webContainer: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  profile: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.ink },
  sub: { fontSize: 14, color: COLORS.muted },
  status: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  rowSub: { fontSize: 12, color: COLORS.muted },
  note: { fontSize: 12, color: COLORS.faint, textAlign: 'center', marginTop: 12 },
});

