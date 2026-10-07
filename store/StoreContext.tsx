import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CartItem,
  DEFAULT_FILTER,
  DEFAULT_SETTINGS,
  FilterState,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  Product,
  SEED_PRODUCTS,
  SEED_RECENT,
  Settings,
} from '@/data/seed';
import { initDatabase, loadProducts, loadValue } from '@/services/db';
import { useCatalogState, useSavedValueState } from '@/services/useDatabaseState';
import { DatabaseStatus } from '@/components/DatabaseStatus';

const DEMO_PRODUCTS = SEED_PRODUCTS.filter((p) => ['p1', 'p6', 'p8', 'p10', 'p12', 'p16'].includes(p.id));

const KEYS = {
  products: 'gadgetshop.products.v1',
  cart: 'gadgetshop.cart.v1',
  favorites: 'gadgetshop.favorites.v1',
  orders: 'gadgetshop.orders.v1',
  recent: 'gadgetshop.recent.v1',
  settings: 'gadgetshop.settings.v1',
};

export function cartKey(item: CartItem): string {
  return `${item.productId}::${JSON.stringify(item.selected)}`;
}

export function optionAvailable(product: Product, selected: Record<string, string>): boolean {
  if (!product.available || product.stock <= 0) return false;
  for (const g of product.variants ?? []) {
    const pick = selected[g.label];
    if (!pick) continue;
    const opt = g.options.find((o) => o.name === pick);
    if (!opt || opt.stock <= 0) return false;
  }
  return true;
}

export function maxQtyForSelection(product: Product, selected: Record<string, string>): number {
  let cap = product.stock;
  for (const g of product.variants ?? []) {
    const pick = selected[g.label];
    if (!pick) continue;
    const opt = g.options.find((o) => o.name === pick);
    if (opt) cap = Math.min(cap, opt.stock);
  }
  return Math.max(cap, 0);
}

interface PlaceOrderInput {
  customer: { name: string; phone: string; address: string };
  paymentMethod: string;
  coupon?: string;
  discount: number;
  deliveryFee: number;
}

interface StoreValue {
  hydrated: boolean;
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  orders: Order[];
  recentSearches: string[];
  settings: Settings;
  filter: FilterState;
  setFilter: (f: FilterState) => void;
  getProduct: (id: string) => Product | undefined;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, qty?: number, selected?: Record<string, string>) => string;
  updateQty: (key: string, delta: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  pushRecent: (term: string) => void;
  clearRecent: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  setStock: (id: string, value: number) => void;
  setAvailability: (id: string, available: boolean) => void;
  adjustVariantStock: (productId: string, groupId: string, optionName: string, delta: number) => void;
  placeOrder: (input: PlaceOrderInput) => Order | { error: string };
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  placeDirectOrder: (input: PlaceOrderInput) => Order | { error: string };
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn('Failed to load stored Gadget Shop data; using defaults.');
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts, hydrateProducts] = useCatalogState<Product>();
  const [cart, setCart, hydrateCart] = useSavedValueState<CartItem[]>('cart', []);
  const [favorites, setFavorites, hydrateFavorites] = useSavedValueState<string[]>('favorites', []);
  const [orders, setOrders, hydrateOrders] = useSavedValueState<Order[]>('orders', []);
  const [recentSearches, setRecentSearches, hydrateRecent] = useSavedValueState<string[]>('recent', SEED_RECENT);
  const [settings, setSettings, hydrateSettings] = useSavedValueState<Settings>('settings', DEFAULT_SETTINGS);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  // Temporary Buy Now item: never persisted, never touches cart state.
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [startupError, setStartupError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStartupError('');
    (async () => {
      try {
      const [p, c, f, o, r, s] = await Promise.all([
        load<Product[]>(KEYS.products, DEMO_PRODUCTS),
        load<CartItem[]>(KEYS.cart, []),
        load<string[]>(KEYS.favorites, []),
        load<Order[]>(KEYS.orders, []),
        load<string[] | null>(KEYS.recent, null),
        load<Settings>(KEYS.settings, DEFAULT_SETTINGS),
      ]);
      await initDatabase(Array.isArray(p) ? p : DEMO_PRODUCTS, {
        cart: Array.isArray(c) ? c : [], favorites: Array.isArray(f) ? f : [],
        orders: Array.isArray(o) ? o : [], recent: Array.isArray(r) ? r : SEED_RECENT,
        settings: { ...DEFAULT_SETTINGS, ...(s ?? {}) },
      });
      if (!active) return;
      hydrateProducts(loadProducts<Product>());
      hydrateCart(loadValue('cart', []));
      hydrateFavorites(loadValue('favorites', []));
      hydrateOrders(loadValue('orders', []));
      hydrateRecent(loadValue('recent', SEED_RECENT));
      hydrateSettings(loadValue('settings', DEFAULT_SETTINGS));
      setHydrated(true);
      } catch (error) {
        if (active) setStartupError(error instanceof Error ? error.message : 'Please restart the app and try again.');
      }
    })();
    return () => { active = false; };
  }, [hydrateProducts, hydrateCart, hydrateFavorites, hydrateOrders, hydrateRecent, hydrateSettings, attempt]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((s, i) => {
        const p = productMap.get(i.productId);
        return s + (p ? p.price * i.qty : 0);
      }, 0),
    [cart, productMap]
  );

  const addToCart = useCallback(
    (productId: string, qty = 1, selected: Record<string, string> = {}) => {
      const p = productMap.get(productId);
      if (!p) return 'Product not found.';
      if (!optionAvailable(p, selected)) return 'This item is out of stock.';
      const key = cartKey({ productId, qty: 0, selected });
      let message = 'Added to cart.';
      setCart((prev) => {
        const idx = prev.findIndex((i) => cartKey(i) === key);
        const cap = maxQtyForSelection(p, selected);
        if (idx >= 0) {
          const next = [...prev];
          const newQty = Math.min(next[idx].qty + qty, cap);
          if (newQty <= 0) return prev;
          next[idx] = { ...next[idx], qty: newQty };
          if (next[idx].qty >= cap && qty > 0) message = 'Only limited stock available.';
          return next;
        }
        return [...prev, { productId, qty: Math.min(qty, cap), selected }];
      });
      return message;
    },
    [productMap, setCart]
  );

  const updateQty = useCallback(
    (key: string, delta: number) => {
      setCart((prev) =>
        prev.map((i) => {
          if (cartKey(i) !== key) return i;
          const p = productMap.get(i.productId);
          const cap = p ? maxQtyForSelection(p, i.selected) : i.qty + delta;
          // Clamp to [1, cap]: "-" never drops below 1 (trash removes items).
          const q = Math.min(Math.max(i.qty + delta, 1), Math.max(cap, 1));
          return { ...i, qty: q };
        })
      );
    },
    [productMap, setCart]
  );

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => cartKey(i) !== key));
  }, [setCart]);

  const clearCart = useCallback(() => setCart([]), [setCart]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, [setFavorites]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const pushRecent = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecentSearches((prev) => [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8));
  }, [setRecentSearches]);

  const clearRecent = useCallback(() => setRecentSearches([]), [setRecentSearches]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, [setSettings]);

  const upsertProduct = useCallback((p: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      const normalized = {
        ...p,
        available: p.available && p.stock > 0 ? p.available : p.stock > 0 ? p.available : false,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      return [...prev, normalized];
    });
    setFavorites((prev) => prev.filter((id) => id !== '__noop__'));
  }, [setFavorites, setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((i) => i.productId !== id));
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, [setCart, setFavorites, setProducts]);

  const adjustStock = useCallback((id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stock = Math.max(0, Math.round(p.stock + delta));
        return { ...p, stock, available: stock === 0 ? false : p.available };
      })
    );
  }, [setProducts]);

  const setStock = useCallback((id: string, value: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stock = Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
        return { ...p, stock, available: stock === 0 ? false : p.available };
      })
    );
  }, [setProducts]);

  const setAvailability = useCallback((id: string, available: boolean) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (available && p.stock <= 0) return p;
        return { ...p, available };
      })
    );
  }, [setProducts]);

  const adjustVariantStock = useCallback(
    (productId: string, groupId: string, optionName: string, delta: number) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const variants = (p.variants ?? []).map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              options: g.options.map((o) =>
                o.name === optionName
                  ? { ...o, stock: Math.max(0, Math.round(o.stock + delta)) }
                  : o
              ),
            };
          });
          return { ...p, variants };
        })
      );
    },
    [setProducts]
  );

  // Shared order pipeline for cart lines. Validates, snapshots, decrements
  // exact variant stock, and records the order. Does NOT clear the cart —
  // callers decide what to clear.
  const finalizeLines = useCallback(
    (
      lines: CartItem[],
      input: PlaceOrderInput,
      emptyMessage: string
    ): Order | { error: string } => {
      if (!input.customer.name.trim()) return { error: 'Please enter the customer name.' };
      if (!input.customer.phone.trim()) return { error: 'Please enter a contact number.' };
      if (!input.customer.address.trim()) return { error: 'Please enter a delivery address.' };
      if (lines.length === 0) return { error: emptyMessage };

      for (const item of lines) {
        const p = productMap.get(item.productId);
        if (!p) return { error: 'A product in your order is no longer available.' };
        if (!optionAvailable(p, item.selected))
          return { error: `${p.name} is out of stock for the selected options.` };
        const cap = maxQtyForSelection(p, item.selected);
        if (item.qty > cap) return { error: `Only ${cap} left for ${p.name}.` };
      }

      const items: OrderItemSnapshot[] = lines.map((item) => {
        const p = productMap.get(item.productId)!;
        return {
          productId: p.id,
          name: p.name,
          brand: p.brand,
          image: p.image,
          price: p.price,
          qty: item.qty,
          selected: item.selected,
          category: p.category,
        };
      });
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const discount = Math.min(Math.max(input.discount, 0), subtotal);
      const total = Math.max(subtotal - discount + input.deliveryFee, 0);
      const order: Order = {
        id: `GS-${Date.now().toString().slice(-8)}`,
        date: Date.now(),
        items,
        subtotal,
        deliveryFee: input.deliveryFee,
        discount,
        total,
        paymentMethod: input.paymentMethod,
        status: 'Pending',
        customer: input.customer,
        coupon: input.coupon,
      };

      setProducts((prev) =>
        prev.map((p) => {
          const owned = lines.filter((c) => c.productId === p.id);
          if (!owned.length) return p;
          const dec = owned.reduce((s, l) => s + l.qty, 0);
          let variants = p.variants;
          if (variants) {
            variants = variants.map((g) => ({
              ...g,
              options: g.options.map((o) => {
                const used = owned
                  .filter((l) => l.selected[g.label] === o.name)
                  .reduce((s, l) => s + l.qty, 0);
                return { ...o, stock: Math.max(0, o.stock - used) };
              }),
            }));
          }
          const stock = Math.max(0, p.stock - dec);
          return { ...p, stock, variants, available: stock === 0 ? false : p.available };
        })
      );
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    [productMap, setOrders, setProducts]
  );

  const placeOrder = useCallback(
    (input: PlaceOrderInput): Order | { error: string } => {
      const res = finalizeLines(cart, input, 'Your cart is empty.');
      if (!('error' in res)) setCart([]);
      return res;
    },
    [cart, finalizeLines, setCart]
  );

  const placeDirectOrder = useCallback(
    (input: PlaceOrderInput): Order | { error: string } => {
      if (!buyNowItem) return { error: 'No Buy Now item. Please go back and press Buy Now.' };
      const res = finalizeLines([buyNowItem], input, 'No Buy Now item to purchase.');
      // Clear only the temporary Buy Now item — cart stays untouched.
      if (!('error' in res)) setBuyNowItem(null);
      return res;
    },
    [buyNowItem, finalizeLines]
  );

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, [setOrders]);

  const resetDemo = useCallback(() => {
    setProducts(DEMO_PRODUCTS);
    setCart([]);
    setFavorites([]);
    setBuyNowItem(null);
    setOrders([]);
    setRecentSearches(SEED_RECENT);
    setSettings(DEFAULT_SETTINGS);
    setFilter(DEFAULT_FILTER);
  }, [setCart, setFavorites, setOrders, setProducts, setRecentSearches, setSettings]);

  const value: StoreValue = {
    hydrated,
    products,
    cart,
    favorites,
    orders,
    recentSearches,
    settings,
    filter,
    setFilter,
    getProduct,
    cartCount,
    cartSubtotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    toggleFavorite,
    isFavorite,
    pushRecent,
    clearRecent,
    updateSettings,
    upsertProduct,
    deleteProduct,
    adjustStock,
    setStock,
    setAvailability,
    adjustVariantStock,
    placeOrder,
    buyNowItem,
    setBuyNowItem,
    placeDirectOrder,
    updateOrderStatus,
    resetDemo,
  };

  if (!hydrated) return <DatabaseStatus error={startupError} onRetry={() => setAttempt((a) => a + 1)} />;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function applyFilter(
  products: Product[],
  f: FilterState
): Product[] {
  const q = f.query.trim().toLowerCase();
  const min = f.minPrice === '' ? NaN : Number(f.minPrice);
  const max = f.maxPrice === '' ? NaN : Number(f.maxPrice);
  let list = products.filter((p) => {
    if (f.category !== 'All' && p.category !== f.category) return false;
    if (f.tag !== 'All' && p.tag !== f.tag) return false;
    if (q) {
      const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (Number.isFinite(min) && p.price < (min as number)) return false;
    if (Number.isFinite(max) && p.price > (max as number)) return false;
    return true;
  });
  switch (f.sort) {
    case 'low':
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case 'high':
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      list = [...list].sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      list = [...list].sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'review':
      list = [...list].sort((a, b) => b.rating - a.rating);
      break;
    default:
      list = [...list].sort((a, b) => b.popularity - a.popularity);
  }
  return list;
}
