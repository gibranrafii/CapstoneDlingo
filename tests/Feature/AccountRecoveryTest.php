<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AccountRecoveryTest extends TestCase
{
    use DatabaseTransactions;

    public function test_registration_sends_verification_and_cannot_checkout_until_verified(): void
    {
        Notification::fake();
        $this->post('/register', ['nama' => 'Verified Buyer', 'username' => 'verifiedbuyer', 'email' => 'verified@example.test', 'password' => 'password12345', 'password_confirmation' => 'password12345'])->assertRedirect('/dashboard');
        $user = User::whereUsername('verifiedbuyer')->firstOrFail();
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->get('/profile')->assertOk();
        $this->post('/cart/1', ['quantity' => 1])->assertRedirect();
        $this->post('/checkout', ['alamat_kirim' => 'Dlingo'])->assertRedirect('/email/verify');
        $link = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id_user, 'hash' => sha1($user->email)]);
        $this->get($link)->assertRedirect('/dashboard');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->post('/checkout', ['alamat_kirim' => 'Dlingo'])->assertRedirect();
        $this->assertDatabaseHas('pesanan', ['id_pembeli' => $user->buyer->id_pembeli]);
    }

    public function test_verification_rejects_tampering_expiry_and_another_account(): void
    {
        $user = User::find(3);
        $user->update(['email_verified_at' => null]);
        $link = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id_user, 'hash' => sha1($user->email)]);
        $this->actingAs(User::find(2))->get($link)->assertForbidden();
        $this->actingAs($user)->get($link.'x')->assertForbidden();
        $this->travel(61)->minutes();
        $this->get($link)->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_reset_requests_are_generic_and_exclude_inactive_accounts(): void
    {
        Notification::fake();
        $first = $this->from('/forgot-password')->post('/forgot-password', ['email' => 'andi@dlingo.test']);
        $message = session('success');
        $first->assertRedirect('/forgot-password');
        $this->post('/forgot-password', ['email' => 'unknown@example.test'])->assertSessionHas('success', $message);
        Notification::assertSentTo(User::find(3), ResetPassword::class);
        User::find(2)->update(['is_active' => false]);
        $this->post('/forgot-password', ['email' => 'budi@example.com'])->assertSessionHas('success', $message);
        Notification::assertNotSentTo(User::find(2), ResetPassword::class);
        $stored = DB::table('password_reset_tokens')->where('email', 'andi@dlingo.test')->first();
        $this->assertNotNull($stored);
        Notification::assertSentTo(User::find(3), ResetPassword::class, fn ($notice) => Hash::check($notice->token, $stored->token));
    }

    public function test_reset_token_is_single_use_and_revokes_sessions_and_remember_tokens(): void
    {
        $user = User::find(2);
        $user->update(['remember_token' => 'old-remember']);
        DB::table('sessions')->insert(['id' => 'stolen-session', 'user_id' => 2, 'payload' => '', 'last_activity' => time()]);
        $token = Password::createToken($user);
        $data = ['email' => $user->email, 'token' => $token, 'password' => 'updated-password123', 'password_confirmation' => 'updated-password123'];
        $this->post('/reset-password', $data)->assertRedirect('/admin/login');
        $this->assertTrue(Hash::check('updated-password123', $user->fresh()->password));
        $this->assertNotSame('old-remember', $user->fresh()->remember_token);
        $this->assertDatabaseMissing('sessions', ['id' => 'stolen-session']);
        $this->post('/reset-password', $data)->assertSessionHasErrors('email');
    }

    public function test_expired_reset_tokens_do_not_change_passwords(): void
    {
        $user = User::find(3);
        $original = $user->password;
        $token = Password::createToken($user);
        $this->travel(61)->minutes();
        $this->post('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'updated-password123', 'password_confirmation' => 'updated-password123'])->assertSessionHasErrors('email');
        $this->assertSame($original, $user->fresh()->password);
    }

    public function test_email_change_requires_password_and_invalidates_old_verification_and_sessions(): void
    {
        Notification::fake();
        $user = User::find(3);
        $oldLink = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => 3, 'hash' => sha1($user->email)]);
        DB::table('sessions')->insert(['id' => 'other-browser', 'user_id' => 3, 'payload' => '', 'last_activity' => time()]);
        $data = ['username' => $user->username, 'nama' => $user->nama, 'email' => 'updated@example.test'];
        $this->actingAs($user)->put('/profile', $data)->assertSessionHasErrors('current_password');
        $this->put('/profile', $data + ['current_password' => 'demo12345'])->assertRedirect('/profile');
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertDatabaseMissing('sessions', ['id' => 'other-browser']);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->get($oldLink)->assertForbidden();
    }

    public function test_mail_failure_does_not_lose_a_registered_account(): void
    {
        Notification::shouldReceive('send')->andThrow(new \RuntimeException('sensitive SMTP details'));
        $this->post('/register', ['nama' => 'Mail Failure', 'username' => 'mailfailure', 'email' => 'mailfailure@example.test', 'password' => 'password12345', 'password_confirmation' => 'password12345'])->assertRedirect('/dashboard');
        $this->assertDatabaseHas('user', ['username' => 'mailfailure']);
        $this->assertAuthenticated();
    }
}
