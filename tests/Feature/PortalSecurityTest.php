<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class PortalSecurityTest extends TestCase
{
    use DatabaseTransactions;

    public function test_credentials_are_restricted_to_their_login_portal(): void
    {
        $this->post('/login', ['username' => 'petani', 'password' => 'demo12345'])->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->post('/admin/login', ['username' => 'pembeli', 'password' => 'demo12345'])->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->post('/admin/login', ['username' => 'petani', 'password' => 'demo12345', 'remember' => 1])
            ->assertRedirect('/admin')->assertCookieMissing(Auth::getRecallerName());
        $this->assertAuthenticatedAs(User::find(2));
    }

    public function test_intended_redirect_cannot_leave_the_site_or_cross_portals(): void
    {
        foreach (['https://evil.example/admin', url('/admin/users'), '//evil.example/cart'] as $target) {
            $this->withSession(['url.intended' => $target])->post('/login', ['username' => 'pembeli', 'password' => 'demo12345'])
                ->assertRedirect('/dashboard/pembeli');
            Auth::logout();
        }
        $this->withSession(['url.intended' => url('/cart')])->post('/login', ['username' => 'pembeli', 'password' => 'demo12345'])->assertRedirect('/cart');
    }

    public function test_staff_idle_sessions_expire_and_buyers_cannot_enter_management(): void
    {
        $this->actingAs(User::find(2))->withSession(['security.user_id' => 2, 'security.last_active' => time() - 1801])
            ->get('/admin')->assertRedirect('/admin/login');
        $this->assertGuest();
        $this->actingAs(User::find(3))->get('/admin')->assertForbidden();
        $this->get('/admin/products')->assertForbidden();
        $this->post('/admin/products', [])->assertForbidden();
        $this->put('/admin/products/1', [])->assertForbidden();
        $this->delete('/admin/products/1')->assertForbidden();
    }

    public function test_legacy_gets_redirect_but_writes_are_not_replayed(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->actingAs(User::find(2))->get('/manage/products')->assertRedirect('/admin/products');
        $this->get('/profile')->assertRedirect('/admin/profile');
        $this->get('/orders/1')->assertRedirect('/admin/orders/1');
        $this->post('/manage/products')->assertMethodNotAllowed();
    }

    public function test_privileged_mutations_require_the_administrators_password(): void
    {
        $this->actingAs(User::find(1))->post('/admin/farm/settings', [])->assertSessionHasErrors('current_password');
        $this->post('/admin/users', [])->assertSessionHasErrors('current_password');
        $this->put('/admin/users/2', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->delete('/admin/users/2')->assertSessionHasErrors('current_password');
        $this->assertTrue(User::find(2)->is_active);
    }

    public function test_new_passwords_reject_short_and_overlong_utf8_values(): void
    {
        $base = ['nama' => 'Test', 'username' => 'policy-test', 'email' => 'policy@example.test'];
        foreach (['short', str_repeat('é', 37)] as $password) {
            $this->post('/register', $base + ['password' => $password, 'password_confirmation' => $password])->assertSessionHasErrors('password');
        }
    }
}
