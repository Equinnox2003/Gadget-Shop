import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from '@/constants/theme';
import { peso } from '@/utils/format';
import { computePoints, formatShortPeso, yTicks, type TimeBucket } from '@/utils/chart';

const PAD = { left: 56, right: 14, top: 14, bottom: 30 };
const HEIGHT = 240;

export function SalesLineChart({ data }: { data: TimeBucket[] }) {
  const [w, setW] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View style={[styles.box, { minHeight: HEIGHT }]}>
        <Text style={styles.empty}>No sales data for this period.</Text>
      </View>
    );
  }

  const width = Math.max(w, 200);
  const values = data.map((d) => d.value);
  const { points } = computePoints(values, width, HEIGHT, PAD);
  const ticks = yTicks(Math.max(...values));
  const top = ticks[ticks.length - 1];
  const yOf = (t: number) =>
    PAD.top + (HEIGHT - PAD.top - PAD.bottom) - ((HEIGHT - PAD.top - PAD.bottom) * t) / top;

  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${PAD.left},${(HEIGHT - PAD.bottom).toFixed(1)} ${line} ${(
    width - PAD.right
  ).toFixed(1)},${(HEIGHT - PAD.bottom).toFixed(1)}`;

  const every = Math.max(1, Math.ceil(data.length / 6));
  const sel = selected !== null ? data[selected] : null;

  return (
    <View
      style={styles.box}
      onLayout={(e) => {
        const next = Math.floor(e.nativeEvent.layout.width);
        if (next !== w) {
          setW(next);
          setSelected(null);
        }
      }}>
      <Svg width={width} height={HEIGHT}>
        {ticks.map((t) => (
          <Line
            key={t}
            x1={PAD.left}
            x2={width - PAD.right}
            y1={yOf(t)}
            y2={yOf(t)}
            stroke="#E5EAF0"
            strokeWidth={1}
          />
        ))}
        <Line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={HEIGHT - PAD.bottom}
          stroke="#CBD3DC"
          strokeWidth={1}
        />
        {ticks.map((t) => (
          <SvgText
            key={`l${t}`}
            x={PAD.left - 6}
            y={yOf(t) + 4}
            fontSize={11}
            fill={COLORS.muted}
            textAnchor="end">
            {formatShortPeso(t)}
          </SvgText>
        ))}
        {data.length > 1 && (
          <Polygon points={area} fill={COLORS.primary} opacity={0.12} />
        )}
        {data.length > 1 && (
          <Polyline points={line} fill="none" stroke={COLORS.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {data.map((d, i) => (
          <Circle
            key={`${d.key}-${i}`}
            cx={points[i].x}
            cy={points[i].y}
            r={selected === i ? 6 : 4}
            fill="#FFFFFF"
            stroke={COLORS.primaryDark}
            strokeWidth={2.5}
            onPress={() => setSelected(selected === i ? null : i)}
          />
        ))}
        {data.map((d, i) =>
          i % every === 0 || i === data.length - 1 ? (
            <SvgText
              key={`x${d.key}-${i}`}
              x={Math.min(Math.max(points[i].x, PAD.left + 18), width - PAD.right - 18)}
              y={HEIGHT - 10}
              fontSize={11}
              fill={COLORS.muted}
              textAnchor="middle">
              {d.label}
            </SvgText>
          ) : null
        )}
        {sel && selected !== null && (
          <Tip
            x={Math.min(Math.max(points[selected].x, 86), width - 86)}
            y={Math.max(points[selected].y - 8, 44)}
            label={sel.label}
            value={peso(sel.value)}
          />
        )}
      </Svg>
      <Text style={styles.hint}>Tap a point to see exact sales.</Text>
    </View>
  );
}

function Tip({ x, y, label, value }: { x: number; y: number; label: string; value: string }) {
  return (
    <>
      <Rect x={x - 74} y={y - 34} width={148} height={40} rx={10} fill={COLORS.ink} />
      <SvgText x={x} y={y - 18} fontSize={11} fill="#FFFFFF" textAnchor="middle" fontWeight="700">
        {label}
      </SvgText>
      <SvgText x={x} y={y - 4} fontSize={12} fill={COLORS.primary} textAnchor="middle" fontWeight="800">
        {value}
      </SvgText>
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  empty: { fontSize: 14, color: COLORS.muted, textAlign: 'center', paddingVertical: 96 },
  hint: { fontSize: 11, color: COLORS.faint, textAlign: 'center', paddingBottom: 6 },
});
