<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user', function (Blueprint $t) {
            $t->rememberToken();
            $t->boolean('is_active')->default(true);
        });
        Schema::table('pembeli', function (Blueprint $t) {
            $t->integer('account_user_id')->nullable()->unique();
            $t->foreign('account_user_id')->references('id_user')->on('user')->nullOnDelete();
        });
        Schema::table('product', fn (Blueprint $t) => $t->string('gambar')->nullable());
        Schema::table('pengurus', function (Blueprint $t) {
            $t->boolean('is_active')->default(true);
            $t->softDeletes();
        });
        Schema::table('ternak', fn (Blueprint $t) => $t->softDeletes());
        Schema::table('pengurus_ternak', function (Blueprint $t) {
            $t->dateTime('waktu_kontrak_awal', 6)->change();
            $t->dateTime('waktu_kontrak_akhir', 6)->nullable()->change();
        });
        Schema::table('pesanan', function (Blueprint $t) {
            $t->integer('created_by')->nullable();
            $t->foreign('created_by')->references('id_user')->on('user')->nullOnDelete();
        });
        Schema::table('detail_pesanan', function (Blueprint $t) {
            $t->string('nama_produk')->nullable();
            $t->string('satuan')->nullable();
        });
        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->integer('user_id')->nullable()->index();
            $t->string('ip_address', 45)->nullable();
            $t->text('user_agent')->nullable();
            $t->longText('payload');
            $t->integer('last_activity')->index();
        });
        Schema::create('farm_settings', function (Blueprint $t) {
            $t->unsignedInteger('id')->primary();
            $t->string('nama')->default('JamurTani Desa Dlingo');
            $t->string('alamat')->nullable();
            $t->string('no_telepon')->nullable();
            $t->string('nama_bank')->nullable();
            $t->string('no_rekening')->nullable();
            $t->string('atas_nama')->nullable();
            $t->timestamps();
        });
        Schema::create('activity_logs', function (Blueprint $t) {
            $t->id();
            $t->integer('user_id')->nullable();
            $t->foreign('user_id')->references('id_user')->on('user')->nullOnDelete();
            $t->string('actor');
            $t->string('category', 50);
            $t->string('message');
            $t->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('farm_settings');
        Schema::dropIfExists('sessions');
        Schema::table('detail_pesanan', fn (Blueprint $t) => $t->dropColumn(['nama_produk', 'satuan']));
        Schema::table('pesanan', function (Blueprint $t) {
            $t->dropForeign(['created_by']);
            $t->dropColumn('created_by');
        });
        Schema::table('pengurus', fn (Blueprint $t) => $t->dropColumn(['is_active', 'deleted_at']));
        Schema::table('ternak', fn (Blueprint $t) => $t->dropColumn('deleted_at'));
        Schema::table('product', fn (Blueprint $t) => $t->dropColumn('gambar'));
        Schema::table('pembeli', function (Blueprint $t) {
            $t->dropForeign(['account_user_id']);
            $t->dropColumn('account_user_id');
        });
        Schema::table('user', fn (Blueprint $t) => $t->dropColumn(['remember_token', 'is_active']));
    }
};
