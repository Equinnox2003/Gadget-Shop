import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import type { Product } from '@/data/seed';
import { useStore } from '@/store/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { Rating } from '@/components/ui';
import { toast } from '@/components/Toast';

export function ProductCard({ product, imageContain }: { product: Product; imageContain?: boolean }) {
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const fav = isFavorite(product.id);
  const soldOut = !product.available || product.stock <= 0;
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashAdded = () => {
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  const quickAdd = () => {
    if (!product) {
      Alert.alert('Cart', 'This product is no longer available.');
      return;
    }
    if (soldOut) {
      Alert.alert('Out of stock', 'This product is currently out of stock.');
      return;
    }
    // Every product uses the same cart handler. Configurable products
    // quick-add with sensible defaults (first color / first in-stock
    // option); open details only when a choice is fully unavailable.
    const selected: Record<string, string> = {};
    if ((product.colors ?? []).length > 0) selected['Color'] = product.colors![0];
    for (const g of product.variants ?? []) {
      const opt = g.options.find((o) => o.stock > 0);
      if (!opt) {
        router.push(`/product/${product.id}`);
        return;
      }
      selected[g.label] = opt.name;
    }
    const msg = addToCart(product.id, 1, selected);
    if (msg === 'Added to cart.') {
      flashAdded();
      toast(`Added ${product.name} to cart`);
    } else {
      Alert.alert('Cart', msg);
    }
  };

  return (
    <Press
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.imgWrap}>
        <ProductImage uri={product.image} contain={imageContain} />
        {soldOut && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Out of Stock</Text>
          </View>
        )}
        <Press
          onPress={() => toggleFavorite(product.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={fav ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          style={styles.heart}>
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={18}
            color={fav ? COLORS.pinkDark : COLORS.ink}
          />
        </Press>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.price}>{peso(product.price)}</Text>
      <View style={styles.row}>
        <Rating value={product.rating} />
        <Press
          onPress={quickAdd}
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          style={[styles.add, soldOut && { backgroundColor: '#E5E7EB' }, added && styles.added]}>
          <Ionicons name={added ? 'checkmark' : 'add'} size={20} color={COLORS.ink} />
        </Press>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 8,
    gap: 8,
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imgWrap: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  soldOut: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: { fontSize: 13, fontWeight: '800', color: COLORS.ink },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  add: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  added: { backgroundColor: '#BBF7D0' },
});
