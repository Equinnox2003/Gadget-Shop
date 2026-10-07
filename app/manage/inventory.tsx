import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useStore } from '@/store/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui';

export default function InventoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const { products, adjustStock, setStock, setAvailability, adjustVariantStock } = useStore();
  const [exact, setExact] = useState<Record<string, string>>({});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Inventory</Text>
        <View style={{ width: 40 }} />
      </View>
      {products.length === 0 ? (
        <EmptyState icon="archive-outline" title="No products" hint="Add products first." />
      ) : (
        <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
          {products.map((p) => {
            const low = p.stock > 0 && p.stock <= 5;
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.head}>
                  <View style={styles.thumb}>
                    <ProductImage uri={p.image} rounded={10} iconSize={20} />
                  </View>
                  <View style={styles.headInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.meta}>
                      {p.brand} · {p.category}
                    </Text>
                    <View style={styles.badges}>
                      <View
                        style={[
                          styles.badge,
                          p.stock === 0
                            ? { backgroundColor: '#FEE2E2' }
                            : low
                              ? { backgroundColor: '#FEF3C7' }
                              : { backgroundColor: '#DCFCE7' },
                        ]}>
                        <Text style={styles.badgeText}>
                          {p.stock === 0 ? 'Out of Stock' : low ? `Low Stock (${p.stock})` : `Stock ${p.stock}`}
                        </Text>
                      </View>
                      <Text style={styles.avail}>{p.available ? 'Available' : 'Unavailable'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.stockRow}>
                  <Press onPress={() => adjustStock(p.id, -1)} style={styles.step}>
                    <Ionicons name="remove" size={18} color={COLORS.ink} />
                  </Press>
                  <Text style={styles.stockNum}>{p.stock}</Text>
                  <Press onPress={() => adjustStock(p.id, 1)} style={styles.step}>
                    <Ionicons name="add" size={18} color={COLORS.ink} />
                  </Press>
                  <TextInput
                    value={exact[p.id] ?? ''}
                    onChangeText={(t) => setExact((s) => ({ ...s, [p.id]: t.replace(/[^0-9]/g, '') }))}
                    placeholder="Set exact"
                    keyboardType="number-pad"
                    style={styles.exact}
                  />
                  <Press
                    onPress={() => {
                      const v = Number(exact[p.id]);
                      if (Number.isInteger(v) && v >= 0) {
                        setStock(p.id, v);
                        setExact((s) => ({ ...s, [p.id]: '' }));
                      }
                    }}
                    style={styles.setBtn}>
                    <Text style={styles.setText}>Set</Text>
                  </Press>
                </View>

                {(p.variants ?? []).map((g) => (
                  <View key={g.id} style={styles.variantBlock}>
                    <Text style={styles.variantLabel}>{g.label}</Text>
                    {g.options.map((o) => (
                      <View key={o.name} style={styles.variantRow}>
                        <Text style={styles.variantName}>
                          {o.name} — {o.stock}
                        </Text>
                        <View style={styles.vSteps}>
                          <Press
                            onPress={() => adjustVariantStock(p.id, g.id, o.name, -1)}
                            style={styles.vStep}>
                            <Ionicons name="remove" size={14} color={COLORS.ink} />
                          </Press>
                          <Press
                            onPress={() => adjustVariantStock(p.id, g.id, o.name, 1)}
                            style={styles.vStep}>
                            <Ionicons name="add" size={14} color={COLORS.ink} />
                          </Press>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                <View style={styles.actions}>
                  <Press
                    onPress={() => setAvailability(p.id, !p.available)}
                    disabled={!p.available && p.stock <= 0}
                    style={[styles.smallBtn, { backgroundColor: COLORS.blue }]}>
                    <Text style={styles.smallText}>
                      {p.available ? 'Mark Out of Stock' : 'Mark Available'}
                    </Text>
                  </Press>
                  <Press
                    onPress={() => router.push({ pathname: '/manage/product-form', params: { id: p.id } })}
                    style={[styles.smallBtn, { backgroundColor: COLORS.pink }]}>
                    <Text style={styles.smallText}>Edit Product</Text>
                  </Press>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
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
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  webContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#F1F3F5', padding: 12, gap: 10 },
  head: { flexDirection: 'row', gap: 10 },
  thumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  headInfo: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  meta: { fontSize: 12, color: COLORS.muted },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.ink },
  avail: { fontSize: 11, color: COLORS.muted },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockNum: { fontSize: 16, fontWeight: '800', color: COLORS.ink, minWidth: 36, textAlign: 'center' },
  exact: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  setBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setText: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  variantBlock: { backgroundColor: COLORS.page, borderRadius: 12, padding: 10, gap: 6 },
  variantLabel: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  variantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  variantName: { fontSize: 13, color: COLORS.ink },
  vSteps: { flexDirection: 'row', gap: 6 },
  vStep: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actions: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallText: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
});

