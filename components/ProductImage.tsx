import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ProductImage({
  uri,
  rounded = 16,
  iconSize = 40,
  contain = false,
}: {
  uri?: string;
  rounded?: number;
  iconSize?: number;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.fallback, { borderRadius: rounded }]}>
        <Ionicons name="phone-portrait-outline" size={iconSize} color="#8AA8C2" />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.img, { borderRadius: rounded }]}
      resizeMode={contain ? 'contain' : 'cover'}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
