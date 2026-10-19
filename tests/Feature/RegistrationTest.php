<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\{User,Buyer};
use Illuminate\Foundation\Testing\DatabaseTransactions;
class RegistrationTest extends TestCase {
    use DatabaseTransactions;
    private function data():array{return ['nama'=>'Pembeli Baru','username'=>'baru','email'=>'baru@example.test','password'=>'password123','password_confirmation'=>'password123','alamat'=>'Desa Dlingo'];}
    public function test_registration_creates_a_linked_buyer_and_session():void{
        $this->get('/register')->assertOk();$this->post('/register',$this->data())->assertRedirect('/dashboard');$u=User::whereUsername('baru')->firstOrFail();$this->assertSame('pembeli',$u->role);$this->assertAuthenticatedAs($u);$this->assertSame($u->id_user,Buyer::whereAccountUserId($u->id_user)->value('id_user'));
    }
    public function test_public_registration_cannot_create_staff_or_duplicate_accounts():void{
        $this->post('/register',$this->data()+['role'=>'admin'])->assertSessionHasErrors('role');$this->assertGuest();
        $d=$this->data();$d['username']='admin';$this->post('/register',$d)->assertSessionHasErrors('username');
    }
}
