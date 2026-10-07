# Gadget Shop - Lab 05

This is an independent Expo SDK 57 project with SQLite inventory, live SQL search, persistent product CRUD, and stock controls. Everything needed for this project is inside this folder. You can move this folder anywhere; it does not need the other shop folders or anything from its parent folder.

## Run on your laptop

1. Install Node.js 24 LTS from <https://nodejs.org/> if Node is not installed.
2. Extract the ZIP. Open the extracted **Gadget-Shop** folder.
3. On Windows, double-click **Run-Windows.bat inside this folder**. On macOS/Linux, open a terminal here and run `bash run-mac-linux.sh`.
4. Choose **mode 1** (or press Enter). This project's included browser build opens at <http://localhost:8083>.
5. Keep the terminal open while using the app. Press Ctrl+C to stop.

Mode 1 uses only Node's built-in modules. It requires no npm installation, account, API key, backend, or files from another project. The `web-build` folder contains the complete prebuilt app, including its SQLite worker and WASM assets. Keep the entire folder in your GitHub repository so the launcher works after cloning.

From a terminal in this project folder, you can also run:

```bash
node start.cjs --browser
```

To choose a different port, run `node serve.cjs 8091`. Keep the same port and browser profile on later visits because browser storage belongs to that localhost origin. Clearing site data or using private browsing affects persistence. The database is created automatically on first launch; a pre-existing database file is not required.

## Run the editable source / Expo Go

Choose **mode 2** in this folder's launcher. It installs this project's locked dependencies on first use and starts Expo on port 8083. Internet is needed for the initial dependency installation.

Alternatively, open a terminal in this folder and run:

```bash
npm ci
npm start -- --port 8083
```

Press `w` for your laptop browser. For the physical-phone assignment, use Expo Go compatible with SDK 57: connect your laptop and phone to the same Wi-Fi, then scan the terminal QR code. If Expo Go reports a version mismatch, use the matching version from <https://expo.dev/go>. SQLite is included in Expo Go for SDK 57. Android/iOS emulators are optional for laptop use.

The included `web-build` is a snapshot. After source edits, use `npm run web -- --port 8083` to view changes. `npm run build:web` exports to `dist`; to refresh the included snapshot, replace the contents of `web-build` with the exported `dist` contents and use this folder's launcher again.

## Use the Lab 05 features

1. Open **Profile > Product Management**, or visit `/manage/products` in the running browser app.
2. A fresh database seeds six sample products. Saved data from the original prototype migrates on first launch when present.
3. Use the add-product form to enter a name, category, price, and stock. Shoe-size or gadget-variant stock is retained where applicable.
4. Type in the management search box. Each keystroke queries SQLite using bound `LIKE ?` parameters and updates the `FlatList`.
5. Edit products, confirm deletion, and use Inventory stock controls. Changes commit immediately before the UI updates.
6. Stop and restart the app. Added products, edits, deletions, and stock changes remain saved. An intentionally emptied catalog stays empty after restart.

The database module is `services/db.ts`, and the local database is `gadget_pos_inventory.db`. The source, dependency manifest and lockfile, assets, database service, tests, configuration, launchers, and documentation all belong to this project.

Inventory works without a REST API or internet after the app has loaded. Remote product photos may be unavailable offline; existing placeholders still allow inventory work. **Reset Demo Data** deliberately replaces the catalog, so avoid it during your durability demonstration.

## Physical-phone test and submission required by the PDF

1. Open this project on your physical phone using Expo Go and wait for it to load.
2. Add two distinctly named products and delete one existing product.
3. Search for a new product and show the result.
4. Enable Airplane Mode, fully terminate Expo Go, and reopen this project.
5. Show both added products are still present, the deleted product stays absent, and a stock edit remains saved.
6. Record a 2-4 minute demonstration with your student name and section, and submit the public GitHub repository and publicly viewable video links using your own accounts.

SQLite persistence needs no network. Expo Go also needs an available JavaScript bundle to reopen offline. If it asks to reconnect to Metro after termination, an installed preview build includes its own bundle. Optional Android preview configuration is included in this folder's `eas.json`; after setting up your Expo account, run `npx eas-cli@latest build --platform android --profile preview` from this folder.

The physical-phone Airplane Mode test, recording, and public repository/video submissions have not been performed in this workspace.

## Verification commands

After `npm ci`, run these inside this folder:

```bash
npm run typecheck
npm run lint
npm test
npm run build:web
```

`npm test` checks real SQLite queries and disk restart behavior through Node's SQLite bridge adapter and mounts the actual React provider. It does not replace the physical-phone demonstration. See this folder's `LAB05-IMPLEMENTATION.md` and `VERIFICATION.md` for the requirement map and test results.

## Troubleshooting

- Port in use: stop the earlier terminal or use `node serve.cjs 8091` with a free port.
- Blank page / SQLite worker error: use this folder's launcher or server. Opening `index.html` directly does not provide the required isolation headers.
- PowerShell blocks npm.ps1: use Run-Windows.bat, Command Prompt, or `npm.cmd` in place of `npm`.
- With multiple Node.js installations: the launcher locates a working npm command on PATH.
- Phone cannot connect: check the same-Wi-Fi connection and permit Node through your local firewall when prompted.
- Dependency installation fails: check Node and internet access, then rerun `npm ci` here.

SQLite documentation: <https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/>
