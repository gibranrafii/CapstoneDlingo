# Backend – Sistem Penjualan Jamur Lingzhi & Data Ternak (Desa Dlingo)

Node.js + Express + MySQL. Skema mengikuti RAT pada dokumen capstone (`database.sql`).

## Menjalankan
```bash
cp .env.example .env      # isi DB_PASSWORD dan JWT_SECRET
mysql -u root -p < database.sql
npm install && npm start
```
Akun seed (password `admin123`): `admin`, `budi_petani`, `sari_petani`, `andi_pembeli`.

## Endpoint (prefix `/api`, Bearer token kecuali ditandai publik)
| Modul | Endpoint | Peran |
|---|---|---|
| Auth | `POST /auth/register` (publik, pembeli), `POST /auth/login` (publik), `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` | semua |
| Produk | `GET /products`, `/products/:id`, `/products/categories` (publik) | – |
| | `GET /products/manage`, `POST/PUT/DELETE /products[/:id]` (multipart, field `gambar`), `PATCH /products/:id/stok` | petani, admin |
| Pesanan | `GET /orders`, `GET /orders/:id` (termasuk rekening petani) | sesuai pemilik |
| | `POST /orders` (`items[{id_produk,jumlah}]`, `alamat_kirim`, `catatan`; petani/admin tambah `id_pembeli`) | pembeli, petani, admin |
| | `PUT /orders/:id/status` (menunggu, dikonfirmasi, diproses, dikirim, selesai, dibatalkan; batal = stok kembali) | petani, admin |
| Pembeli | `/pembeli` CRUD | petani, admin |
| Ternak | `/ternak` CRUD (alias `/livestock`), `POST/PUT/DELETE /ternak/:id/pengurus[/:idPengurus]` untuk kontrak | petani, admin |
| Pengurus | `/pengurus` CRUD | petani, admin |
| User | `/users` CRUD, `GET /users/dashboard/stats` | admin (stats: semua) |

Ekstensi di luar skema dokumen: `user.no_rekening`, `user.nama_bank` (FR-07), `product.gambar`.
