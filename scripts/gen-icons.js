// Generates Gadget Shop branding PNGs (pink + navy bolt) with zero dependencies.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PINK = [255, 128, 199, 255];
const NAVY = [26, 26, 46, 255];
const WHITE = [255, 255, 255, 255];
const LIGHT_BLUE = [255, 219, 253, 255];

// Lightning bolt polygon in a 0..1024 box
const BOLT = [
  [600, 90],
  [300, 570],
  [492, 570],
  [430, 934],
  [724, 450],
  [532, 450],
];

function inside(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const cs = Buffer.alloc(4);
  cs.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, cs]);
}

function encodePng(size, paint) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x, y, size);
      const o = y * (stride + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const scalePoly = (size) => BOLT.map(([x, y]) => [(x / 1024) * size, (y / 1024) * size]);

function boltOn(bg) {
  return (size) => {
    const poly = scalePoly(size);
    return (x, y) => (inside(x + 0.5, y + 0.5, poly) ? NAVY : bg);
  };
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
const jobs = [
  ['icon.png', 1024, boltOn(PINK)(1024)],
  ['android-icon-foreground.png', 1024, boltOn(PINK)(1024)],
  ['android-icon-background.png', 1024, () => LIGHT_BLUE],
  ['android-icon-monochrome.png', 1024, boltOn(WHITE)(1024)],
  ['splash-icon.png', 512, boltOn(WHITE)(512)],
  ['favicon.png', 64, boltOn(PINK)(64)],
];
for (const [name, size, paint] of jobs) {
  fs.writeFileSync(path.join(outDir, name), encodePng(size, paint));
  console.log('wrote', name, size);
}
