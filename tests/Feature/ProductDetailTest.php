<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseTransactions;
class ProductDetailTest extends TestCase {
    use DatabaseTransactions;
    public function test_public_product_detail_uses_shared_bank_and_escapes_content():void {
        $this->get('/products/1')->assertOk()->assertSee('Jamur Tiram')->assertSee('1234567890');
        Product::find(1)->update(['deskripsi'=>'<script>alert(1)</script>','stok'=>0]);$this->get('/products/1')->assertSee('Stok Habis')->assertSee('&lt;script&gt;',false)->assertDontSee('<script>alert(1)</script>',false);
        $this->get('/products/999999')->assertNotFound();
    }
}
