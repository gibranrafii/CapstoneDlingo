<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['user', 'pembeli', 'product', 'ternak', 'pengurus', 'pengurus_ternak', 'pesanan', 'detail_pesanan'] as $table) {
            if (Schema::hasTable($table)) {
                throw new RuntimeException('Existing domain tables detected. Run php artisan app:adopt-database first.');
            }
        }
        DB::unprepared(file_get_contents(database_path('schema/dlingo-baseline.sql')));
    }

    public function down(): void
    {
        throw new RuntimeException('The adopted schema baseline is protected. Use a dedicated test database for fresh resets.');
    }
};
