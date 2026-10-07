import { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { columnsForWidth } from '@/utils/format';
import { peso } from '@/utils/format';
import { useStore } from '@/store/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState } from '@/components/ui';
import { toast } from '@/components/Toast';
import { useProductSearch } from '@/services/useProductSearch';
import { confirmDelete as confirmRemoval } from '@/services/confirm';

export default function ProductManagementScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numCols = Math.min(columnsForWidth(width), 3);
  const webWide = Platform.OS === 'web' && width >= 900;
  const { products, deleteProduct } = useStore();

  const [query, setQuery] = useState('');
  const results = useProductSearch(query, products);
  const confirmDelete = (id: string, name: string) =>
    confirmRemoval('Delete Product', `Remove ${name}?`, () => {
      deleteProduct(id);
      toast(`Deleted "${name}"`);
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Products ({products.length})</Text>
        <Press onPress={() => router.push('/manage/product-form')} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.ink} />
          <Text style={styles.addText}>Add</Text>
        </Press>
      </View>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search products by name..." accessibilityLabel="Search products" style={{ marginHorizontal: 16, padding: 12, borderWidth: 1, borderColor: COLORS.blue, backgroundColor: '#fff', borderRadius: 12 }} />
      {results.length === 0 ? (
        <EmptyState icon="cube-outline" title={query ? "No matching products" : "No products"} hint={query ? "Try another keyword." : "Tap Add to create your first product."} />
      ) : (
        <FlatList
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(p) => p.id}
          numColumns={numCols}
          key={numCols}
          contentContainerStyle={[styles.grid, webWide && styles.web]}
          columnWrapperStyle={numCols > 1 ? styles.row : undefined}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imgBox}>
                <ProductImage uri={item.image} rounded={12} iconSize={28} />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.brand} · {item.category}
              </Text>
              <Text style={styles.price}>{peso(item.price)}</Text>
              <Text style={styles.stock}>
                Stock {item.stock} · {item.available ? 'Available' : 'Out of Stock'}
              </Text>
              <View style={styles.actions}>
                <Press
                  onPress={() => router.push({ pathname: '/manage/product-form', params: { id: item.id } })}
                  style={styles.edit}>
                  <Text style={styles.editText}>Edit</Text>
                </Press>
                <Press onPress={() => confirmDelete(item.id, item.name)} style={styles.del}>
                  <Text style={styles.delText}>Delete</Text>
                </Press>
              </View>
            </View>
          )}
        />
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
    height: 52,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.pink,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 36,
  },
  addText: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  grid: { padding: 16, gap: 12 },
  web: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  row: { gap: 12 },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#F1F3F5', padding: 10, gap: 4, minWidth: 0 },
  imgBox: { height: 120, borderRadius: 12, overflow: 'hidden' },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  meta: { fontSize: 12, color: COLORS.muted },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  stock: { fontSize: 12, color: COLORS.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  edit: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  del: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { fontSize: 13, fontWeight: '800', color: COLORS.danger },
});

