# JamurTani — Desa Dlingo

Laravel 13 application for mushroom sales and shared farm/livestock management. Blade renders the application pages; Vite bundles the shared responsive CSS and vanilla JavaScript. PHP owns authentication, validation, authorization and database writes. Node.js is only needed to build assets and run browser checks.

## Local setup

Requirements: PHP 8.3+ with PDO MySQL, mbstring, fileinfo and the standard Laravel extensions; Composer 2; Node.js 22.12+; MariaDB. This checkout uses the group's remote MariaDB through a local SSH tunnel. The web application still runs locally.

```sh
composer install
cp .env.example .env
php artisan key:generate
npm ci
```

Enter the database password in the ignored `.env`. Keep `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_DATABASE=dlingo_jamur` and `DB_USERNAME=dlingo_app` for the existing group database. Open a tunnel in another terminal:

```sh
ssh -N -L 127.0.0.1:3307:127.0.0.1:3306 -p 52345 root@185.205.222.202
```

The database account needs privileges on the application database only. SSH and database passwords are separate and must stay outside Git. The current workstation is already configured locally.

For the group's **existing eight-table database**, register its verified baseline before applying additions:

```sh
php artisan app:adopt-database
php artisan migrate
```

For a completely empty MariaDB database, run `php artisan migrate` directly. The first migration recreates the original schema. Adoption rejects mismatched original columns and never imports or replaces existing records. Destructive Artisan resets and rollbacks are blocked for databases other than the isolated `dlingo_jamur_test`; normal forward migrations remain available.

Optionally load reference records on an empty database:

```sh
php artisan db:seed --class=ReferenceSeeder
php artisan storage:link
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

Open http://127.0.0.1:8000. The seeder skips all reference data if any domain table already contains records. `storage:link` is needed for uploaded product photos, including when seeding is skipped. During development, run `npm run dev` alongside the PHP server for asset updates.

## Reference accounts

These accounts exist only when the reference seed was applied. Password: `demo12345`.

| Role | Username | Email |
| --- | --- | --- |
| Administrator | `superadmin` | `admin@dlingo.test` |
| Farm staff (Budi) | `petani` | `budi@example.com` |
| Buyer | `pembeli` | `andi@dlingo.test` |

Fresh reference databases use `petani` for farm staff; existing accounts are not renamed. Actual permissions use `role`, not the username. Staff sign in at `/admin/login`; buyers use `/login`. Public registration always creates an unverified buyer and a linked customer contact. Email verification is required before checkout. Administrators create other staff/admin accounts. Livestock caretakers are separate contact records and do not automatically receive login accounts.

## Behavior and pages

| Area | Routes |
| --- | --- |
| Public | `/`, `/products/{id}`, `/login`, `/register` |
| Dashboards | `/admin` (petani/admin), `/dashboard/pembeli` (buyer) |
| Farm management | `/admin/products`, `/admin/buyers`, `/admin/stock`, `/admin/orders`, `/admin/livestock`, `/admin/caretakers` |
| Buyer | `/cart`, `/orders` |
| Account/admin | `/profile`, `/admin/users` |

Admins and farm staff manage **one shared farm**, regardless of who created a record. Buyers can see and cancel only their own linked orders, including orders entered for them by staff. Prices and stock are rechecked in the database at checkout. Cart contents are private to the logged-in buyer's session and do not reserve stock.

Orders follow `menunggu → dikonfirmasi → diproses → dikirim → selesai`. Farm staff may cancel an open order; buyers may cancel their own waiting or confirmed orders. Transactions and row locks prevent overselling and repeated stock restoration. Only completed orders count as farm revenue. Order lines preserve the purchased name, unit and price.

Bank/contact information belongs to the farm and is edited by admins from Profile → Rekening. Payment is a manual transfer; confirmation and delivery are arranged with the farm. There is no payment gateway or automatic payment verification. Product photos are stored on Laravel's public disk (JPEG/PNG/WebP, max 2 MB). Upload product photos from the product form; there is no standalone file-upload tool.

Referenced products/customers cannot be deleted. Livestock/caretakers are archived and their composite-key contract history is retained. Removing an account deactivates it and invalidates its sessions while preserving business records.

The UI follows the SideSketch proposal in `docs/design/jamurtani-ui.ldv.json`: restrained blue/white surfaces, subtle borders, and product-first shopping pages. Staff use a sidebar from 1024px upward and Home/Produk/Pesanan/Ternak/Lainnya bottom navigation below that breakpoint. The Lainnya menu exposes the remaining role-appropriate tools. Shopping pages use top navigation on desktop and Home/Produk/Pesanan/Keranjang/Profil bottom navigation on smaller screens. Catalog cards use one column below 640px, two below 1024px, and three above.

Buyer Home shows pending orders, the session cart, and three products ordered by name. Farmer/admin dashboards use live counts, low-stock warnings (under 10), five latest orders, and three latest activities. Product detail and checkout keep primary controls above mobile navigation, with safe-area and content clearance. Uploaded product photos remain supported; absent or failed photos show neutral placeholders. Payment remains a manual bank transfer.

The superseded Express backend and browser-local demo store have been removed; historical commits remain available.

## Verification

Create a separate `dlingo_jamur_test` MariaDB database and grant the test user access. Copy `.env` to ignored `.env.testing`, set `APP_ENV=testing`, `DB_DATABASE=dlingo_jamur_test`, clear `DB_URL`, and retain the correct tunnel/credentials. Do not run the different test commands concurrently: they share the isolated test database.

```sh
php tests/prepare-database.php
php artisan test
php tests/concurrency.php
npm run build
npm run test:browser
```

All test entry points verify the exact database name before writing. The preparation and browser commands recreate **only `dlingo_jamur_test`**. Feature tests use rollback transactions. The concurrency check starts independent PHP workers for last-item checkout and simultaneous cancellation. Browser checks start/stop their own PHP server, exercise actual CSRF and database sessions, cover application pages at desktop/mobile sizes, upload a photo, and test farm/admin/buyer workflows. HTTP logs and a screenshot of the failing page are stored in ignored `test-results/`. Routine screenshots are disabled; opt in with `BROWSER_SCREENSHOTS=1 npm run test:browser`. Browser checks also cover 320px/768px/1024px navigation, role menus, dialog focus restoration, fixed purchase controls, missing photos, long names, sold-out products, and stale-stock checkout.

Browser tests default to Chromium at `/usr/bin/chromium`. Set `BROWSER_ENGINE=firefox` or `BROWSER_ENGINE=webkit` to use another Playwright engine after installing its matching browser (for example, `npx playwright install firefox`). `BROWSER_EXECUTABLE_PATH` overrides the selected engine executable; `CHROMIUM_PATH` remains supported for Chromium. `BROWSER_PORT` defaults to 8123. The temporary `.env.browser` file is ignored and removed after the run.

See [database notes](docs/database.md) for schema mappings and migration details. This branch prepares the local application and remote database; web-server deployment is a separate step.

## Security and production

See [security model and checks](docs/security.md) and [VPS deployment/restore instructions](docs/deployment.md). The application uses cookie sessions, record-level authorization, signed email verification, password recovery, request limits and browser security headers. Two-factor authentication is deferred. Production must use SMTP, HTTPS, restricted runtime DB privileges and an atomic persistent rate-limit cache. Run `php artisan security:check` as the PHP-FPM user before public launch; local/demo defaults deliberately fail. Create the owner interactively with `php artisan security:create-admin`; never seed reference accounts in production. Deployment templates live under `deployment/`; no live VPS changes are performed automatically.
