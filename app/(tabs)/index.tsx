import { useMemo } from 'react';
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, HEADPHONE_TAGS } from '@/constants/theme';
import { peso, columnsForWidth } from '@/utils/format';
import { applyFilter, useStore } from '@/store/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui';
import { useProductSearch } from '@/services/useProductSearch';

const BANNER_IMG =
  'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80&auto=format&fit=crop';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { settings, cartCount, cartSubtotal, filter, setFilter, products } = useStore();
  const numCols = columnsForWidth(width);
  const webWide = Platform.OS === 'web' && width >= 900;

  const sqlProducts = useProductSearch(filter.query, products);
  const tagFiltered = useMemo(() => {
    const f = filter.tag === 'All' ? { ...filter, tag: 'All' as const } : filter;
    return applyFilter(sqlProducts, { ...f, category: 'All', query: '' });
  }, [sqlProducts, filter]);

  const featured = useMemo(() => tagFiltered.slice(0, 12), [tagFiltered]);

  const activeTag = filter.tag;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Ionicons name="flash" size={22} color={COLORS.ink} />
          </View>
          <View style={styles.greeting}>
            <Text style={styles.brand}>Gadget Shop</Text>
            <Text style={styles.hi}>Hi, {settings.displayName || 'Howard'}</Text>
          </View>
          <Press onPress={() => router.push('/filter')} accessibilityLabel="Search and filter products" style={styles.searchBtn}>
            <Ionicons name="search" size={20} color={COLORS.ink} />
          </Press>
          <Press onPress={() => router.push('/cart')} accessibilityLabel="Open cart" style={styles.cartBtn}>
            <Ionicons name="bag-outline" size={24} color={COLORS.ink} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </Press>
        </View>

        <Text style={styles.cartTotal}>Cart Total - {peso(cartSubtotal)}</Text>

        {/* Banner */}
        <View style={[styles.banner, webWide && { maxWidth: 720 }]}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>The Next{'\n'}Innovation in TV</Text>
            <Text style={styles.bannerSub}>See colour in a new light</Text>
            <Press onPress={() => router.push('/categories')}>
              <Text style={styles.bannerCta}>SHOP QLED TVS</Text>
            </Press>
            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
          <Image source={{ uri: BANNER_IMG }} style={styles.bannerImg} resizeMode="cover" />
        </View>

        {/* Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {HEADPHONE_TAGS.map((t) => {
            const active = activeTag === t;
            return (
              <Press
                key={t}
                onPress={() => setFilter({ ...filter, tag: active ? 'All' : t })}
                style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
              </Press>
            );
          })}
        </ScrollView>

        {/* Featured heading */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <Press onPress={() => router.push('/categories')}>
            <Text style={styles.seeAll}>See All</Text>
          </Press>
        </View>

        {featured.length === 0 ? (
          <EmptyState title="No products found" hint="Try a different search or filter." />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={(p) => p.id}
            numColumns={numCols}
            key={numCols}
            scrollEnabled={false}
            columnWrapperStyle={numCols > 1 ? styles.row : undefined}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ProductCard product={item} />
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  container: { paddingHorizontal: 16, paddingBottom: 24 },
  webContainer: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 64 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { flex: 1 },
  brand: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
  hi: { fontSize: 14, color: COLORS.ink },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -1,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  cartTotal: { fontSize: 14, fontWeight: '500', color: COLORS.ink, marginBottom: 8 },
  banner: {
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 180,
  },
  bannerText: { flex: 1, gap: 8 },
  bannerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.ink, lineHeight: 26 },
  bannerSub: { fontSize: 14, color: COLORS.ink },
  bannerCta: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    textDecorationLine: 'underline',
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  dotActive: { backgroundColor: COLORS.pink },
  bannerImg: { width: 144, height: 148, borderRadius: 16 },
  chips: { marginTop: 16 },
  chip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipIdle: { backgroundColor: COLORS.blue },
  chipActive: { backgroundColor: COLORS.pink },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  chipTextActive: { fontWeight: '700' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
  seeAll: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  grid: { gap: 16 },
  row: { gap: 16 },
  cardWrap: { flex: 1, minWidth: 0 },
});

