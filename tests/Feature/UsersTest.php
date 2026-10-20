<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\{Buyer,Caretaker,User};
use Illuminate\Foundation\Testing\DatabaseTransactions;
class UsersTest extends TestCase {
    use DatabaseTransactions;
    private function data($role='petani'){return ['nama'=>'Baru','username'=>'baru','email'=>'baru@example.test','role'=>$role,'password'=>'password123'];}
    public function test_only_admin_can_manage_accounts_and_staff_is_not_a_caretaker():void {
        $this->actingAs(User::find(2))->get('/admin/users')->assertForbidden();$this->post('/admin/users',$this->data())->assertForbidden();
        $this->actingAs(User::find(1))->get('/admin/users')->assertOk();$this->post('/admin/users',$this->data())->assertRedirect();
        $this->assertDatabaseHas('user',['username'=>'baru','role'=>'petani']);$this->assertSame(3,Caretaker::count());
        $this->delete('/admin/users/2')->assertRedirect();$this->assertFalse(User::find(2)->is_active);$this->assertDatabaseHas('product',['id_user'=>2]);
    }
    public function test_buyer_accounts_are_linked_and_admin_cannot_demote_or_disable_self():void {
        $this->actingAs(User::find(1))->post('/admin/users',$this->data('pembeli'))->assertRedirect();$user=User::whereUsername('baru')->firstOrFail();$this->assertSame($user->id_user,Buyer::whereAccountUserId($user->id_user)->value('account_user_id'));
        $this->delete('/admin/users/1')->assertSessionHas('error');$this->assertTrue(User::find(1)->is_active);
        $this->put('/admin/users/1',array_merge($this->data(),['username'=>'superadmin','email'=>'admin@dlingo.test','role'=>'petani']))->assertSessionHasErrors('role');$this->assertSame('admin',User::find(1)->role);
    }
}
