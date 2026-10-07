import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { StoreProvider } from '@/store/StoreContext';
import { ToastHost } from '@/components/Toast';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.accent } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="filter" options={{ presentation: 'modal', title: 'Filter' }} />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-success" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="manage/products" />
          <Stack.Screen name="manage/product-form" />
          <Stack.Screen name="manage/inventory" />
          <Stack.Screen name="manage/reports" />
        </Stack>
        <ToastHost />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

