import { useMemo, useState } from 'react';
import {
  FlatList,
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
import { CATEGORIES, COLORS } from '@/constants/theme';
import { columnsForWidth } from '@/utils/format';
import { useStore } from '@/store/StoreContext';
import type { CategoryName } from '@/data/seed';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui';

const ICONS: Record<CategoryName, keyof typeof Ionicons.glyphMap> = {
  'TV & Video': 'tv-outline',
  'Camera & Photo': 'camera-outline',
  'Phones & Accessories': 'phone-portrait-outline',
  'Video Games': 'game-controller-outline',
  Headphones: 'headset-outline',
  Speakers: 'volume-high-outline',
  'Computers & Laptops': 'laptop-outline',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { products } = useStore();
  const [selected, setSelected] = useState<CategoryName>('Headphones');
  const numCols = columnsForWidth(width);
  const webWide = Platform.OS === 'web' && width >= 900;
  // Category cards: 3 per row on large desktop, 2 on tablet/smaller
  // laptop, 1 per row on phones. Never a fixed column count.
  const catCols = width >= 1024 ? 3 : width >= 700 ? 2 : 1;

  const list = useMemo(
    () => products.filter((p) => p.category === selected),
    [products, selected]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.push('/')} accessibilityLabel="Go back to home" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        <Text style={styles.intro}>Find your next everyday upgrade.</Text>
        <FlatList
          data={CATEGORIES as readonly CategoryName[]}
          keyExtractor={(c) => c}
          numColumns={catCols}
          key={`cats-${catCols}`}
          scrollEnabled={false}
          columnWrapperStyle={catCols > 1 ? styles.catRow : undefined}
          contentContainerStyle={styles.catGrid}
          renderItem={({ item: c }) => {
            const active = c === selected;
            return (
              <View style={styles.catWrap}>
                <Press
                  onPress={() => setSelected(c)}
                  style={[styles.row, styles.cardFill, active && styles.rowActive]}>
                  <Ionicons
                    name={ICONS[c]}
                    size={24}
                    color={active ? COLORS.pinkDark : COLORS.ink}
                  />
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{c}</Text>
                  <Text style={styles.count}>
                    {products.filter((p) => p.category === c).length}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.ink} />
                </Press>
              </View>
            );
          }}
        />

        <Text style={styles.sectionTitle}>{selected}</Text>
        {list.length === 0 ? (
          <EmptyState title="No products in this category" hint="Add products from Product Management." />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(p) => p.id}
            numColumns={numCols}
            key={`${selected}-${numCols}`}
            scrollEnabled={false}
            columnWrapperStyle={numCols > 1 ? styles.gridRow : undefined}
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
  container: { paddingHorizontal: 16, paddingBottom: 24 },
  webContainer: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  intro: { fontSize: 14, color: COLORS.ink, marginTop: 16 },
  catGrid: { gap: 8, marginTop: 16 },
  catRow: { gap: 8 },
  catWrap: { flex: 1, minWidth: 0 },
  cardFill: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 56,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  rowActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  rowText: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.ink },
  rowTextActive: { fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, marginTop: 20, marginBottom: 8 },
  grid: { gap: 16 },
  gridRow: { gap: 16 },
  cardWrap: { flex: 1, minWidth: 0 },
});

