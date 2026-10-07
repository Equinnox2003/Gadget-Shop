# Lab 05 requirement map

The PDF's actual exercise is offline-first persistence and CRUD with Expo SQLite. This independent Gadget Shop project implements that exercise.

| Requirement | Implementation in this project |
| --- | --- |
| Install `expo-sqlite` | SDK-compatible dependency in `package.json`, exact installed version in `package-lock.json`, and app config plugin |
| Database service | `services/db.ts` |
| Modern Expo API | `openDatabaseSync` on mobile, `openDatabaseAsync` for web worker startup, then `execSync`, `getAllSync`, `getFirstSync`, and `runSync` |
| SQL schema and integrity | `products` uses `INTEGER PRIMARY KEY AUTOINCREMENT`, required name/category/price/stock, non-negative constraints, and a unique product key |
| WAL and durability | `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = FULL`, immediate committed writes, and transactional catalog mutations |
| SQL indexing | Indexed case-insensitive product name and category; unique product key |
| Automatic initial data | Six shop-specific samples on a fresh installation; an initialization marker prevents deleted products being reseeded |
| Read inventory dynamically | React providers load state from SQLite `SELECT` results after database initialization and after changes |
| Parameterized real-time SQL search | `services/useProductSearch.ts` invokes `loadProducts(search)` and bound `LIKE ?` queries |
| Virtualized inventory list | `app/manage/products.tsx` |
| Create with an input form | Existing add-product screens now invoke SQLite-backed store actions |
| Update | Existing edit screens persist product details and fractional prices to SQLite |
| Delete with confirmation | Confirmed removal executes parameterized SQL `DELETE ... WHERE id = ?`, then refreshes state and removes stale cart/favorite references |
| Stock update bonus | Jewelry/Gadget stock controls and Shoe stock-by-size controls persist changes to SQLite |
| Restart preservation | Catalog, cart, favorites, order history, searches where supported, and settings are stored locally |
| Laptop browser support | WASM-enabled Metro config plus COOP/COEP headers; included built versions and a dependency-free local Node server |
| Offline phone demonstration | The manual test and recording checklist are in this folder's README; the recording must be made on the student's physical phone |

The integer `products.id` is the relational database key. `product_key` preserves the original apps' string IDs, so their existing product links, carts, and historical order snapshots remain compatible. Additional shop-specific fields, such as materials, shoe sizes, variant options, images, and specifications, are preserved in the row's `details` field alongside the indexed core columns.

AsyncStorage is read only for a one-time migration of the original prototype's saved data. New persistence writes go through SQLite. The seed arrays are initial/reset fixtures, not the live catalog.
