// Mount the real React store and exercise its SQLite persistence with a local native-bridge adapter.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const React = require('react');
const Renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;

const root = path.resolve(__dirname, '..');
const name = require('../package.json').name;
const isShoe = name === 'shoe-store';
const isGadget = name === 'gadget-shop';
const config = isShoe ? ['src/store/AppContext', 'AppProvider', 'useApp']
  : isGadget ? ['store/StoreContext', 'StoreProvider', 'useStore'] : ['store/shop', 'ShopProvider', 'useShop'];
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lab05-store-'));
const compiled = path.join(directory, 'compiled');
let connection;
let context;
let renderer;
const originalLoad = Module._load;

function compile(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (['node_modules', '.expo', '.tmp-check', 'dist', 'web-build', 'tmp', 'scripts'].includes(entry.name)) continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) compile(file);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      const output = path.join(compiled, path.relative(root, file).replace(/\.tsx?$/, '.js'));
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
      } }).outputText);
    }
  }
}

const sqlite = {
  openDatabaseSync(databaseName) {
    connection = new DatabaseSync(path.join(directory, databaseName));
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
Module._load = function(request, parent, isMain) {
  if (request === 'expo-sqlite') return sqlite;
  if (request === 'react-native') return { Platform: { OS: 'android' }, View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator' };
  if (request === '@react-native-async-storage/async-storage') return { getItem: async () => null };
  if (request.startsWith('@/')) return originalLoad.call(this,
    path.join(compiled, isShoe ? 'src' : '', request.slice(2)), parent, isMain);
  if (!request.startsWith('.') && !path.isAbsolute(request) && !request.startsWith('node:')) {
    request = require.resolve(request, { paths: [root] });
  }
  return originalLoad.call(this, request, parent, isMain);
};

async function mount() {
  const store = require(path.join(compiled, config[0]));
  function Probe() {
    const value = store[config[2]]();
    React.useLayoutEffect(() => { context = value; });
    return null;
  }
  await Renderer.act(async () => {
    renderer = Renderer.create(React.createElement(store[config[1]], null, React.createElement(Probe)));
  });
  assert.ok(context, 'Database initialization completes before screens mount');
}
function fire(action) {
  let result;
  Renderer.act(() => { result = action(context); });
  return result;
}

async function main() {
  compile(root);
  await mount();
  assert.equal(context.products.length, 6);
  const sample = context.products.find((p) => isGadget ? p.variants?.length : true);
  const product = { ...sample, id: 'durable-test', name: 'Durability Test', price: 145.75,
    ...(isShoe ? { stockBySize: Object.fromEntries(sample.sizes.map((s) => [s, 8])) } : { stock: 8 }),
  };
  const add = (store, value) => isGadget ? store.upsertProduct(value) : store.addProduct(value);
  const created = fire((store) => add(store, product));
  const id = !isShoe && !isGadget ? created.id : product.id;
  const services = require(path.join(compiled, isShoe ? 'src/services/db' : 'services/db'));
  assert.equal(services.loadProducts('Durability Test').length, 1, 'Create is committed immediately');
  fire((store) => store.toggleFavorite(id));
  if (isShoe) {
    fire((store) => store.adjustSizeStock(id, sample.sizes[0], -1));
    assert.equal(services.loadProducts('Durability Test')[0].stockBySize[sample.sizes[0]], 7);
  } else {
    fire((store) => store.adjustStock(id, -1));
    assert.equal(services.loadProducts('Durability Test')[0].stock, 7);
  }
  if (isGadget) {
    const group = product.variants[0];
    fire((store) => store.adjustVariantStock(id, group.id, group.options[0].name, -1));
    assert.equal(services.loadProducts('Durability Test')[0].variants[0].options[0].stock,
      group.options[0].stock - 1);
  }
  const deletedId = context.products.find((p) => p.id !== id).id;
  fire((store) => store.deleteProduct(deletedId));
  assert.equal(services.loadProducts().some((p) => p.id === deletedId), false);
  Renderer.act(() => renderer.unmount());
  connection.close();
  for (const key of Object.keys(require.cache)) if (key.startsWith(compiled)) delete require.cache[key];
  context = null;
  await mount();
  assert.ok(context.products.some((p) => p.id === id));
  assert.ok(context.favorites.includes(id));
  assert.equal(context.products.some((p) => p.id === deletedId), false);
  assert.equal(context.products.find((p) => p.id === id).price, 145.75);
  fire((store) => store.deleteProduct(id));
  assert.equal(context.favorites.includes(id), false, 'Delete removes stale favorite references');
  Renderer.act(() => renderer.unmount());
  connection.close();
  console.log(`PASS: ${name} provider startup, immediate CRUD, stock, favorites, and full store restart.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => {
    Module._load = originalLoad;
    fs.rmSync(directory, { recursive: true, force: true });
  });
