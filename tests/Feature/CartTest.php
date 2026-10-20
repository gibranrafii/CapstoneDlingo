<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CartTest extends TestCase
{
    use DatabaseTransactions;

    public function test_checkout_uses_current_prices_clears_cart_and_cannot_repeat(): void
    {
        $this->actingAs(User::find(3))->post('/cart/1', ['quantity' => 2])->assertRedirect();
        Product::find(1)->update(['harga' => 17000]);
        $this->get('/cart')->assertOk()->assertSee('Rp 34.000');
        $this->post('/checkout', ['_modal' => 'checkout', 'alamat_kirim' => 'Dlingo', 'total' => 1, 'id_pembeli' => 2])->assertRedirect();
        $order = Order::firstOrFail();
        $this->assertEquals(34000, $order->total_harga);
        $this->assertSame(1, $order->id_pembeli);
        $this->assertSame(23, Product::find(1)->stok);
        $this->get('/cart')->assertSee('Keranjang Anda Kosong');
        $this->post('/checkout', ['alamat_kirim' => 'Dlingo'])->assertSessionHasErrors('items');
        $this->assertSame(1, Order::count());
    }

    public function test_stock_changes_do_not_clear_cart_on_failed_checkout(): void
    {
        $this->actingAs(User::find(3))->post('/cart/1', ['quantity' => 2]);
        Product::find(1)->update(['stok' => 1]);
        $this->post('/checkout', ['alamat_kirim' => 'Dlingo'])->assertSessionHasErrors('items');
        $this->assertSame(0, Order::count());
        $this->get('/cart')->assertSee('Kurangi jumlah');
        $this->patch('/cart/1', ['quantity' => 0])->assertRedirect();
        $this->get('/cart')->assertSee('Keranjang Anda Kosong');
        $this->actingAs(User::find(2))->post('/cart/1', ['quantity' => 1])->assertForbidden();
    }
}
