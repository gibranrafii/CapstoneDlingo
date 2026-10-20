<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
class FarmerDashboardTest extends TestCase {
    use DatabaseTransactions;
    public function test_shared_dashboard_counts_only_completed_revenue():void {
        $order=app(OrderService::class)->create(User::find(2),1,[1=>1],'Dlingo');
        $this->actingAs(User::find(2))->get('/dashboard/petani')->assertOk()->assertSee('Total Ternak')->assertSee('Rp 0')->assertDontSee('Rp 15.000');
        $order->update(['status'=>'selesai']);
        $this->get('/dashboard/petani')->assertSee('Rp 15.000');
        $this->actingAs(User::find(3))->get('/dashboard/petani')->assertForbidden();
    }
}
