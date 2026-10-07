import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useStore } from '@/store/StoreContext';
import { PrimaryButton } from '@/components/ui';
import { useBusy } from '@/hooks/useBusy';
import { toast } from '@/components/Toast';

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webNarrow = Platform.OS === 'web' && width >= 700;
  const { settings, updateSettings, resetDemo } = useStore();

  const [name, setName] = useState(settings.displayName);
  const [fee, setFee] = useState(String(settings.deliveryFee));
  const [discount, setDiscount] = useState(String(settings.defaultDiscount));

  const save = () => {
    const feeNum = Number(fee);
    const discNum = Number(discount);
    if (!Number.isFinite(feeNum) || feeNum < 0)
      return Alert.alert('Validation', 'Delivery fee must be non-negative.');
    if (!Number.isFinite(discNum) || discNum < 0)
      return Alert.alert('Validation', 'Default discount must be non-negative.');
    updateSettings({
      displayName: name.trim() || 'Howard',
      deliveryFee: Math.round(feeNum),
      defaultDiscount: Math.round(discNum * 100) / 100,
    });
    toast('Settings saved');
  };
  const { busy: saving, run: runSave } = useBusy();

  const confirmReset = () => {
    Alert.alert('Reset Demo Data', 'Restore seed products and clear cart/orders?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetDemo();
          toast('Demo data restored');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, webNarrow && styles.web]}>
        <Row
          label="Connection Status"
          sub={settings.online ? 'Online (simulated)' : 'Offline (simulated)'}
          right={
            <Switch
              value={settings.online}
              onValueChange={(v) => updateSettings({ online: v })}
              trackColor={{ true: COLORS.pink }}
            />
          }
        />
        <Text style={styles.label}>Display Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Display name" />

        <Text style={styles.label}>Delivery Fee (₱)</Text>
        <TextInput
          value={fee}
          onChangeText={(t) => setFee(t.replace(/[^0-9]/g, ''))}
          style={styles.input}
          keyboardType="number-pad"
        />

        <Row label="Currency" sub="Philippine Peso (₱) — fixed" />
        <Text style={styles.label}>Default Discount (₱)</Text>
        <TextInput
          value={discount}
          onChangeText={(t) => setDiscount(t.replace(/[^0-9.]/g, ''))}
          style={styles.input}
          keyboardType="decimal-pad"
        />

        <Row
          label="Notifications"
          sub={settings.notifications ? 'Enabled' : 'Disabled'}
          right={
            <Switch
              value={settings.notifications}
              onValueChange={(v) => updateSettings({ notifications: v })}
              trackColor={{ true: COLORS.pink }}
            />
          }
        />

        <PrimaryButton
          label={saving ? 'Saving...' : 'Save Settings'}
          loading={saving}
          onPress={() => runSave(async () => save())}
        />
        <Press onPress={confirmReset} style={styles.reset}>
          <Text style={styles.resetText}>Reset Demo Data</Text>
        </Press>
        <Text style={styles.note}>
          Local/demo behavior only. Data persists on this device via local storage; web and phone
          storage are separate and do not auto-sync.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  sub,
  right,
}: {
  label: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right}
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
  web: { maxWidth: 560, alignSelf: 'center', width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    marginTop: 10,
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  rowSub: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 6,
  },
  reset: {
    marginTop: 16,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  resetText: { fontSize: 15, fontWeight: '800', color: COLORS.danger },
  note: { fontSize: 12, color: COLORS.faint, textAlign: 'center', marginTop: 12 },
});

