import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export const DATABASE_NAME = 'gadget_pos_inventory.db';

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  stockBySize?: Record<string, number>;
  sizes?: string[];
  brand?: string;
  material?: string;
}

interface ProductRow {
  id: number;
  product_key: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  details: string;
}

export let db: SQLite.SQLiteDatabase;
let initialization: Promise<void> | undefined;
let transactionDepth = 0;

/** Nested calls share one transaction, so a failed write rolls everything back. */
export function transaction<T>(task: () => T): T {
  if (transactionDepth > 0) return task();
  let result!: T;
  db.withTransactionSync(() => {
    transactionDepth++;
    try { result = task(); } finally { transactionDepth--; }
  });
  return result;
}

/** Open only on the client; importing this module during web rendering is safe. */
export function initDatabase<T extends CatalogProduct>(
  initialProducts: T[],
  initialValues: Record<string, unknown> = {},
): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    db = Platform.OS === 'web'
      ? await SQLite.openDatabaseAsync(DATABASE_NAME)
      : SQLite.openDatabaseSync(DATABASE_NAME);
    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL CHECK(length(trim(name)) > 0),
        category TEXT NOT NULL CHECK(length(trim(category)) > 0),
        price REAL NOT NULL CHECK(price >= 0),
        stock INTEGER NOT NULL CHECK(stock >= 0),
        brand TEXT NOT NULL DEFAULT '',
        material TEXT NOT NULL DEFAULT '',
        details TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      PRAGMA user_version = 1;
    `);
    transaction(() => {
      const seeded = db.getFirstSync<{ value: string }>('SELECT value FROM metadata WHERE key = ?', ['initialized']);
      if (!seeded) {
        const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM products');
        if (count?.count === 0) writeProducts(initialProducts);
        for (const [key, value] of Object.entries(initialValues)) saveValue(key, value);
        db.runSync('INSERT INTO metadata (key, value) VALUES (?, ?)', ['initialized', '1']);
      }
    });
  })().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

function productStock(product: CatalogProduct): number {
  if (product.stockBySize) {
    return (product.sizes ?? Object.keys(product.stockBySize))
      .reduce((sum, size) => sum + (product.stockBySize?.[size] ?? 0), 0);
  }
  return product.stock ?? 0;
}

function validate(product: CatalogProduct) {
  const stock = productStock(product);
  if (!product.id || !product.name.trim() || !product.category.trim()) {
    throw new Error('Product name and category are required.');
  }
  if (!Number.isFinite(product.price) || product.price < 0) throw new Error('Price must be zero or more.');
  if (!Number.isSafeInteger(stock) || stock < 0) throw new Error('Stock must be a non-negative whole number.');
  for (const value of Object.values(product.stockBySize ?? {})) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Size stock must be a non-negative whole number.');
  }
}

function fromRow<T extends CatalogProduct>(row: ProductRow): T {
  const product = JSON.parse(row.details) as T;
  return { ...product, id: row.product_key, name: row.name, category: row.category,
    price: row.price, ...('stock' in product ? { stock: row.stock } : {}) };
}

/** User input is bound to LIKE parameters, never interpolated into SQL. */
export function loadProducts<T extends CatalogProduct>(search = ''): T[] {
  const query = search.trim();
  const rows = query
    ? db.getAllSync<ProductRow>(
      `SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR brand LIKE ? OR material LIKE ?
       ORDER BY name COLLATE NOCASE ASC, id DESC`,
      Array(4).fill(`%${query}%`) as string[],
    )
    : db.getAllSync<ProductRow>('SELECT * FROM products ORDER BY id DESC');
  return rows.map((row) => fromRow<T>(row));
}

/** Persist only changed rows. INTEGER id is the DB key; product_key preserves existing cart references. */
export function writeProducts<T extends CatalogProduct>(products: T[]): T[] {
  products.forEach(validate);
  if (new Set(products.map((p) => p.id)).size !== products.length) throw new Error('Duplicate product ID.');
  transaction(() => {
    const existing = db.getAllSync<{ id: number; product_key: string; details: string }>(
      'SELECT id, product_key, details FROM products',
    );
    const old = new Map(existing.map((row) => [row.product_key, row]));
    const retained = new Set(products.map((p) => p.id));
    for (const product of products) {
      const details = JSON.stringify(product);
      const row = old.get(product.id);
      if (row?.details === details) continue;
      const params = [product.name.trim(), product.category.trim(), product.price, productStock(product),
        product.brand ?? '', product.material ?? '', details];
      if (row) {
        db.runSync(`UPDATE products SET name = ?, category = ?, price = ?, stock = ?,
          brand = ?, material = ?, details = ? WHERE id = ?`, [...params, row.id]);
      } else {
        db.runSync(`INSERT INTO products (name, category, price, stock, brand, material, details, product_key)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [...params, product.id]);
      }
    }
    for (const row of existing) {
      if (!retained.has(row.product_key)) db.runSync('DELETE FROM products WHERE id = ?', [row.id]);
    }
  });
  return loadProducts<T>();
}

export function loadValue<T>(key: string, fallback: T): T {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', [key]);
  return row ? JSON.parse(row.value) as T : fallback;
}

export function saveValue<T>(key: string, value: T): T {
  db.runSync(`INSERT INTO app_state (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, JSON.stringify(value)]);
  return value;
}
