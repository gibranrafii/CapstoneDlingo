<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class OrdersTest extends TestCase
{
    use DatabaseTransactions;

    public function test_orders_use_server_prices_and_cancellation_restores_stock_once(): void
    {
        $this->actingAs(User::find(2))->get('/admin/orders')->assertOk();
        $this->post('/admin/orders', ['id_pembeli' => 1, 'alamat_kirim' => 'Desa Dlingo', 'items' => [1 => 2], 'total_harga' => 1])->assertRedirect();
        $order = Order::latest('id_pesanan')->firstOrFail();
        $this->assertEquals(30000, $order->total_harga);
        $this->assertSame(23, Product::find(1)->stok);
        Product::find(1)->update(['harga' => 99999]);
        $this->get('/admin/orders/'.$order->id_pesanan)->assertOk()->assertSee('Rp 30.000');
        $this->delete('/admin/products/1')->assertSessionHas('error');
        $this->actingAs(User::find(3))->delete('/orders/'.$order->id_pesanan)->assertRedirect();
        $this->assertSame(25, Product::find(1)->stok);
        $this->delete('/orders/'.$order->id_pesanan)->assertSessionHasErrors('status');
        $this->assertSame(25, Product::find(1)->stok);
    }

    public function test_other_buyers_cannot_view_or_cancel_an_order(): void
    {
        $order = app(OrderService::class)->create(User::find(2), 1, [1 => 1], 'Dlingo');
        $other = User::create(['username' => 'other', 'nama' => 'Lain', 'email' => 'other@example.test', 'password' => 'password12345', 'role' => 'pembeli', 'is_active' => true]);
        $this->actingAs($other)->get('/admin/orders/'.$order->id_pesanan)->assertForbidden();
        $this->delete('/orders/'.$order->id_pesanan)->assertForbidden();
    }

    public function test_insufficient_stock_rolls_back_the_whole_order(): void
    {
        $this->actingAs(User::find(2))->post('/admin/orders', ['id_pembeli' => 1, 'alamat_kirim' => 'Dlingo', 'items' => [1 => 1, 2 => 999]])->assertSessionHasErrors('items');
        $this->assertSame(0, Order::count());
        $this->assertSame(25, Product::find(1)->stok);
    }

    public function test_statuses_follow_the_order_workflow(): void
    {
        $service = app(OrderService::class);
        $actor = User::find(2);
        $order = $service->create($actor, 1, [1 => 1], 'Dlingo');
        foreach (['dikonfirmasi', 'diproses', 'dikirim', 'selesai'] as $status) {
            $service->transition($actor, $order->id_pesanan, $status);
        }
        $this->assertSame('selesai', $order->fresh()->status);
        $this->assertSame(24, Product::find(1)->stok);
    }
}
