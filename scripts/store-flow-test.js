// COMPLETE FUNCTIONAL TEST of cart + checkout flows using the REAL store code.
// Runs StoreProvider in react-test-renderer; stubs only AsyncStorage + '@/...' paths.
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, '.tmp-check');

const mem = {};
const asyncStorageStub = {
  getItem: async (k) => (k in mem ? mem[k] : null),
  setItem: async (k, v) => { mem[k] = String(v); },
  multiSet: async (pairs) => { for (const [k, v] of pairs) mem[k] = String(v); },
  multiGet: async (keys) => keys.map((k) => [k, k in mem ? mem[k] : null]),
};

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@react-native-async-storage/async-storage') return asyncStorageStub;
  if (request === 'react-native') return {};
  if (request.startsWith('@/')) {
    return origLoad.call(this, path.join(TMP, request.slice(2)), parent, isMain);
  }
  return origLoad.call(this, request, parent, isMain);
};

const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;
const { StoreProvider, useStore } = require(path.join(TMP, 'store', 'StoreContext.js'));

let ctx = null;
function Probe() {
  const value = useStore();
  React.useLayoutEffect(() => { ctx = value; });
  return null;
}
act(() => {
  TestRenderer.create(React.createElement(StoreProvider, null, React.createElement(Probe)));
});
const s = () => {
  if (!ctx) throw new Error('store context not captured');
  return ctx;
};
const fire = (fn) => {
  let out;
  act(() => { out = fn(s()); });
  return out;
};

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
}

try {
  check('catalog loads 18 products', s().products.length === 18, `got ${s().products.length}`);
  check('7 categories present', new Set(s().products.map((p) => p.category)).size === 7);
  check('all products have unique id/name/price/image/category',
    s().products.every((p) => p.id && p.name && p.price >= 0 && p.image && p.category) &&
    new Set(s().products.map((p) => p.id)).size === s().products.length);

  // ---------- FLOW A: Add to Cart ----------
  fire((st) => st.addToCart('p2', 1, { Color: 'White' })); // JBL Tune 720BT
  check('add JBL once -> count 1', s().cartCount === 1, `count=${s().cartCount}`);
  fire((st) => st.addToCart('p2', 1, { Color: 'White' }));
  check('add JBL again -> qty merges, no dup line', s().cart.length === 1 && s().cart[0].qty === 2, JSON.stringify(s().cart));
  fire((st) => st.addToCart('p12', 1, { RAM: '16GB RAM' })); // ASUS ROG
  check('add ASUS different product -> 2 lines', s().cart.length === 2);
  check('cart subtotal = 4299*2 + 89999', s().cartSubtotal === 4299 * 2 + 89999, `got ${s().cartSubtotal}`);

  const keyA = `${s().cart[0].productId}::${JSON.stringify(s().cart[0].selected)}`;
  fire((st) => st.updateQty(keyA, 1));
  check('increase qty -> 3', s().cart[0].qty === 3);
  fire((st) => st.updateQty(keyA, -2));
  check('decrease qty -> 1', s().cart[0].qty === 1);
  const keyB = `${s().cart[1].productId}::${JSON.stringify(s().cart[1].selected)}`;
  fire((st) => st.removeFromCart(keyB));
  check('remove ASUS -> 1 line left', s().cart.length === 1 && s().cart[0].productId === 'p2');
  fire((st) => st.addToCart('p12', 1, { RAM: '16GB RAM' }));

  // ---------- FLOW B: Buy Now must NOT touch cart ----------
  const cartBefore = JSON.stringify(s().cart);
  const countBefore = s().cartCount;
  fire((st) => st.setBuyNowItem({ productId: 'p2', qty: 1, selected: { Color: 'Black' } }));
  check('buyNowItem staged, cart untouched',
    !!s().buyNowItem && s().buyNowItem.productId === 'p2' && JSON.stringify(s().cart) === cartBefore);
  check('cart count unchanged by Buy Now staging', s().cartCount === countBefore);
  const jblBefore = s().getProduct('p2').stock;
  const res = fire((st) => st.placeDirectOrder({
    customer: { name: 'Howard', phone: '0917', address: 'Manila' },
    paymentMethod: 'GCash',
    coupon: undefined,
    discount: 0,
    deliveryFee: 149,
  }));
  check('direct order succeeds', !(res && res.error), JSON.stringify(res).slice(0, 160));
  check('direct order contains ONLY JBL', res.items.length === 1 && res.items[0].name.includes('JBL'),
    JSON.stringify(res.items.map((i) => i.name)));
  check('direct snapshot keeps price/image/variant',
    res.items[0].price === 4299 && !!res.items[0].image && res.items[0].selected.Color === 'Black');
  check('cart STILL intact after Buy Now purchase', s().cart.length === 2, `lines=${s().cart.length}`);
  check('cart count unchanged after Buy Now purchase', s().cartCount === countBefore, `count=${s().cartCount}`);
  check('buyNowItem cleared (only temp state)', s().buyNowItem === null);
  check('JBL stock decremented by 1', s().getProduct('p2').stock === jblBefore - 1);
  check('order recorded with GCash + totals', s().orders.length === 1 && s().orders[0].total === 4299 + 149);

  // ---------- FLOW A checkout: clears purchased cart items ----------
  const asusOptBefore = s().getProduct('p12').variants[0].options.find((o) => o.name === '16GB RAM').stock;
  const res2 = fire((st) => st.placeOrder({
    customer: { name: 'Howard', phone: '0917', address: 'Manila' },
    paymentMethod: 'Cash on Delivery',
    coupon: undefined,
    discount: 0,
    deliveryFee: 149,
  }));
  check('cart order succeeds with 2 lines', !(res2 && res2.error) && res2.items.length === 2);
  check('cart cleared after cart purchase', s().cart.length === 0 && s().cartCount === 0);
  check('ASUS 16GB variant stock decremented exactly',
    s().getProduct('p12').variants[0].options.find((o) => o.name === '16GB RAM').stock === asusOptBefore - 1);
  check('reports see 2 orders / combined sales',
    s().orders.length === 2 && s().orders.reduce((t, o) => t + o.total, 0) === res.total + res2.total);

  // validation + favorites + inventory smoke
  const bad = fire((st) => st.placeOrder({
    customer: { name: '', phone: '', address: '' }, paymentMethod: 'Card', discount: 0, deliveryFee: 0,
  }));
  check('checkout validates customer info', !!(bad && bad.error));
  fire((st) => st.toggleFavorite('p1'));
  check('favorite add', s().isFavorite('p1') === true);
  fire((st) => st.toggleFavorite('p1'));
  check('favorite remove', s().isFavorite('p1') === false);
  const stockBefore = s().getProduct('p16').stock;
  fire((st) => st.adjustStock('p16', -1));
  check('inventory adjust stock', s().getProduct('p16').stock === stockBefore - 1);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('TEST CRASH', e);
  process.exit(1);
}
