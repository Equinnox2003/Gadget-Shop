import { Alert, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { cartKey, maxQtyForSelection, useStore } from '@/store/StoreContext';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, PrimaryButton, QtyStepper } from '@/components/ui';
import { toast } from '@/components/Toast';

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const { cart, getProduct, updateQty, removeFromCart, clearCart, cartSubtotal, settings } = useStore();

  const deliveryFee = cart.length === 0 ? 0 : settings.deliveryFee;
  const discount = Math.min(settings.defaultDiscount, cartSubtotal);
  const total = Math.max(cartSubtotal - discount + deliveryFee, 0);

  const confirmRemove = (key: string, name: string) => {
    Alert.alert('Remove item', `Remove ${name} from your cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFromCart(key);
          toast(`Removed ${name} from cart`);
        },
      },
    ]);
  };

  const confirmClear = () => {
    Alert.alert('Clear cart', 'Are you sure you want to clear your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearCart();
          toast('Cart cleared');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Cart</Text>
        {cart.length > 0 && (
          <Press onPress={confirmClear}>
            <Text style={styles.clear}>Clear</Text>
          </Press>
        )}
      </View>
      {cart.length === 0 ? (
        <EmptyState
          icon="bag-outline"
          title="Your cart is empty"
          hint="Browse products and tap + to add them here."
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
          {cart.map((item) => {
            const p = getProduct(item.productId);
            if (!p) return null;
            const key = cartKey(item);
            const opts = Object.entries(item.selected);
            return (
              <View key={key} style={styles.row}>
                <Press
                  onPress={() => router.push(`/product/${p.id}`)}
                  style={styles.imgBox}>
                  <ProductImage uri={p.image} rounded={12} iconSize={24} />
                </Press>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {opts.length > 0 && (
                    <Text style={styles.opts} numberOfLines={2}>
                      {opts.map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </Text>
                  )}
                  <Text style={styles.price}>{peso(p.price)}</Text>
                  <View style={styles.qtyRow}>
                    <QtyStepper
                      small
                      qty={item.qty}
                      max={Math.max(maxQtyForSelection(p, item.selected), 1)}
                      onChange={(d) => updateQty(key, d)}
                    />
                    <Press
                      onPress={() => confirmRemove(key, p.name)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${p.name} from cart`}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </Press>
                  </View>
                </View>
                <Text style={styles.lineTotal}>{peso(p.price * item.qty)}</Text>
              </View>
            );
          })}

          <View style={styles.summary}>
            <View style={styles.sumRow}>
              <Text style={styles.sumK}>Subtotal</Text>
              <Text style={styles.sumV}>{peso(cartSubtotal)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumK}>Delivery Fee</Text>
              <Text style={styles.sumV}>{peso(deliveryFee)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumK}>Discount</Text>
              <Text style={styles.sumV}>-{peso(discount)}</Text>
            </View>
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalK}>Total</Text>
              <Text style={styles.totalV}>{peso(total)}</Text>
            </View>
          </View>

          <PrimaryButton
            label="Checkout"
            onPress={() => router.push('/checkout')}
            style={webWide ? styles.webBtn : undefined}
          />
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
  title: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
  clear: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  container: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  webContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  imgBox: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  info: { flex: 1, gap: 4, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  opts: { fontSize: 12, color: COLORS.muted },
  price: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  lineTotal: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  summary: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: COLORS.page,
    padding: 16,
    gap: 8,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumK: { fontSize: 14, color: COLORS.muted },
  sumV: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  totalK: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  totalV: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  webBtn: { maxWidth: 320, alignSelf: 'center', width: '100%' },
});

