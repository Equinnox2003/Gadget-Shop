import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { maxQtyForSelection, optionAvailable, useStore } from '@/store/StoreContext';
import { useBusy } from '@/hooks/useBusy';
import { toast } from '@/components/Toast';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, QtyStepper, Rating } from '@/components/ui';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const { getProduct, addToCart, toggleFavorite, isFavorite, setBuyNowItem } = useStore();
  const product = getProduct(String(id));

  const [color, setColor] = useState<string | undefined>(undefined);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { busy: buying, run: runBuy } = useBusy();
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const selected: Record<string, string> = useMemo(() => {
    const s = { ...picks };
    if (color) s['Color'] = color;
    return s;
  }, [picks, color]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Product not found" hint="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const fav = isFavorite(product.id);
  const available = optionAvailable(product, selected);
  const cap = maxQtyForSelection(product, selected);
  const needsChoice =
    (product.colors?.length ? !color : false) ||
    (product.variants ?? []).some((g) => !picks[g.label]);

  const doAdd = (buyNow: boolean) => {
    if (needsChoice) {
      Alert.alert('Select options', 'Please choose all product options first.');
      return;
    }
    if (!available) {
      Alert.alert('Out of stock', 'This combination is currently out of stock.');
      return;
    }
    // Buy Now never touches the cart: it stages a temporary direct item
    // and opens checkout in direct mode. Guarded against double taps.
    if (buyNow) {
      runBuy(async () => {
        setBuyNowItem({ productId: product.id, qty, selected });
        router.push({ pathname: '/checkout', params: { mode: 'direct' } });
      });
      return;
    }
    const msg = addToCart(product.id, qty, selected);
    if (msg === 'Added to cart.') {
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1500);
      toast(`Added ${product.name} to cart`);
    } else {
      Alert.alert('Cart', msg);
    }
  };

  const specEntries = Object.entries(product.specs ?? {});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.topTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <Press onPress={() => toggleFavorite(product.id)} accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'} style={styles.iconBtn}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={24} color={fav ? COLORS.pinkDark : COLORS.ink} />
        </Press>
      </View>
      <ScrollView contentContainerStyle={[styles.container, wide && styles.wideContainer]}>
        <View style={[styles.layout, wide && styles.layoutWide]}>
          <View style={[styles.imgBox, wide && styles.imgBoxWide]}>
            <ProductImage uri={product.image} rounded={24} iconSize={64} contain />
          </View>
          <View style={styles.info}>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.metaRow}>
              <Rating value={product.rating} size={16} />
              <Text style={[styles.stock, !available && styles.oos]}>
                {available ? `In Stock (${cap} left)` : 'Out of Stock'}
              </Text>
            </View>
            <Text style={styles.price}>{peso(product.price)}</Text>

            {product.colors && product.colors.length > 0 && (
              <View style={styles.optBlock}>
                <Text style={styles.optLabel}>Color</Text>
                <View style={styles.optWrap}>
                  {product.colors.map((c) => (
                    <Press
                      key={c}
                      onPress={() => setColor(c)}
                      style={[styles.opt, color === c && styles.optActive]}>
                      <Text style={[styles.optText, color === c && styles.optTextActive]}>{c}</Text>
                    </Press>
                  ))}
                </View>
              </View>
            )}

            {(product.variants ?? []).map((g) => (
              <View key={g.id} style={styles.optBlock}>
                <Text style={styles.optLabel}>{g.label}</Text>
                <View style={styles.optWrap}>
                  {g.options.map((o) => {
                    const active = picks[g.label] === o.name;
                    const disabled = o.stock <= 0;
                    return (
                      <Press
                        key={o.name}
                        disabled={disabled}
                        onPress={() => setPicks((p) => ({ ...p, [g.label]: o.name }))}
                        style={[styles.opt, active && styles.optActive, disabled && styles.optDisabled]}>
                        <Text style={[styles.optText, active && styles.optTextActive]}>
                          {o.name}
                          {disabled ? ' (0)' : ''}
                        </Text>
                      </Press>
                    );
                  })}
                </View>
              </View>
            ))}

            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.desc}>{product.description}</Text>

            {specEntries.length > 0 && (
              <>
                <Text style={styles.descTitle}>Specifications</Text>
                <View style={styles.specs}>
                  {specEntries.map(([k, v]) => (
                    <View key={k} style={styles.specRow}>
                      <Text style={styles.specK}>{k}</Text>
                      <Text style={styles.specV}>{v}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.buyRow}>
              <QtyStepper
                qty={qty}
                max={Math.max(cap, 1)}
                onChange={(d) => setQty((q) => Math.min(Math.max(1, q + d), Math.max(cap, 1)))}
              />
              <Text style={styles.capText}>Max {Math.max(cap, 0)} available</Text>
            </View>
            <View style={[styles.actions, wide && styles.actionsWide]}>
              <Press
                onPress={() => doAdd(false)}
                disabled={!available}
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                style={[styles.addBtn, !available && styles.disabled]}>
                <Text style={styles.addText}>{added ? '✓ Added to Cart' : 'Add to Cart'}</Text>
              </Press>
              <Press
                onPress={() => doAdd(true)}
                disabled={!available || buying}
                accessibilityRole="button"
                accessibilityLabel={`Buy ${product.name} now`}
                style={[styles.buyBtn, (!available || buying) && styles.disabled]}>
                <Text style={styles.buyText}>{buying ? 'Processing...' : 'Buy Now'}</Text>
              </Press>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  topTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.ink },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 32 },
  wideContainer: { maxWidth: 1000, alignSelf: 'center', width: '100%' },
  layout: { gap: 16 },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  imgBox: {
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 550,
  },
  imgBoxWide: { flex: 1, maxHeight: 450 },
  info: { flex: 1, minWidth: 0 },
  brand: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  stock: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  oos: { color: COLORS.danger },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.ink, marginTop: 8 },
  optBlock: { marginTop: 14 },
  optLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  optWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optActive: { backgroundColor: COLORS.pink },
  optDisabled: { opacity: 0.45 },
  optText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  optTextActive: { fontWeight: '800' },
  descTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginTop: 16 },
  desc: { fontSize: 14, color: COLORS.ink, lineHeight: 20, marginTop: 6 },
  specs: { marginTop: 8, borderRadius: 16, backgroundColor: COLORS.page, overflow: 'hidden' },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  specK: { fontSize: 13, fontWeight: '600', color: COLORS.muted, flex: 1 },
  specV: { fontSize: 13, fontWeight: '700', color: COLORS.ink, flex: 1, textAlign: 'right' },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  capText: { fontSize: 12, color: COLORS.muted },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionsWide: { maxWidth: 480 },
  addBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addText: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  buyBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buyText: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  disabled: { opacity: 0.5 },
});
