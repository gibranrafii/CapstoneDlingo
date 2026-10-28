<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProductsTest extends TestCase
{
    use DatabaseTransactions;

    private function data(): array
    {
        return ['nama_produk' => 'Lingzhi Uji', 'kategori' => 'Jamur', 'harga' => '25000', 'satuan' => 'kg', 'stok' => 12];
    }

    public function test_shared_staff_can_manage_products_and_changes_persist(): void
    {
        $this->actingAs(User::find(2))->get('/admin/products')->assertOk()->assertSee('183');
        $this->post('/admin/products', $this->data())->assertRedirect('/admin/products');
        $p = Product::whereNamaProduk('Lingzhi Uji')->firstOrFail();
        $this->actingAs(User::find(1))->put('/admin/products/'.$p->id_produk, array_replace($this->data(), ['stok' => 8]))->assertRedirect();
        $this->assertSame(8, $p->fresh()->stok);
        $this->delete('/admin/products/'.$p->id_produk)->assertRedirect();
        $this->assertNull($p->fresh());
    }

    public function test_buyers_cannot_manage_stock_and_negative_stock_is_rejected(): void
    {
        $this->actingAs(User::find(3))->post('/admin/products', $this->data())->assertForbidden();
        $this->actingAs(User::find(2))->post('/admin/products', array_replace($this->data(), ['stok' => -1]))->assertSessionHasErrors('stok');
    }
}
