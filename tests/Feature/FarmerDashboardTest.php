<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class FarmerDashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_shared_dashboard_counts_only_completed_revenue(): void
    {
        $order = app(OrderService::class)->create(User::find(2), 1, [1 => 1], 'Dlingo');
        $this->actingAs(User::find(2))->get('/dashboard/petani')->assertOk()->assertSee('Total Ternak')->assertViewHas('orders', fn ($metrics) => (float) $metrics->income === 0.0)->assertViewHas('pendingOrders', 1);
        $order->update(['status' => 'selesai']);
        $this->get('/dashboard/petani')->assertViewHas('orders', fn ($metrics) => (float) $metrics->income === 15000.0);
        $this->actingAs(User::find(3))->get('/dashboard/petani')->assertForbidden();
    }
}
