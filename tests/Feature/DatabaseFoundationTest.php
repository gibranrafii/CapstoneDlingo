<?php
namespace Tests\Feature;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\{Product,User};
class DatabaseFoundationTest extends TestCase {
    use DatabaseTransactions;
    public function test_existing_schema_and_composite_keys_are_preserved(): void {
        $keys=DB::select("SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='detail_pesanan' AND CONSTRAINT_NAME='PRIMARY' ORDER BY ORDINAL_POSITION");
        $this->assertSame(['id_pesanan','id_produk'],array_column($keys,'COLUMN_NAME'));
        $this->assertSame(3,Product::count());$this->assertEquals(183,Product::sum('stok'));
        $this->assertTrue(password_verify('demo12345',User::findOrFail(2)->password));
    }
    public function test_adoption_is_idempotent(): void {
        $before=DB::table('migrations')->count();$this->artisan('app:adopt-database')->assertSuccessful();$this->assertSame($before,DB::table('migrations')->count());
    }
}
