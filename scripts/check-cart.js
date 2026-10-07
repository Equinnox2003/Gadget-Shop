// Simulates ProductCard.quickAdd + StoreContext.addToCart guards for EVERY seed
// product, mirroring the real implementations line-for-line.
const s = require('../.tmp-check/data/seed.js');
const P = s.SEED_PRODUCTS;

function optionAvailable(p, selected) {
  if (!p.available || p.stock <= 0) return false;
  for (const g of p.variants || []) {
    const pick = selected[g.label];
    if (!pick) continue;
    const opt = g.options.find((o) => o.name === pick);
    if (!opt || opt.stock <= 0) return false;
  }
  return true;
}
function maxQty(p, selected) {
  let cap = p.stock;
  for (const g of p.variants || []) {
    const pick = selected[g.label];
    if (!pick) continue;
    const opt = g.options.find((o) => o.name === pick);
    if (opt) cap = Math.min(cap, opt.stock);
  }
  return Math.max(cap, 0);
}
// --- quickAdd replica (components/ProductCard.tsx) ---
function quickAdd(p) {
  const soldOut = !p.available || p.stock <= 0;
  if (soldOut) return { action: 'alert-oos' };
  const selected = {};
  if ((p.colors || []).length > 0) selected['Color'] = p.colors[0];
  for (const g of p.variants || []) {
    const opt = g.options.find((o) => o.stock > 0);
    if (!opt) return { action: 'open-details' };
    selected[g.label] = opt.name;
  }
  if (!optionAvailable(p, selected)) return { action: 'alert-oos' };
  const cap = maxQty(p, selected);
  const q1 = Math.min(1, cap); // click once
  const q2 = Math.min(q1 + 1, cap); // click again
  return { action: 'added', selected, q1, q2 };
}

const ids = new Set();
let fail = 0;
for (const p of P) {
  if (ids.has(p.id)) { console.log('DUP ID', p.id); fail++; }
  ids.add(p.id);
  for (const f of ['name', 'price', 'image', 'category', 'brand']) {
    if (p[f] === undefined || p[f] === null || p[f] === '') { console.log('MISSING', p.id, f); fail++; }
  }
  const r = quickAdd(p);
  const expectOOS = p.id === 'p9';
  if (expectOOS && r.action !== 'alert-oos') { console.log('OOS FAIL', p.id, r); fail++; }
  if (!expectOOS && r.action === 'alert-oos') { console.log('SHOULD-ADD FAIL', p.id); fail++; }
  if (r.action === 'added' && !(r.q1 === 1 && r.q2 === 2)) { console.log('QTY FAIL', p.id, r); fail++; }
  console.log(`${p.category} | ${p.name} -> ${r.action}${r.selected ? ' ' + JSON.stringify(r.selected) : ''}`);
}
// Buy Now path: details screen always calls addToCart(product.id, qty, selected)
// with explicit user selections — same single handler, no branching.
console.log(fail === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${fail}`);
