<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
class BuyerOrdersTest extends TestCase {
    use DatabaseTransactions;
    public function test_order_list_is_private_and_filterable():void {
        $s=app(OrderService::class);$mine=$s->create(User::find(2),1,[1=>2],'Dlingo');$s->create(User::find(2),2,[2=>1],'Lain');
        $this->actingAs(User::find(3))->get('/orders')->assertOk()->assertSee('Jamur Tiram × 2')->assertDontSee('Jamur Kuping')->assertViewHas('orders',fn($o)=>$o->count()===1);
        $this->get('/orders?status=selesai')->assertOk()->assertSee('Tidak Ada Pesanan dengan Status Ini');
        $this->delete('/orders/'.$mine->id_pesanan)->assertRedirect('/orders');$this->get('/orders?status=dibatalkan')->assertOk()->assertSee('Dibatalkan')->assertDontSee('data-open="cancel-',false);
    }
}
