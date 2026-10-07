import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';

type Listener = (message: string) => void;

const listeners = new Set<Listener>();
let currentId = 0;

/** Show a lightweight toast. One system for the whole app. */
export function toast(message: string) {
  for (const l of listeners) {
    try {
      l(message);
    } catch (e) {
      console.warn('toast listener failed', e);
    }
  }
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);

  useEffect(() => {
    const onToast = (message: string) => {
      const id = ++currentId;
      setItems((prev) => [...prev.slice(-2), { id, message }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 1800);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <View style={styles.host} pointerEvents="none">
      {items.map((i) => (
        <View key={i.id} style={styles.toast}>
          <Text style={styles.text}>{i.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toast: {
    backgroundColor: COLORS.ink,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
