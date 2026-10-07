import { formatDay, peso } from '@/utils/format';
import type { Order } from '@/data/seed';

export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface TimeBucket {
  label: string;
  value: number;
  key: number;
}

/** Group non-cancelled order revenue into chronological buckets. Single data source for the chart. */
export function bucketSales(orders: Order[], range: TimeRange): TimeBucket[] {
  const m = new Map<number, { label: string; value: number }>();
  for (const o of orders) {
    if (o.status === 'Cancelled') continue;
    const d = new Date(o.date);
    let key: number;
    let label: string;
    if (range === 'daily') {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      key = day.getTime();
      label = formatDay(key);
    } else if (range === 'weekly') {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      start.setDate(start.getDate() - start.getDay());
      key = start.getTime();
      label = `Wk ${formatDay(key)}`;
    } else {
      key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      label = new Date(key).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
    }
    const e = m.get(key) ?? { label, value: 0 };
    e.value += o.total;
    m.set(key, e);
  }
  return [...m.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([key, e]) => ({ key, label: e.label, value: e.value }));
}

/** Compact axis labels: ₱0, ₱50K, ₱100K, ₱1.2M. */
export function formatShortPeso(value: number): string {
  if (value >= 1000000) {
    const m = value / 1000000;
    return `₱${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `₱${Number.isInteger(k) ? k : k.toFixed(k >= 100 ? 0 : 1)}K`;
  }
  return peso(value);
}

/** Round the axis ceiling up to a 1/2/2.5/5 × 10^n step. */
export function niceCeil(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = 10 ** exp;
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (max <= m * base) return m * base;
  }
  return 10 * base;
}

export function yTicks(max: number, count = 4): number[] {
  const top = niceCeil(max);
  const out: number[] = [];
  for (let i = 0; i <= count; i++) out.push((top * i) / count);
  return out;
}

export interface ChartPoint {
  x: number;
  y: number;
}

/** Scale bucket values into chart coordinates. Handles single-point and flat data. */
export function computePoints(
  values: number[],
  width: number,
  height: number,
  pad: { left: number; right: number; top: number; bottom: number }
): { points: ChartPoint[]; yMax: number } {
  const max = Math.max(0, ...values);
  const yMax = niceCeil(max);
  const iw = Math.max(width - pad.left - pad.right, 10);
  const ih = Math.max(height - pad.top - pad.bottom, 10);
  const n = values.length;
  const points = values.map((v, i) => ({
    x: pad.left + (n === 1 ? iw / 2 : (iw * i) / (n - 1)),
    y: pad.top + ih - (ih * v) / yMax,
  }));
  return { points, yMax };
}
