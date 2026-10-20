<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['user', 'pembeli', 'product', 'ternak', 'pengurus', 'pengurus_ternak', 'pesanan', 'detail_pesanan'] as $table) {
            if (DB::table($table)->exists()) {
                $this->command?->warn('Reference seeding skipped: domain data already exists.');

                return;
            }
        }
        $data = json_decode(file_get_contents(__DIR__.'/reference-data.json'), true, flags: JSON_THROW_ON_ERROR);
        $id = fn ($code) => (int) substr($code, strpos($code, '-') + 1);
        $date = '2026-07-02 08:00:00';
        DB::transaction(function () use ($data, $id, $date) {
            $password = Hash::make('demo12345');
            foreach ($data['users'] as $u) {
                DB::table('user')->insert(['id_user' => $id($u['id']), 'username' => $u['username'], 'nama' => $u['nama'], 'email' => $u['email'], 'no_telepon' => $u['no_telepon'], 'role' => $u['role'], 'password' => $password, 'is_active' => true, 'created_at' => $date, 'updated_at' => now()->subHours(9)]);
            }
            foreach ($data['buyers'] as $b) {
                DB::table('pembeli')->insert(['id_pembeli' => $id($b['id']), 'id_user' => 2, 'account_user_id' => $b['id'] === 'PBL-001' ? 3 : null, 'nama_pembeli' => $b['nama'], 'email_pembeli' => $b['email'] ?: null, 'no_telepon_pembeli' => $b['no_telepon'], 'alamat_pembeli' => $b['alamat'], 'created_at' => $date, 'updated_at' => $date]);
            }
            foreach ($data['products'] as $p) {
                DB::table('product')->insert(['id_produk' => $id($p['id']), 'id_user' => 2, 'nama_produk' => $p['nama'], 'deskripsi' => $p['deskripsi'], 'harga' => $p['harga'], 'satuan' => $p['satuan'], 'kategori' => $p['kategori'], 'stok' => $p['stok'], 'created_at' => $date, 'updated_at' => $date]);
            }
            foreach ($data['staff'] as $s) {
                DB::table('pengurus')->insert(['id_pengurus' => $id($s['id']), 'id_user' => 2, 'nama_pengurus' => $s['nama'], 'no_telepon_pengurus' => $s['no_telepon'], 'email_pengurus' => $s['email'] ?: null, 'alamat_pengurus' => $s['alamat'], 'is_active' => true, 'created_at' => $date, 'updated_at' => $date]);
            }
            foreach ($data['livestock'] as $l) {
                DB::table('ternak')->insert(['id_ternak' => $id($l['id']), 'id_user' => 2, 'nama_ternak' => $l['nama'], 'nomor_ternak' => $l['nomor'], 'kategori_ternak' => $l['kategori'], 'usia_ternak' => $l['usia'], 'berat_ternak' => $l['berat'], 'harga_ternak' => $l['harga'], 'created_at' => $date, 'updated_at' => $date]);
                foreach ($l['staffIds'] as $staff) {
                    DB::table('pengurus_ternak')->insert(['id_pengurus' => $id($staff), 'id_ternak' => $id($l['id']), 'waktu_kontrak_awal' => $date, 'status_kontrak' => 'aktif', 'created_at' => $date, 'updated_at' => $date]);
                }
            }
            DB::table('farm_settings')->updateOrInsert(['id' => 1], ['nama' => 'JamurTani Desa Dlingo', 'alamat' => 'Desa Dlingo, Imogiri', 'no_telepon' => '0812-3456-7890', 'nama_bank' => 'BRI', 'no_rekening' => '1234567890', 'atas_nama' => 'Budi Santoso', 'created_at' => now(), 'updated_at' => now()]);
            DB::table('activity_logs')->insert(['user_id' => 2, 'actor' => 'Budi Santoso', 'category' => 'Ternak', 'message' => 'Ternak Sapi Limosingffggf diubah', 'created_at' => now()->subHours(9)]);
        });
    }
}
