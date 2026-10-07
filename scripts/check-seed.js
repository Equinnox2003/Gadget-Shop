const s = require('../.tmp-check/seed.js');
const P = s.SEED_PRODUCTS;
const cats = ['TV & Video', 'Camera & Photo', 'Phones & Accessories', 'Video Games', 'Headphones', 'Speakers', 'Computers & Laptops'];
const bad = [];
P.forEach((p) => {
  if (!p.id || !p.name || !p.brand) bad.push(`${p.id}: missing fields`);
  if (!cats.includes(p.category)) bad.push(`${p.id}: bad category`);
  if (!(p.price >= 0)) bad.push(`${p.id}: bad price`);
  if (!Number.isInteger(p.stock) || p.stock < 0) bad.push(`${p.id}: bad stock`);
  (p.variants || []).forEach((g) =>
    g.options.forEach((o) => {
      if (o.stock < 0) bad.push(`${p.id}: negative variant stock`);
    })
  );
  if (p.stock === 0 && p.available) bad.push(`${p.id}: zero stock but available`);
});
console.log('products:', P.length, '| brands:', new Set(P.map((p) => p.brand)).size);
console.log('sony:', P.find((p) => p.id === 'p1').price, '| jbl:', P.find((p) => p.id === 'p2').price);
console.log('low-stock count:', P.filter((p) => p.stock > 0 && p.stock <= 5).length);
console.log('out-of-stock count:', P.filter((p) => p.stock === 0).length);
console.log('errors:', bad.length ? bad : 'none');
