import { useProductSearch } from '@/services/useProductSearch';
import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, HEADPHONE_TAGS, SORT_OPTIONS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { applyFilter, useStore } from '@/store/StoreContext';
import type { HeadphoneTag, SortKey } from '@/data/seed';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/ui';
import { toast } from '@/components/Toast';

export default function FilterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const {
    products,
    filter,
    setFilter,
    recentSearches,
    pushRecent,
    clearRecent,
  } = useStore();

  const [query, setQuery] = useState(filter.query);
  const [tag, setTag] = useState<HeadphoneTag | 'All'>(filter.tag);
  const [sort, setSort] = useState<SortKey>(filter.sort);
  const [minPrice, setMinPrice] = useState(filter.minPrice);
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice);

  const popular = useMemo(
    () => [...products].sort((a, b) => b.rating - a.rating).slice(0, 3),
    [products]
  );

  const sqlProducts = useProductSearch(query, products);

  const apply = () => {
    if (query.trim()) pushRecent(query.trim());
    const next = { ...filter, query, tag, sort, minPrice, maxPrice, category: 'All' as const };
    const matches = applyFilter(sqlProducts, { ...next, query: '' }).length;
    setFilter(next);
    toast(matches === 1 ? '1 product matches your filters' : `${matches} products match your filters`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Filter</Text>
        <Press onPress={() => router.back()} accessibilityLabel="Close filter" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.ink} />
        </Press>
      </View>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.ink} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search headphone"
            placeholderTextColor={COLORS.faint}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={apply}
          />
        </View>

        <Text style={styles.muted}>{sqlProducts.length} matching products</Text>
        <Text style={styles.section}>Latest Search</Text>
        {recentSearches.length === 0 ? (
          <Text style={styles.muted}>No recent searches yet.</Text>
        ) : (
          recentSearches.slice(0, 4).map((r) => (
            <Press key={r} onPress={() => setQuery(r)} style={styles.recentRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.ink} />
              <Text style={styles.recentText}>{r}</Text>
              <Ionicons name="arrow-up-outline" size={16} color={COLORS.ink} />
            </Press>
          ))
        )}
        {recentSearches.length > 0 && (
          <Press onPress={clearRecent}>
            <Text style={styles.clear}>Clear history</Text>
          </Press>
        )}

        <Text style={styles.section}>Category</Text>
        <View style={styles.wrap}>
          {HEADPHONE_TAGS.map((t) => (
            <Press
              key={t}
              onPress={() => setTag(tag === t ? 'All' : t)}
              style={[styles.chip, tag === t ? styles.chipActive : styles.chipIdle]}>
              <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>{t}</Text>
            </Press>
          ))}
        </View>

        <Text style={styles.section}>Sort By</Text>
        <View style={styles.sortGrid}>
          {SORT_OPTIONS.map((s) => (
            <Press
              key={s.key}
              onPress={() => setSort(s.key as SortKey)}
              style={[styles.sortChip, sort === s.key ? styles.chipActive : styles.chipIdle]}>
              <Text style={[styles.chipText, sort === s.key && styles.chipTextActive]}>
                {s.label}
              </Text>
            </Press>
          ))}
        </View>

        <Text style={styles.section}>Price Range</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <TextInput
              value={minPrice}
              onChangeText={(t) => setMinPrice(t.replace(/[^0-9]/g, ''))}
              placeholder="Min"
              keyboardType="numeric"
              style={styles.priceInput}
            />
            <Text style={styles.peso}>₱</Text>
          </View>
          <View style={styles.priceBox}>
            <TextInput
              value={maxPrice}
              onChangeText={(t) => setMaxPrice(t.replace(/[^0-9]/g, ''))}
              placeholder="Max"
              keyboardType="numeric"
              style={styles.priceInput}
            />
            <Text style={styles.peso}>₱</Text>
          </View>
        </View>

        <Text style={styles.section}>Popular Product</Text>
        {popular.map((p) => (
          <Press
            key={p.id}
            onPress={() => router.push(`/product/${p.id}`)}
            style={styles.popRow}>
            <View style={styles.popImg}>
              <ProductImage uri={p.image} rounded={12} iconSize={24} />
            </View>
            <View style={styles.popInfo}>
              <Text style={styles.popName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.popPrice}>{peso(p.price)}</Text>
            </View>
            <Rating value={p.rating} />
          </Press>
        ))}

        <Press onPress={apply} style={[styles.apply, webWide && styles.applyWeb]}>
          <Text style={styles.applyText}>Apply Filter</Text>
        </Press>
      </ScrollView>
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.ink },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 16, paddingBottom: 24, gap: 4 },
  webContainer: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blue,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink },
  section: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginTop: 12 },
  muted: { fontSize: 14, color: COLORS.muted },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 28 },
  recentText: { flex: 1, fontSize: 14, color: COLORS.ink },
  clear: { fontSize: 13, fontWeight: '700', color: COLORS.pinkDark, marginTop: 4 },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIdle: { backgroundColor: COLORS.blue },
  chipActive: { backgroundColor: COLORS.pink },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  chipTextActive: { fontWeight: '700' },
  sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: {
    flexGrow: 1,
    minWidth: '30%',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', gap: 16 },
  priceBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDF1F5',
    paddingHorizontal: 16,
  },
  priceInput: { flex: 1, fontSize: 14, color: COLORS.ink },
  peso: { fontSize: 14, color: COLORS.ink },
  popRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, marginTop: 8 },
  popImg: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  popInfo: { flex: 1 },
  popName: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  popPrice: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  apply: {
    backgroundColor: COLORS.pink,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  applyWeb: { maxWidth: 320, alignSelf: 'center', width: '100%' },
  applyText: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
});

