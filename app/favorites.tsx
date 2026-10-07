import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useStore } from '@/store/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, PrimaryButton } from '@/components/ui';

function favColumns(width: number): number {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numCols = favColumns(width);
  const { favorites, getProduct } = useStore();
  const list = favorites.map((id) => getProduct(id)).filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
          </Press>
          <Text style={styles.title}>Favorites</Text>
          <View style={{ width: 40 }} />
        </View>
        {list.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState icon="heart-outline" title="No favorites yet" hint="Tap the heart on any product to save it here." />
            <PrimaryButton label="Continue Shopping" onPress={() => router.push('/')} />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(p) => p!.id}
            numColumns={numCols}
            key={numCols}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={numCols > 1 ? styles.row : undefined}
            renderItem={({ item }) => (
              <View style={styles.wrap}>
                <ProductCard product={item!} imageContain />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1150,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  emptyWrap: { gap: 4, paddingBottom: 24 },
  grid: { paddingBottom: 24, gap: 16 },
  row: { gap: 16 },
  wrap: { flex: 1, minWidth: 0 },
});
