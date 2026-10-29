<?php

namespace Tests\Feature;

use App\Models\User;
use App\Providers\AppServiceProvider;
use App\Services\SecurityEvent;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class RequestSecurityTest extends TestCase
{
    use DatabaseTransactions;

    public function test_security_headers_and_private_cache_rules_cover_success_and_errors(): void
    {
        $this->get('/login')->assertOk()->assertHeader('X-Frame-Options', 'DENY')->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer')->assertHeader('Cache-Control', 'no-store, private');
        $csp = $this->get('/')->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("script-src 'self'", $csp);
        $this->assertStringNotContainsString('unsafe-inline', $csp);
        $this->actingAs(User::find(3))->get('/admin/users')->assertForbidden()
            ->assertHeader('X-Frame-Options', 'DENY')->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_untrusted_hosts_and_forwarded_hosts_are_not_used(): void
    {
        $this->get('http://evil.example/')->assertStatus(400);
        $this->flushHeaders();
        $this->withHeader('X-Forwarded-Host', 'evil.example')->get(config('app.url').'/login')->assertOk()->assertDontSee('evil.example');
    }

    public function test_spoofed_forwarded_ips_cannot_bypass_rate_limits(): void
    {
        config(['security.limits.public' => 1]);
        $this->withHeader('X-Forwarded-For', '198.51.100.1')->get('/')->assertOk();
        $this->withHeader('X-Forwarded-For', '198.51.100.2')->get('/')->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_login_failures_share_a_limit_across_portals_and_case_variants(): void
    {
        config(['security.limits.failed_login' => 2]);
        $this->post('/login', ['username' => 'admin', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->post('/admin/login', ['username' => ' ADMIN ', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->post('/admin/login', ['username' => 'admin', 'password' => 'demo12345'])->assertStatus(429)->assertHeader('Retry-After');
        $this->assertGuest();
    }

    public function test_login_ip_limits_cover_different_identities(): void
    {
        config(['security.limits.login' => 1]);
        $this->post('/login', ['username' => 'first', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->post('/admin/login', ['username' => 'second', 'password' => 'wrong'])->assertStatus(429)->assertHeader('Retry-After');
    }

    public function test_login_lockout_lasts_fifteen_minutes(): void
    {
        config(['security.limits.failed_login' => 1]);
        $credentials = ['username' => 'pembeli', 'password' => 'wrong'];
        $this->post('/login', $credentials)->assertSessionHasErrors('username');
        $this->travel(61)->seconds();
        $this->post('/login', $credentials)->assertStatus(429);
        $this->travel(840)->seconds();
        $this->post('/login', ['username' => 'pembeli', 'password' => 'demo12345'])->assertRedirect('/dashboard/pembeli');
    }

    public function test_account_limit_covers_different_ips_and_username_email_aliases(): void
    {
        config(['security.limits.failed_login_account' => 2]);
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1'])->post('/admin/login', ['username' => 'admin', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.2'])->post('/admin/login', ['username' => 'BUDI@example.com', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.3'])->post('/admin/login', ['username' => 'admin', 'password' => 'demo12345'])->assertStatus(429);
        $this->assertGuest();
    }

    public function test_successful_login_does_not_clear_other_ips_account_failure_history(): void
    {
        config(['security.limits.failed_login_account' => 2]);
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1'])->post('/login', ['username' => 'pembeli', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.2'])->post('/login', ['username' => 'pembeli', 'password' => 'demo12345'])->assertRedirect('/dashboard/pembeli');
        $this->post('/logout');
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.3'])->post('/login', ['username' => 'pembeli', 'password' => 'wrong'])->assertSessionHasErrors('username');
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.4'])->post('/login', ['username' => 'pembeli', 'password' => 'demo12345'])->assertStatus(429);
    }

    public function test_sensitive_actions_are_throttled_per_account(): void
    {
        config(['security.limits.cart' => 1, 'security.limits.checkout' => 1]);
        $this->actingAs(User::find(3))->post('/cart/1', ['quantity' => 1])->assertRedirect();
        $this->post('/cart/1', ['quantity' => 1])->assertStatus(429);
        $this->post('/checkout', [])->assertSessionHasErrors('alamat_kirim');
        $this->post('/checkout', [])->assertStatus(429);
    }

    public function test_registration_recovery_and_verification_have_specific_limits(): void
    {
        config(['security.limits.register' => 1, 'security.limits.reset' => 1, 'security.limits.verification_minute' => 1]);
        $this->post('/register', [])->assertSessionHasErrors();
        $this->post('/register', [])->assertStatus(429);
        $this->post('/forgot-password', [])->assertSessionHasErrors();
        $this->post('/forgot-password', [])->assertStatus(429);
        $this->actingAs(User::find(3))->post('/email/verification-notification')->assertRedirect();
        $this->post('/email/verification-notification')->assertStatus(429);
    }

    public function test_uploads_reject_disguised_scripts_and_excessive_size(): void
    {
        $data = ['nama_produk' => 'Unsafe', 'kategori' => 'Jamur', 'satuan' => 'kg', 'harga' => 1000, 'stok' => 1];
        $this->actingAs(User::find(2))->post('/admin/products', $data + ['gambar' => UploadedFile::fake()->createWithContent('fake.jpg', '<?php echo "unsafe";')])->assertSessionHasErrors('gambar');
        $this->post('/admin/products', $data + ['gambar' => UploadedFile::fake()->create('big.png', 2049, 'image/png')])->assertSessionHasErrors('gambar');
        $chunk = fn ($type, $bytes) => pack('N', strlen($bytes)).$type.$bytes.pack('N', crc32($type.$bytes));
        $png = "\x89PNG\r\n\x1a\n".$chunk('IHDR', pack('NNCCCCC', 4097, 1, 8, 2, 0, 0, 0))
            .$chunk('IDAT', gzcompress("\0".str_repeat("\0", 4097 * 3))).$chunk('IEND', '');
        $this->post('/admin/products', $data + ['gambar' => UploadedFile::fake()->createWithContent('wide.png', $png)])->assertSessionHasErrors('gambar');
        $this->assertDatabaseMissing('product', ['nama_produk' => 'Unsafe']);
    }

    public function test_production_forces_secure_host_only_cookies_and_https_headers(): void
    {
        $this->app->instance('env', 'production');
        config(['app.url' => 'https://127.0.0.1', 'session.secure' => false, 'session.domain' => '.example.test']);
        $this->app->getProvider(AppServiceProvider::class)->boot();
        $response = $this->get('https://127.0.0.1/login')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000');
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === config('session.cookie'));
        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', $cookie->getSameSite());
        $this->assertEmpty($cookie->getDomain());
        $this->get('https://evil.example/login')->assertStatus(400);
    }

    public function test_security_logs_whitelist_metadata_and_drop_secrets(): void
    {
        $logger = Mockery::mock();
        $logger->shouldReceive('notice')->once()->with('test.event', Mockery::on(fn ($context) => $context['target_id'] === 3 && array_intersect_key($context, array_flip(['password', 'token', 'email', 'url'])) === []));
        Log::shouldReceive('channel')->with('security')->andReturn($logger);
        SecurityEvent::record('test.event', ['target_id' => 3, 'password' => 'secret', 'token' => 'secret', 'email' => 'private@example.test', 'url' => '/reset-password/secret']);
    }

    public function test_staging_enforces_https_secure_cookies_and_only_the_configured_host(): void
    {
        $this->app->instance('env', 'staging');
        config(['app.url' => 'https://staging.example.test', 'app.debug' => true, 'session.secure' => false, 'session.domain' => '.example.test']);
        $this->app->getProvider(AppServiceProvider::class)->boot();
        $response = $this->get('https://staging.example.test/login')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000');
        $this->assertFalse(config('app.debug'));
        $this->assertSame('https://staging.example.test/login', route('login'));
        $cookie = collect($response->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === config('session.cookie'));
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', $cookie->getSameSite());
        $this->assertEmpty($cookie->getDomain());
        $this->get('https://localhost/login')->assertStatus(400);
        $this->get('https://127.0.0.1/login')->assertStatus(400);
    }
}
