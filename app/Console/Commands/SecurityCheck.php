<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\RuntimePrivileges;
use Illuminate\Console\Command;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SecurityCheck extends Command
{
    protected $signature = 'security:check';

    protected $description = 'Read-only production configuration checks (run as the PHP-FPM user)';

    public function handle(): int
    {
        $host = parse_url(config('app.url'), PHP_URL_HOST) ?: '';
        $key = (string) config('app.key');
        $key = str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;
        $checks = [
            'Production environment' => app()->isProduction(),
            'Debug disabled' => config('app.debug') === false,
            'Application key configured' => is_string($key) && Encrypter::supported($key, config('app.cipher')),
            'Real HTTPS application URL' => str_starts_with((string) config('app.url'), 'https://') && ! str_contains($host, '__') && ! in_array($host, ['localhost', '127.0.0.1', 'example.com', '']) && ! str_ends_with($host, '.test') && ! str_ends_with($host, '.example'),
            'Database-backed sessions' => config('session.driver') === 'database',
            'Secure HttpOnly host-only cookies' => config('session.secure') === true && config('session.http_only') === true && ! config('session.domain') && config('session.same_site') === 'lax',
            'Persistent atomic rate-limit cache' => in_array(config('cache.default'), ['database', 'redis'], true),
            'SMTP delivery configured' => config('mail.default') === 'smtp' && filled(config('mail.mailers.smtp.host')) && ! str_contains((string) config('mail.mailers.smtp.host'), '__') && ! in_array(config('mail.mailers.smtp.host'), ['127.0.0.1', 'localhost', 'mailpit']) && filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false && ! str_contains((string) config('mail.from.address', ''), '__') && ! str_contains((string) config('mail.from.address', ''), 'example'),
            'No Vite development server marker' => ! is_file(public_path('hot')),
            'Storage and bootstrap cache writable' => is_writable(storage_path()) && is_writable(base_path('bootstrap/cache')),
            'Application code read-only for this user' => ! is_writable(app_path()) && ! is_writable(public_path('index.php')),
            'Restricted proxy configuration' => ! array_intersect(config('security.trusted_proxies'), ['*', '0.0.0.0/0', '::/0']),
        ];
        try {
            $checks['Security migrations applied'] = Schema::hasColumn('user', 'email_verified_at') && Schema::hasTable('password_reset_tokens') && Schema::hasTable('cache') && Schema::hasTable('cache_locks');
            $checks['No active reference passwords'] = ! User::where('is_active', true)->get()->contains(fn ($user) => Hash::check('demo12345', $user->password));
            $checks['Active administrator exists'] = User::where('is_active', true)->where('role', 'admin')->exists();
            $checks['Runtime database privileges limited'] = config('database.connections.'.config('database.default').'.username') !== 'root';
            foreach (DB::select('SHOW GRANTS FOR CURRENT_USER()') as $row) {
                $grant = (string) array_values((array) $row)[0];
                // Inspect only privilege names; never print grants/authentication material.
                if (! RuntimePrivileges::allowsOnlyApplicationCrud($grant, DB::getDatabaseName())) {
                    $checks['Runtime database privileges limited'] = false;
                }
            }
        } catch (\Throwable) {
            $checks['Database checks completed'] = false;
        }
        foreach ($checks as $label => $passed) {
            $this->line(($passed ? 'PASS ' : 'FAIL ').$label);
        }
        $this->warn('Also verify TLS renewal, SMTP delivery, firewall rules and an offsite restore on the actual VPS. 2FA remains deferred.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
