<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BuyerDashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_buyer_dashboard_shows_only_linked_orders_including_staff_created_orders(): void
    {
        $s = app(OrderService::class);
        $own = $s->create(User::find(2), 1, [1 => 1], 'Dlingo');
        $s->create(User::find(2), 2, [2 => 1], 'Lain');
        $this->actingAs(User::find(3))->get('/dashboard/pembeli')->assertOk()->assertSee('Rp 15.000')->assertDontSee('Rp 20.000')->assertSee(route('orders.show', $own->id_pesanan), false);
        $this->actingAs(User::find(2))->get('/dashboard/pembeli')->assertForbidden();
    }
}
