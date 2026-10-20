# Existing database integration

The application extends MariaDB database `dlingo_jamur`. The eight original InnoDB tables, their primary keys and their foreign keys remain in place. A schema/data backup was created on the server before migration at `/root/capstone-backups/dlingo_jamur-20261019T234454Z.sql` (owner-only access).

## Original schema mapping

| Table | Model / access | Key |
| --- | --- | --- |
| `user` | `User`, Laravel session authentication | `id_user` |
| `pembeli` | `Buyer` | `id_pembeli` |
| `product` | `Product` | `id_produk` |
| `ternak` | `Livestock` | `id_ternak` |
| `pengurus` | `Caretaker` | `id_pengurus` |
| `pesanan` | `Order` | `id_pesanan` |
| `detail_pesanan` | Transactional query builder | `(id_pesanan, id_produk)` |
| `pengurus_ternak` | `ContractService` / query builder | `(id_pengurus, id_ternak, waktu_kontrak_awal)` |

Composite keys are accessed with explicit query-builder predicates rather than unsupported Eloquent composite IDs. IDs in the interface use display prefixes such as `PRD-001`; the database keeps its integer keys.

`database/schema/dlingo-baseline.sql` records the original CREATE statements. The adjacent JSON manifest records original column types, nullability and key categories. `app:adopt-database` verifies the manifest and records the baseline migration without executing its SQL against existing tables. On a fresh database, the baseline migration creates the original schema. Normal migrations then add application support. Baseline rollback is protected. Destructive Artisan commands (wipe, fresh, refresh, reset and rollback) are disabled unless the connection targets `dlingo_jamur_test` outside production.

## Additions

- `user.remember_token`, `user.is_active`: remembered login and account deactivation.
- `pembeli.account_user_id`: nullable unique login link, with a nullable-on-delete FK. Existing `id_user` remains the **creator**, not the buyer's login. Unlinked contacts remain valid for staff-entered orders.
- `product.gambar`: public-disk image path.
- `pengurus.is_active`, `pengurus.deleted_at`, `ternak.deleted_at`: active staff and archived records.
- Contract dates retain the original composite key and use microsecond precision for repeated assignments. Closing a contract sets its end/status; reassigning creates a new row.
- `pesanan.created_by`: optional audit link to the actor entering an order.
- `detail_pesanan.nama_produk` and `.satuan`: snapshots alongside existing quantity, unit price and subtotal. Original lines without snapshots fall back to the product name/unit.
- `sessions`: Laravel's database sessions.
- `farm_settings`: singleton farm identity, contact and manual transfer account.
- `activity_logs`: actor/category/message history; buyers see only their own activity.

These are additive changes to the existing domain tables; original data is not replaced. The optional reference seed runs only when **all eight** domain tables are empty. It adds three accounts, three products with combined stock 183, two customer contacts, four livestock, three caretakers, four contracts, shared bank information and no orders.

## Transactions and ownership

Farm access is role based (`admin` / `petani`) and shared across all creator IDs. Buyer access requires `pembeli.account_user_id` to match the signed-in account. Controllers validate explicit fields; public registration never accepts an elevated role. Account deletion is deactivation, protecting creator relationships even where the original schema defines cascading deletes.

Checkout locks the buyer and products, sorts product IDs, derives totals from database prices, inserts the order and line snapshots, decrements stock, and records activity in one transaction. Cancellation locks the order and products, validates the status, and restores stock once in the same transaction. Deletion checks use row locks to protect referenced customers/products during concurrent checkout. Contract changes lock the livestock and validate active caretakers before updating history.

`dlingo_app` is restricted to the application and isolated test databases. MariaDB stays behind the SSH tunnel; a public database port is unnecessary. Application `.env` files and all credentials are ignored by Git. No application web deployment was performed as part of this migration.
