import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export function DatabaseStatus({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      {error ? <>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Unable to open inventory</Text>
        <Text style={{ textAlign: 'center', color: '#555' }}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={{ backgroundColor: '#0E2A35', padding: 14, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Retry</Text>
        </Pressable>
      </> : <>
        <ActivityIndicator size="large" />
        <Text>Opening your saved inventory...</Text>
      </>}
    </View>
  );
}
