// Tests the REAL chart utils (bucketing, formatting, scaling) used by SalesLineChart.
const path = require('path');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, '.tmp-check');
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.startsWith('@/')) return origLoad.call(this, path.join(TMP, request.slice(2)), parent, isMain);
  return origLoad.call(this, request, parent, isMain);
};
const { bucketSales, formatShortPeso, niceCeil, yTicks, computePoints } = require(path.join(TMP, 'utils', 'chart.js'));

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
}
const D = '2026-10-04T12:00:00';
const day = 24 * 60 * 60 * 1000;
const t0 = new Date(D).getTime();
const mk = (date, total, status = 'Pending', cat = 'Headphones', brand = 'Sony') => ({
  id: `T-${date}-${total}`, date, status, paymentMethod: 'GCash', customer: { name: 'H', phone: '1', address: 'A' },
  subtotal: total, deliveryFee: 0, discount: 0, total,
  items: [{ productId: 'p1', name: 'Sony', brand, image: '', price: total, qty: 1, selected: {}, category: cat }],
});

// daily grouping + chronological order
const orders = [
  mk(t0, 100), mk(t0, 200), // same day -> one bucket 300
  mk(t0 - day, 500), // previous day
  mk(t0 - day, 999, 'Cancelled'), // must NOT count
];
const daily = bucketSales(orders, 'daily');
check('daily groups same-day sales', daily.length === 2, JSON.stringify(daily));
check('daily chronological ascending', daily[0].key < daily[1].key);
check('daily sums values', daily[1].value === 300, JSON.stringify(daily));
check('cancelled excluded', daily.reduce((s, b) => s + b.value, 0) === 800);

// weekly grouping (Oct 4 2026 is a Sunday; weeks start Sunday)
const weekly = bucketSales([mk(t0 - day, 100), mk(t0 - 2 * day, 100), mk(t0 - 10 * day, 100)], 'weekly');
check('weekly groups into week buckets', weekly.length === 2, JSON.stringify(weekly.map((b) => b.label)));
check('weekly sums same-week sales', weekly[1].value === 200, JSON.stringify(weekly.map((b) => b.value)));
check('weekly labels prefixed', weekly.every((b) => b.label.startsWith('Wk ')));

// monthly grouping
const m1 = new Date(2026, 6, 15).getTime();
const m2 = new Date(2026, 8, 5).getTime();
const monthly = bucketSales([mk(m1, 50), mk(m2, 70)], 'monthly');
check('monthly groups by month', monthly.length === 2 && monthly[0].value === 50 && monthly[1].value === 70);
check('monthly labels readable', monthly.every((b) => /2026/.test(b.label)), JSON.stringify(monthly.map((b) => b.label)));

// axis formatting
check('axis 0', formatShortPeso(0) === '₱0.00', formatShortPeso(0));
check('axis 50K', formatShortPeso(50000) === '₱50K', formatShortPeso(50000));
check('axis 100K', formatShortPeso(100000) === '₱100K', formatShortPeso(100000));
check('axis 250K', formatShortPeso(250000) === '₱250K', formatShortPeso(250000));
check('axis 500K', formatShortPeso(500000) === '₱500K', formatShortPeso(500000));
check('axis millions', formatShortPeso(1200000) === '₱1.2M', formatShortPeso(1200000));
check('niceCeil 472288 -> 500000', niceCeil(472288) === 500000);
check('yTicks 5 ticks ascending ending at ceiling',
  (() => { const t = yTicks(472288); return t.length === 5 && t[0] === 0 && t[4] === 500000; })());

// scaling: multi + single point
const pad = { left: 56, right: 14, top: 14, bottom: 30 };
const multi = computePoints([100, 300, 200], 400, 240, pad);
check('multi-point count', multi.points.length === 3);
check('multi-point x ascending + in bounds', multi.points.every((p, i, a) => p.x >= 56 && p.x <= 386 && (i === 0 || p.x > a[i - 1].x)));
check('higher value is higher on screen', multi.points[1].y < multi.points[0].y && multi.points[1].y < multi.points[2].y);
const single = computePoints([472288], 400, 240, pad);
check('single point centered in plot area, not a full bar', Math.abs(single.points[0].x - (56 + (400 - 56 - 14) / 2)) < 1 && single.points.length === 1);
check('single point inside plot area', single.points[0].y > 14 && single.points[0].y < 210);
check('empty buckets -> chart empty state branch', bucketSales([], 'daily').length === 0 && bucketSales([], 'monthly').length === 0);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
