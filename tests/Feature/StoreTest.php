<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\Product;
use Illuminate\Foundation\Testing\DatabaseTransactions;
class StoreTest extends TestCase {
    use DatabaseTransactions;
    public function test_public_catalog_filters_and_sorts_database_products():void {
        $this->get('/')->assertOk()->assertSee('Jamur Tiram')->assertSee('Baglog Tiram');
        $this->get('/?q=Kuping')->assertOk()->assertSee('Jamur Kuping')->assertDontSee('Jamur Tiram');
        $this->get('/?category=Baglog')->assertSee('Baglog Tiram')->assertDontSee('Jamur Kuping');
        $this->get('/?sort=price-high')->assertSeeInOrder(['Jamur Kuping','Jamur Tiram','Baglog Tiram']);
        Product::find(1)->update(['stok'=>0]);$this->get('/')->assertSee('Stok: 0');
    }
}
