<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class NavigationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_staff_navigation_exposes_only_permitted_tools(): void
    {
        $this->actingAs(User::find(2))->get('/admin/stock')->assertOk()
            ->assertSee('class="sidebar"', false)->assertSee('id="staff-more"', false)
            ->assertSee(route('manage.caretakers.index'), false)->assertDontSee(route('admin.users.index'), false);
        $this->actingAs(User::find(1))->get('/admin')->assertOk()->assertSee(route('admin.users.index'), false);
        $this->actingAs(User::find(3))->get('/profile')->assertOk()->assertDontSee('class="sidebar"', false)
            ->assertDontSee('id="staff-more"', false)->assertDontSee(route('manage.products.index'), false);
    }

    public function test_guest_can_browse_without_receiving_staff_actions(): void
    {
        $this->get('/')->assertOk()->assertSee('Navigasi seluler')->assertSee(route('register'), false)
            ->assertDontSee('class="sidebar"', false)->assertDontSee(route('manage.products.index'), false);
        $this->get('/cart')->assertRedirect(route('login'));
    }

    public function test_staff_dashboard_uses_current_low_stock_and_latest_five_orders(): void
    {
        Product::find(1)->update(['stok' => 15]);
        Product::find(2)->update(['stok' => 10]);
        $service = app(OrderService::class);
        $ids = [];
        for ($i = 0; $i < 6; $i++) {
            $ids[] = $service->create(User::find(2), 1, [1 => 1], 'Dlingo')->id_pesanan;
        }
        $expected = array_reverse(array_slice($ids, 1));
        $this->actingAs(User::find(2))->get('/admin')->assertOk()
            ->assertViewHas('recentOrders', fn ($orders) => $orders->modelKeys() === $expected)
            ->assertViewHas('lowStock', fn ($products) => $products->modelKeys() === [1])
            ->assertViewHas('pendingOrders', 6);
    }
}
