<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use DatabaseTransactions;

    public function test_login_page_shows_brand_and_posts_to_laravel(): void
    {
        $this->get('/login')->assertOk()->assertSee('Masuk ke JamurTani')->assertSee('name="_token"', false);
    }

    public function test_username_and_email_logins_authenticate_real_accounts(): void
    {
        foreach (['admin', 'budi@example.com'] as $identity) {
            $this->post('/login', ['username' => $identity, 'password' => 'demo12345', 'remember' => 1])->assertRedirect('/dashboard');
            $this->assertAuthenticatedAs(User::find(2));
            auth()->logout();
        }
    }

    public function test_wrong_password_and_disabled_accounts_cannot_login(): void
    {
        $this->post('/login', ['username' => 'admin', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->assertGuest();
        User::find(2)->update(['is_active' => false]);
        $this->post('/login', ['username' => 'admin', 'password' => 'demo12345'])->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_logout_invalidates_authentication(): void
    {
        $this->actingAs(User::find(2))->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }
}
