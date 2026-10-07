import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { bucketSales, type TimeRange } from '@/utils/chart';
import { useStore } from '@/store/StoreContext';
import { BarRow, EmptyState } from '@/components/ui';
import { SalesLineChart } from '@/components/SalesLineChart';

export default function ReportsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const { orders, products } = useStore();
  const [range, setRange] = useState<TimeRange>('daily');

  const totalSales = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? totalSales / totalOrders : 0;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outStock = products.filter((p) => p.stock <= 0 || !p.available);

  const best = useMemo(() => {
    const m = new Map<string, { name: string; qty: number }>();
    for (const o of orders) {
      if (o.status === 'Cancelled') continue;
      for (const i of o.items) {
        const e = m.get(i.productId) ?? { name: i.name, qty: 0 };
        e.qty += i.qty;
        m.set(i.productId, e);
      }
    }
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [orders]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) {
      if (o.status === 'Cancelled') continue;
      for (const i of o.items) m.set(i.category, (m.get(i.category) ?? 0) + i.price * i.qty);
    }
    return (CATEGORIES as readonly string[]).map((c) => ({ label: c, value: m.get(c) ?? 0 }));
  }, [orders]);

  const byBrand = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) {
      if (o.status === 'Cancelled') continue;
      for (const i of o.items) m.set(i.brand, (m.get(i.brand) ?? 0) + i.price * i.qty);
    }
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [orders]);

  const overTime = useMemo(() => bucketSales(orders, range), [orders, range]);

  const maxBest = Math.max(1, ...best.map((b) => b.qty));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.value));
  const maxBrand = Math.max(1, ...byBrand.map((b) => b.value));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        <View style={styles.cards}>
          <Card label="Total Sales" value={peso(totalSales)} />
          <Card label="Total Orders" value={String(totalOrders)} />
          <Card label="Avg Order Value" value={peso(aov)} />
          <Card label="Total Products" value={String(products.length)} />
          <Card label="Low Stock" value={String(lowStock.length)} warn />
          <Card label="Out of Stock" value={String(outStock.length)} warn />
        </View>

        <Text style={styles.section}>Best-Selling Gadgets</Text>
        {best.length === 0 ? (
          <Text style={styles.muted}>
            No completed sales yet — best sellers are calculated from real order quantities.
          </Text>
        ) : (
          best.map((b) => <BarRow key={b.name} label={b.name} value={b.qty} max={maxBest} sub={`${b.qty} sold`} />)
        )}

        <Text style={styles.section}>Sales by Category</Text>
        {byCategory.every((c) => c.value === 0) ? (
          <Text style={styles.muted}>No category revenue yet.</Text>
        ) : (
          byCategory.map((c) => (
            <BarRow key={c.label} label={c.label} value={c.value} max={maxCat} color="#7FB8E8" sub={peso(c.value)} />
          ))
        )}

        <Text style={styles.section}>Sales by Brand</Text>
        {byBrand.length === 0 ? (
          <Text style={styles.muted}>No brand revenue yet.</Text>
        ) : (
          byBrand.map((b) => (
            <BarRow key={b.label} label={b.label} value={b.value} max={maxBrand} color="#9BD3AE" sub={peso(b.value)} />
          ))
        )}

        <Text style={styles.section}>Sales Over Time</Text>
        <View style={styles.rangeRow}>
          {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((r) => (
            <Press
              key={r}
              onPress={() => setRange(r)}
              style={[styles.range, range === r && styles.rangeActive]}>
              <Text style={styles.rangeText}>{r[0].toUpperCase() + r.slice(1)}</Text>
            </Press>
          ))}
        </View>
        <SalesLineChart data={overTime} />

        <Text style={styles.section}>Low Stock Report (≤ 5)</Text>
        {lowStock.length === 0 && outStock.length === 0 ? (
          <Text style={styles.muted}>All products are well stocked.</Text>
        ) : (
          [...outStock, ...lowStock.filter((p) => !outStock.includes(p))].map((p) => (
            <Press
              key={p.id}
              onPress={() => router.push('/manage/inventory')}
              style={styles.lowRow}>
              <View>
                <Text style={styles.lowName}>{p.name}</Text>
                <Text style={styles.lowSub}>
                  {p.stock === 0 ? 'Out of Stock' : `Low Stock — ${p.stock} left`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.ink} />
            </Press>
          ))
        )}
        {orders.length === 0 && (
          <EmptyState
            icon="bar-chart-outline"
            title="No orders yet"
            hint="Reports update automatically once real orders exist."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={[styles.card, warn && { backgroundColor: '#FFF7ED' }]}>
      <Text style={styles.cardValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
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
  container: { padding: 16, paddingBottom: 32 },
  webContainer: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: COLORS.blue,
    borderRadius: 16,
    padding: 14,
  },
  cardValue: { fontSize: 17, fontWeight: '800', color: COLORS.ink },
  cardLabel: { fontSize: 12, color: COLORS.ink, marginTop: 2 },
  section: { fontSize: 17, fontWeight: '800', color: COLORS.ink, marginTop: 20, marginBottom: 8 },
  muted: { fontSize: 13, color: COLORS.muted },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  range: { paddingHorizontal: 14, height: 32, borderRadius: 16, backgroundColor: COLORS.page, justifyContent: 'center' },
  rangeActive: { backgroundColor: COLORS.pink },
  rangeText: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  lowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    marginBottom: 8,
  },
  lowName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  lowSub: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
});

