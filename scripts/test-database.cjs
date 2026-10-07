// Executes the real db.ts SQL against a temporary SQLite file using Node 22+.
// The adapter replaces only Expo's native bridge, not database queries or persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab05-sqlite-'));
let connection;
function loadService() {
  const source = fs.readFileSync(path.join(__dirname, '../services/db.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const sqlite = {
    openDatabaseSync(name) {
      connection = new DatabaseSync(path.join(directory, name));
      return {
        execSync: (sql) => connection.exec(sql),
        runSync: (sql, params = []) => connection.prepare(sql).run(...params),
        getFirstSync: (sql, params = []) => connection.prepare(sql).get(...params) ?? null,
        getAllSync: (sql, params = []) => connection.prepare(sql).all(...params),
        withTransactionSync(task) {
          connection.exec('BEGIN');
          try { task(); connection.exec('COMMIT'); }
          catch (error) { connection.exec('ROLLBACK'); throw error; }
        },
      };
    },
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => {
    if (name === 'expo-sqlite') return sqlite;
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    throw new Error(`Unexpected import: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}

async function main() {
  let service = loadService();
  const seed = Array.from({ length: 6 }, (_, index) => ({
    id: `seed-${index}`, name: `Sample ${index}`, category: 'General', price: 12.5, stock: 5,
  }));
  await service.initDatabase(seed, { favorites: ['seed-0'] });
  await service.initDatabase(seed);
  assert.equal(service.loadProducts().length, 6, 'Seeds only once');
  assert.equal(service.db.getFirstSync('PRAGMA journal_mode').journal_mode, 'wal');
  assert.match(service.db.getFirstSync("SELECT sql FROM sqlite_master WHERE name = 'products'").sql,
    /INTEGER PRIMARY KEY AUTOINCREMENT/);
  assert.ok(service.db.getAllSync("SELECT name FROM sqlite_master WHERE type = 'index'")
    .some((row) => row.name === 'idx_products_name'));
  const first = { id: 'added-1', name: "O'Brien Ring", category: 'Rings', price: 99.75, stock: 2 };
  const second = { id: 'added-2', name: 'Travel Shoe', category: 'Shoes', price: 80.5,
    sizes: ['8', '9'], stockBySize: { 8: 2, 9: 3 } };
  service.writeProducts([...service.loadProducts(), first, second]);
  assert.equal(service.loadProducts('BRIEN')[0].name, first.name, 'Case-insensitive SQL search');
  assert.equal(service.loadProducts("' OR 1=1 --").length, 0, 'Search parameters cannot inject SQL');
  assert.equal(service.db.getFirstSync('SELECT stock FROM products WHERE product_key = ?', [second.id]).stock, 5);
  service.writeProducts(service.loadProducts().map((p) => p.id === first.id ? { ...p, stock: 1, price: 101.25 } : p)
    .filter((p) => p.id !== 'seed-0'));
  service.saveValue('orders', [{ id: 'order-1', total: 101.25 }]);
  assert.throws(() => service.writeProducts([{ ...first, stock: -1 }]), /Stock/);
  assert.throws(() => service.transaction(() => {
    service.saveValue('rollback', 'must disappear');
    throw new Error('Abort');
  }), /Abort/);
  assert.equal(service.loadValue('rollback', null), null);
  connection.close();
  service = loadService();
  await service.initDatabase(seed);
  assert.equal(service.loadProducts().length, 7, 'Creates and deletes survive reopening');
  assert.equal(service.loadProducts().find((p) => p.id === first.id).stock, 1);
  assert.equal(service.loadProducts().find((p) => p.id === first.id).price, 101.25);
  assert.deepEqual(service.loadValue('orders', []), [{ id: 'order-1', total: 101.25 }]);
  service.writeProducts([]);
  connection.close();
  service = loadService();
  await service.initDatabase(seed);
  assert.equal(service.loadProducts().length, 0, 'Deleting the final row stays empty after restart');
  service.writeProducts([first]);
  assert.ok(service.db.getFirstSync('SELECT id FROM products').id > 6, 'Autoincrement IDs are not recycled');
  connection.close();
  console.log('PASS: schema, WAL, seeding, SQL search, create, update, delete, rollback, stock, and restart durability.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => fs.rmSync(directory, { recursive: true, force: true }));
