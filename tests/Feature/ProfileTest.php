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
        return ['username' => 'admin', 'nama' => 'Budi Uji', 'email' => 'budi@example.com', 'no_telepon' => '0812345'];
    }

    public function test_profile_updates_persist_without_changing_role(): void
    {
        $this->actingAs(User::find(2))->get('/profile')->assertOk()->assertSee('Budi Santoso');
        $this->put('/profile', $this->fields() + ['role' => 'admin'])->assertRedirect('/profile');
        $this->assertSame('Budi Uji', User::find(2)->nama);
        $this->assertSame('petani', User::find(2)->role);
    }

    public function test_password_changes_require_current_password_and_confirmation(): void
    {
        $this->actingAs(User::find(2))->put('/profile', $this->fields() + ['password' => 'newpassword123', 'password_confirmation' => 'newpassword123'])->assertSessionHasErrors('current_password');
        $this->put('/profile', $this->fields() + ['password' => 'newpassword123', 'password_confirmation' => 'newpassword123', 'current_password' => 'demo12345'])->assertRedirect();
        $this->assertTrue(password_verify('newpassword123', User::find(2)->password));
    }

    public function test_only_administrators_can_change_shared_bank_details(): void
    {
        $data = ['nama' => 'JamurTani Desa Dlingo', 'nama_bank' => 'BNI', 'no_rekening' => '12345', 'atas_nama' => 'Kelompok Dlingo'];
        $this->actingAs(User::find(2))->post('/farm/settings', $data)->assertForbidden();
        $this->actingAs(User::find(1))->post('/farm/settings', $data)->assertRedirect();
        $this->assertSame('BNI', FarmSetting::find(1)->nama_bank);
    }
}
