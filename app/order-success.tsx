import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { useStore } from '@/store/StoreContext';
import { PrimaryButton } from '@/components/ui';

export default function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webNarrow = Platform.OS === 'web' && width >= 700;
  const { orders } = useStore();
  const order = orders.find((o) => o.id === String(id)) ?? orders[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, webNarrow && styles.web]}>
        <View style={styles.check}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
        <Text style={styles.title}>Order Successful</Text>
        {order ? (
          <>
            <Text style={styles.orderNo}>Order Number: {order.id}</Text>
            <Text style={styles.total}>Final Total: {peso(order.total)}</Text>
            <Text style={styles.sub}>
              {order.items.reduce((s, i) => s + i.qty, 0)} item(s) · {order.paymentMethod}
            </Text>
          </>
        ) : (
          <Text style={styles.sub}>Thank you for shopping with Gadget Shop.</Text>
        )}
        <PrimaryButton label="Continue Shopping" onPress={() => router.replace('/')} />
        <PrimaryButton
          label="View Orders"
          onPress={() => router.replace('/orders')}
          style={{ backgroundColor: COLORS.blue, marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  web: { maxWidth: 480, alignSelf: 'center', width: '100%' },
  check: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.ink },
  orderNo: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  total: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  sub: { fontSize: 14, color: COLORS.muted, marginBottom: 12 },
});

