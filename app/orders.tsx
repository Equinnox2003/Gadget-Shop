import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, ORDER_STATUSES } from '@/constants/theme';
import { formatDateTime, peso } from '@/utils/format';
import { useStore } from '@/store/StoreContext';
import type { OrderStatus } from '@/data/seed';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui';

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const { orders, updateOrderStatus } = useStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Orders</Text>
        <View style={{ width: 40 }} />
      </View>
      {orders.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" hint="Complete a checkout to see orders here." />
      ) : (
        <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
          {orders.map((o) => (
            <View key={o.id} style={styles.card}>
              <View style={styles.head}>
                <View>
                  <Text style={styles.oid}>{o.id}</Text>
                  <Text style={styles.date}>{formatDateTime(o.date)}</Text>
                </View>
                <View style={[styles.status, statusStyle(o.status)]}>
                  <Text style={styles.statusText}>{o.status}</Text>
                </View>
              </View>
              {o.items.map((i, idx) => (
                <View key={`${o.id}-${idx}`} style={styles.item}>
                  <View style={styles.thumb}>
                    <ProductImage uri={i.image} rounded={8} iconSize={18} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {i.name} × {i.qty}
                    </Text>
                    {Object.keys(i.selected).length > 0 && (
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {Object.entries(i.selected).map(([k, v]) => `${v}`).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.itemTotal}>{peso(i.price * i.qty)}</Text>
                </View>
              ))}
              <View style={styles.totals}>
                <Text style={styles.totalsText}>
                  Subtotal {peso(o.subtotal)} · Fee {peso(o.deliveryFee)} · Disc -{peso(o.discount)}
                </Text>
                <Text style={styles.grand}>Total {peso(o.total)}</Text>
                <Text style={styles.pay}>
                  {o.paymentMethod}
                  {o.coupon ? ` · ${o.coupon}` : ''} · {o.customer.name}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                {ORDER_STATUSES.map((s) => (
                  <Press
                    key={s}
                    onPress={() => updateOrderStatus(o.id, s as OrderStatus)}
                    style={[styles.sChip, o.status === s && styles.sChipActive]}>
                    <Text style={[styles.sText, o.status === s && styles.sTextActive]}>{s}</Text>
                  </Press>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function statusStyle(s: OrderStatus) {
  switch (s) {
    case 'Delivered':
      return { backgroundColor: '#DCFCE7' };
    case 'Cancelled':
      return { backgroundColor: '#FEE2E2' };
    case 'Shipped':
      return { backgroundColor: COLORS.blue };
    default:
      return { backgroundColor: '#FEF3C7' };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  webContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#F1F3F5', padding: 14, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  oid: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  date: { fontSize: 12, color: COLORS.muted },
  status: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  itemSub: { fontSize: 12, color: COLORS.muted },
  itemTotal: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  totals: { borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingTop: 8, gap: 2 },
  totalsText: { fontSize: 12, color: COLORS.muted },
  grand: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  pay: { fontSize: 12, color: COLORS.muted },
  statusRow: { flexDirection: 'row' },
  sChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.page,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sChipActive: { backgroundColor: COLORS.pink },
  sText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
  sTextActive: { fontWeight: '800' },
});

