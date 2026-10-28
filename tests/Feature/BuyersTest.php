<?php

namespace Tests\Feature;

use App\Models\Buyer;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BuyersTest extends TestCase
{
    use DatabaseTransactions;

    public function test_contacts_can_be_managed_without_granting_login_access(): void
    {
        $this->actingAs(User::find(2))->get('/admin/buyers')->assertOk();
        $this->post('/admin/buyers', ['nama_pembeli' => 'Toko Uji'])->assertRedirect();
        $b = Buyer::whereNamaPembeli('Toko Uji')->firstOrFail();
        $this->assertNull($b->account_user_id);
        $this->put('/admin/buyers/'.$b->id_pembeli, ['nama_pembeli' => 'Toko Uji Baru'])->assertRedirect();
        $this->assertSame('Toko Uji Baru', $b->fresh()->nama_pembeli);
        $this->delete('/admin/buyers/'.$b->id_pembeli)->assertRedirect();
        $this->assertNull($b->fresh());
        $this->delete('/admin/buyers/1')->assertSessionHas('error');
        $this->assertNotNull(Buyer::find(1));
    }
}
