<?php

namespace Tests\Feature;

use App\Models\Buyer;
use App\Models\Caretaker;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UsersTest extends TestCase
{
    use DatabaseTransactions;

    private function data($role = 'petani')
    {
        return ['current_password' => 'demo12345', 'nama' => 'Baru', 'username' => 'baru', 'email' => 'baru@example.test', 'role' => $role, 'password' => 'password12345'];
    }

    public function test_only_admin_can_manage_accounts_and_staff_is_not_a_caretaker(): void
    {
        $this->actingAs(User::find(2))->get('/admin/users')->assertForbidden();
        $this->post('/admin/users', $this->data())->assertForbidden();
        $this->actingAs(User::find(1))->get('/admin/users')->assertOk();
        $this->post('/admin/users', $this->data())->assertRedirect();
        $this->assertDatabaseHas('user', ['username' => 'baru', 'role' => 'petani']);
        $this->assertSame(3, Caretaker::count());
        $this->delete('/admin/users/2', ['current_password' => 'demo12345'])->assertRedirect();
        $this->assertFalse(User::find(2)->is_active);
        $this->assertDatabaseHas('product', ['id_user' => 2]);
    }

    public function test_buyer_accounts_are_linked_and_admin_cannot_demote_or_disable_self(): void
    {
        $this->actingAs(User::find(1))->post('/admin/users', $this->data('pembeli'))->assertRedirect();
        $user = User::whereUsername('baru')->firstOrFail();
        $this->assertSame($user->id_user, Buyer::whereAccountUserId($user->id_user)->value('account_user_id'));
        $this->delete('/admin/users/1', ['current_password' => 'demo12345'])->assertSessionHas('error');
        $this->assertTrue(User::find(1)->is_active);
        $this->put('/admin/users/1', array_merge($this->data(), ['username' => 'superadmin', 'email' => 'admin@dlingo.test', 'role' => 'petani']))->assertSessionHasErrors('role');
        $this->assertSame('admin', User::find(1)->role);
    }

    public function test_editing_a_linked_buyer_keeps_the_original_contact_creator(): void
    {
        $this->actingAs(User::find(1))->put('/admin/users/3', ['current_password' => 'demo12345', 'nama' => 'Andi Updated', 'username' => 'pembeli', 'email' => 'andi@dlingo.test', 'role' => 'pembeli'])->assertRedirect();
        $this->assertSame(2, Buyer::find(1)->id_user);
        $this->assertSame('Andi Updated', Buyer::find(1)->nama_pembeli);
    }
}
