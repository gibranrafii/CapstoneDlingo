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

    public function test_staff_cannot_change_linked_account_identity_but_can_edit_the_address(): void
    {
        $buyer = Buyer::find(1);
        $accountEmail = User::find(3)->email;
        $original = $buyer->only(['nama_pembeli', 'email_pembeli', 'no_telepon_pembeli']);
        $this->actingAs(User::find(2))->get('/admin/buyers')->assertOk()->assertSee('linked-buyer-note');
        foreach (['nama_pembeli' => 'Different name', 'email_pembeli' => 'different@example.test', 'no_telepon_pembeli' => '0812999'] as $field => $value) {
            $this->put('/admin/buyers/1', array_replace($original, [$field => $value]))->assertSessionHasErrors($field);
            $this->assertSame($original, $buyer->fresh()->only(array_keys($original)));
        }
        $this->put('/admin/buyers/1', $original + ['alamat_pembeli' => 'Alamat baru'])->assertRedirect();
        $this->assertSame('Alamat baru', $buyer->fresh()->alamat_pembeli);
        $this->assertSame($accountEmail, User::find(3)->email);
    }
}
