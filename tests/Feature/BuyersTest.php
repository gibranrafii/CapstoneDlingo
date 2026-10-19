<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\{Buyer,User};
use Illuminate\Foundation\Testing\DatabaseTransactions;
class BuyersTest extends TestCase {
    use DatabaseTransactions;
    public function test_contacts_can_be_managed_without_granting_login_access():void{
        $this->actingAs(User::find(2))->get('/manage/buyers')->assertOk();$this->post('/manage/buyers',['nama_pembeli'=>'Toko Uji'])->assertRedirect();
        $b=Buyer::whereNamaPembeli('Toko Uji')->firstOrFail();$this->assertNull($b->account_user_id);
        $this->put('/manage/buyers/'.$b->id_pembeli,['nama_pembeli'=>'Toko Uji Baru'])->assertRedirect();$this->assertSame('Toko Uji Baru',$b->fresh()->nama_pembeli);
        $this->delete('/manage/buyers/'.$b->id_pembeli)->assertRedirect();$this->assertNull($b->fresh());
        $this->delete('/manage/buyers/1')->assertSessionHas('error');$this->assertNotNull(Buyer::find(1));
    }
}
