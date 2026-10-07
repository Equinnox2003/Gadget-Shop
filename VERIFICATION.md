# Verification performed before packaging

Date: 2026-10-07

Runtime: Node.js 24.19.0; Expo 57.0.26; expo-sqlite 57.0.4.

| Project | TypeScript | SQL durability tests | Actual React store tests | Lint | Android / iOS / web exports |
| --- | --- | --- | --- | --- | --- |
| Gadget-Shop | PASS | PASS | PASS | 0 errors, 3 warnings | PASS |

Additional checks passed for this project:

- Expo SDK dependency compatibility (`expo install --check`).
- Locked clean-install validation (`npm ci --dry-run --ignore-scripts`).
- SQLite schema, autoincrement IDs, WAL, initial seeding, case-insensitive SQL search, injection-resistant search parameters, create/edit/delete, non-negative stock validation, transaction rollback, and reopening the saved database.
- Real React provider initialization, immediate writes, stock changes, favorites, deleted-reference cleanup, and reloading the complete store from disk.
- The prebuilt browser bundle contains this shop's code and sample catalog.
- Local server HTTP responses, deep links to product management, COOP/COEP isolation headers, SQLite worker delivery, and WASM delivery with the correct MIME type.
- Launcher/server JavaScript syntax checks and ZIP integrity/required-file checks.

Lint reports no errors. Warnings remain visible for the prototypes' effect-based screen synchronization and a few existing unused imports/variables; the lab explicitly uses effect-based data loading.

The SQL and store tests execute the actual database-service queries with a Node SQLite adapter replacing Expo's native bridge. This verifies the application logic and disk restart behavior; it does not substitute for a physical phone test.

Interactive browser UI testing could not be completed in this execution environment because the headless browser could not start. The web bundles compile successfully, and their required HTTP routes, worker files, WASM assets, and isolation headers were checked.

The following require the student's own device/accounts and were not performed here:

- Terminating and reopening Expo Go in Airplane Mode on a physical phone.
- Recording the 2-4 minute video with the student's name and section.
- Creating the public GitHub/video links and submitting them to Google Classroom.

## Independent-folder packaging verification

Each project now includes its own Run-Windows.bat, run-mac-linux.sh, start.cjs, serve.cjs, README, requirement map, and verification report. The source applications and their databases remain separate.

Each project was extracted by itself into an isolated directory with no parent launcher, no installed node_modules, and no other shop folders. Its own browser launcher started successfully, and HTTP checks passed for the home page, management route, isolation headers, SQLite worker, and WASM assets. The source-launch command was also checked for the correct project working directory and its own port using a command stub; that check did not reinstall dependencies or perform another Expo/device UI test.

TypeScript and lint were rerun successfully after the packaging update. Existing SQL/store tests and production exports listed above remain applicable because application code was unchanged by this update.
