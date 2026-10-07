import { useMemo, useState } from 'react';
import {
  Alert,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, DEMO_COUPON, DEMO_COUPON_RATE, PAYMENT_METHODS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { useStore } from '@/store/StoreContext';
import { useBusy } from '@/hooks/useBusy';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, PrimaryButton } from '@/components/ui';

export default function CheckoutScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { width } = useWindowDimensions();
  const webWide = Platform.OS === 'web' && width >= 900;
  const {
    cart,
    getProduct,
    settings,
    placeOrder,
    buyNowItem,
    placeDirectOrder,
  } = useStore();

  // Direct (Buy Now) mode checks out ONLY the staged item; cart mode
  // checks out the cart. The cart is never modified in direct mode.
  const isDirect = mode === 'direct';
  const lines = isDirect ? (buyNowItem ? [buyNowItem] : []) : cart;
  const linesSubtotal = lines.reduce((s, i) => {
    const p = getProduct(i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const [name, setName] = useState(settings.displayName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0]);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const { busy: placing, run: runPlace } = useBusy();

  const deliveryFee = lines.length === 0 ? 0 : settings.deliveryFee;
  const couponDiscount = useMemo(
    () => (couponApplied ? Math.round(linesSubtotal * DEMO_COUPON_RATE) : 0),
    [couponApplied, linesSubtotal]
  );
  const baseDiscount = Math.min(settings.defaultDiscount, linesSubtotal);
  const discount = Math.min(baseDiscount + couponDiscount, linesSubtotal);
  const total = Math.max(linesSubtotal - discount + deliveryFee, 0);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      Alert.alert('Coupon', 'Please enter a coupon code.');
      return;
    }
    if (couponApplied) {
      Alert.alert('Coupon', 'A coupon has already been applied.');
      return;
    }
    if (code === DEMO_COUPON) {
      setCouponApplied(true);
      setCoupon(code);
      Alert.alert('Coupon applied', 'DISCOUNT20: 20% off your order.');
    } else {
      Alert.alert('Invalid coupon', 'This coupon code is not valid. Try DISCOUNT20.');
    }
  };

  const submit = () => {
    runPlace(async () => {
      const payload = {
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        paymentMethod: payment,
        coupon: couponApplied ? DEMO_COUPON : undefined,
        discount,
        deliveryFee,
      };
      const res = isDirect ? placeDirectOrder(payload) : placeOrder(payload);
      if ('error' in res) {
        Alert.alert('Checkout', res.error);
        return;
      }
      router.replace({ pathname: '/order-success', params: { id: res.id } });
    });
  };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
          </Press>
          <Text style={styles.title}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        {isDirect ? (
          <EmptyState
            icon="flash-outline"
            title="No Buy Now item"
            hint="Go back to a product and press Buy Now."
          />
        ) : (
          <EmptyState icon="bag-outline" title="Nothing to check out" hint="Your cart is empty." />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, webWide && styles.webContainer]}>
        <Text style={styles.section}>
          {isDirect ? 'Buy Now (1 item)' : `Items (${lines.length})`}
        </Text>
        {lines.map((item) => {
          const p = getProduct(item.productId);
          if (!p) return null;
          return (
            <View key={`${item.productId}-${JSON.stringify(item.selected)}`} style={styles.item}>
              <View style={styles.thumb}>
                <ProductImage uri={p.image} rounded={10} iconSize={20} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {p.name} × {item.qty}
                </Text>
                <Text style={styles.itemSub}>{peso(p.price)} each</Text>
              </View>
              <Text style={styles.itemTotal}>{peso(p.price * item.qty)}</Text>
            </View>
          );
        })}

        <Text style={styles.section}>Customer Information</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Customer name" style={styles.input} />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Contact number"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Delivery address"
          multiline
          style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
        />

        <Text style={styles.section}>Payment Method</Text>
        <View style={styles.payWrap}>
          {PAYMENT_METHODS.map((m) => (
            <Press
              key={m}
              onPress={() => setPayment(m)}
              style={[styles.pay, payment === m && styles.payActive]}>
              <Ionicons
                name={payment === m ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={payment === m ? COLORS.pinkDark : COLORS.muted}
              />
              <Text style={styles.payText}>{m}</Text>
            </Press>
          ))}
        </View>

        <Text style={styles.section}>Coupon</Text>
        <View style={styles.couponRow}>
          <TextInput
            value={coupon}
            onChangeText={setCoupon}
            placeholder="Enter coupon (try DISCOUNT20)"
            autoCapitalize="characters"
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
          />
          <Press onPress={applyCoupon} style={styles.couponBtn}>
            <Text style={styles.couponText}>Apply</Text>
          </Press>
        </View>
        {couponApplied && (
          <Text style={styles.couponOk}>DISCOUNT20 applied — 20% off ({peso(couponDiscount)})</Text>
        )}

        <View style={styles.summary}>
          <Row k="Subtotal" v={peso(linesSubtotal)} />
          <Row k="Delivery Fee" v={peso(deliveryFee)} />
          <Row k="Discount" v={`-${peso(discount)}`} />
          <View style={styles.totalRow}>
            <Text style={styles.totalK}>Total</Text>
            <Text style={styles.totalV}>{peso(total)}</Text>
          </View>
        </View>

        <PrimaryButton
          label={placing ? 'Processing...' : 'Complete Order'}
          loading={placing}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumK}>{k}</Text>
      <Text style={styles.sumV}>{v}</Text>
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
  container: { paddingHorizontal: 16, paddingBottom: 32, gap: 4 },
  webContainer: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  section: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginTop: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  itemSub: { fontSize: 12, color: COLORS.muted },
  itemTotal: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  payWrap: { gap: 8, marginTop: 8 },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payActive: { borderColor: COLORS.pink, backgroundColor: COLORS.secondary },
  payText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  couponBtn: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponText: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  couponOk: { fontSize: 13, fontWeight: '700', color: COLORS.success, marginTop: 6 },
  summary: { marginTop: 16, borderRadius: 16, backgroundColor: COLORS.page, padding: 16, gap: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumK: { fontSize: 14, color: COLORS.muted },
  sumV: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  totalK: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  totalV: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
});

