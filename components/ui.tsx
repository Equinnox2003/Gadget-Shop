import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Press } from '@/components/Press';

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Press>
  );
}

export function Rating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.rating}>
      <Ionicons name="star" size={size} color={COLORS.star} />
      <Text style={styles.ratingText}>{value.toFixed(1)}</Text>
    </View>
  );
}

export function QtyStepper({
  qty,
  onChange,
  small,
  min = 1,
  max,
}: {
  qty: number;
  onChange: (delta: number) => void;
  small?: boolean;
  min?: number;
  max?: number;
}) {
  const s = small ? 28 : 32;
  const decDisabled = qty <= min;
  const incDisabled = max !== undefined && qty >= max;
  return (
    <View style={styles.stepper}>
      <Press
        onPress={() => onChange(-1)}
        disabled={decDisabled}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        style={[styles.stepBtn, { width: s, height: s }, decDisabled && styles.stepDisabled]}>
        <Ionicons name="remove" size={16} color={COLORS.ink} />
      </Press>
      <Text style={styles.qty}>{qty}</Text>
      <Press
        onPress={() => onChange(1)}
        disabled={incDisabled}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        style={[styles.stepBtn, { width: s, height: s }, incDisabled && styles.stepDisabled]}>
        <Ionicons name="add" size={16} color={COLORS.ink} />
      </Press>
    </View>
  );
}

export function EmptyState({
  icon = 'search-outline',
  title,
  hint,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color="#8AA8C2" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!hint && <Text style={styles.emptyHint}>{hint}</Text>}
    </View>
  );
}

export function BarRow({
  label,
  value,
  max,
  color = COLORS.pink,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  sub?: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.barValue}>{sub ?? String(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const inactive = disabled || loading;
  return (
    <Press
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.primary, inactive && styles.disabled, style]}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.ink} />
          <Text style={styles.primaryText}>{label}</Text>
        </View>
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Press>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.pinkDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIdle: { backgroundColor: COLORS.blue },
  chipActive: { backgroundColor: COLORS.pink },
  chipText: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  chipTextActive: { fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.4 },
  qty: { fontSize: 15, fontWeight: '700', color: COLORS.ink, minWidth: 20, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  emptyHint: { fontSize: 14, color: COLORS.muted, marginTop: 6, textAlign: 'center' },
  barRow: { marginBottom: 12 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  barLabel: { fontSize: 13, fontWeight: '600', color: COLORS.ink, flex: 1 },
  barValue: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  track: { height: 10, borderRadius: 5, backgroundColor: '#EDF1F5', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  primary: {
    backgroundColor: COLORS.pink,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabled: { opacity: 0.5 },
  primaryText: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
});
