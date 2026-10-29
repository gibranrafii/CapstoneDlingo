<?php

namespace Tests\Feature;

use App\Models\FarmSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use DatabaseTransactions;

    private function fields(): array
    {
        return ['username' => 'petani', 'nama' => 'Budi Uji', 'email' => 'budi@example.com', 'no_telepon' => '0812345'];
    }

    public function test_profile_updates_persist_without_changing_role(): void
    {
        $this->actingAs(User::find(2))->get('/admin/profile')->assertOk()->assertSee('Budi Santoso');
        $this->put('/admin/profile', $this->fields() + ['role' => 'admin'])->assertRedirect('/admin/profile');
        $this->assertSame('Budi Uji', User::find(2)->nama);
        $this->assertSame('petani', User::find(2)->role);
    }

    public function test_password_changes_require_current_password_and_confirmation(): void
    {
        $this->actingAs(User::find(2))->put('/admin/profile', $this->fields() + ['password' => 'newpassword12345', 'password_confirmation' => 'newpassword12345'])->assertSessionHasErrors('current_password');
        $this->put('/admin/profile', $this->fields() + ['password' => 'newpassword12345', 'password_confirmation' => 'newpassword12345', 'current_password' => 'demo12345'])->assertRedirect();
        $this->assertTrue(password_verify('newpassword12345', User::find(2)->password));
    }

    public function test_only_administrators_can_change_shared_bank_details(): void
    {
        $data = ['current_password' => 'demo12345', 'nama' => 'JamurTani Desa Dlingo', 'nama_bank' => 'BNI', 'no_rekening' => '12345', 'atas_nama' => 'Kelompok Dlingo'];
        $this->actingAs(User::find(2))->post('/admin/farm/settings', $data)->assertForbidden();
        $this->actingAs(User::find(1))->post('/admin/farm/settings', $data)->assertRedirect();
        $this->assertSame('BNI', FarmSetting::find(1)->nama_bank);
    }

    public function test_checkout_verification_banner_is_only_shown_to_unverified_buyers(): void
    {
        User::whereIn('id_user', [1, 2, 3])->update(['email_verified_at' => null]);
        foreach ([1, 2] as $id) {
            $this->actingAs(User::find($id))->get('/admin/profile')->assertOk()->assertDontSee('Verifikasi email sebelum membuat pesanan.');
        }
        $this->actingAs(User::find(3))->get('/profile')->assertOk()->assertSee('Verifikasi email sebelum membuat pesanan.');
        User::find(3)->update(['email_verified_at' => now()]);
        $this->actingAs(User::find(3))->get('/profile')->assertOk()->assertDontSee('Verifikasi email sebelum membuat pesanan.');
    }
}
