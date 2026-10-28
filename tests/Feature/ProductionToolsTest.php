<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\RuntimePrivileges;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProductionToolsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_runtime_grant_check_rejects_global_other_schema_and_wildcard_access(): void
    {
        $allowed = [
            "GRANT USAGE ON *.* TO 'runtime'@'%'",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON `dlingo\\_jamur`.* TO 'runtime'@'%'",
        ];
        foreach ($allowed as $grant) {
            $this->assertTrue(RuntimePrivileges::allowsOnlyApplicationCrud($grant, 'dlingo_jamur'));
        }
        foreach (["GRANT SELECT ON *.* TO 'runtime'@'%'", "GRANT SELECT ON `another`.* TO 'runtime'@'%'", "GRANT SELECT ON `dlingo_jamur`.* TO 'runtime'@'%'", "GRANT ALL PRIVILEGES ON `dlingo\\_jamur`.* TO 'runtime'@'%'", "GRANT SELECT ON `dlingo\\_jamur`.* TO 'runtime'@'%' WITH GRANT OPTION"] as $grant) {
            $this->assertFalse(RuntimePrivileges::allowsOnlyApplicationCrud($grant, 'dlingo_jamur'));
        }
    }

    public function test_reference_seeder_refuses_production_even_when_forced(): void
    {
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Reference/demo accounts cannot be seeded');
        (new ReferenceSeeder)->run();
    }

    public function test_pruning_preserves_live_cache_locks_and_sessions(): void
    {
        config(['cache.default' => 'database', 'session.driver' => 'database']);
        foreach (['expired' => time() - 60, 'live' => time() + 3600] as $key => $expiry) {
            DB::table('cache')->insert(['key' => $key, 'value' => serialize(1), 'expiration' => $expiry]);
            DB::table('cache_locks')->insert(['key' => $key, 'owner' => 'test', 'expiration' => $expiry]);
            DB::table('sessions')->insert(['id' => $key, 'user_id' => 3, 'payload' => '', 'last_activity' => $key === 'live' ? time() : time() - 7201]);
        }
        $this->artisan('security:prune')->assertSuccessful();
        foreach (['cache', 'cache_locks'] as $table) {
            $this->assertDatabaseMissing($table, ['key' => 'expired']);
            $this->assertDatabaseHas($table, ['key' => 'live']);
        }
        $this->assertDatabaseMissing('sessions', ['id' => 'expired']);
        $this->assertDatabaseHas('sessions', ['id' => 'live']);
    }

    public function test_readiness_check_reports_local_defaults_without_exposing_secrets(): void
    {
        $this->artisan('security:check')->expectsOutputToContain('FAIL Production environment')
            ->expectsOutputToContain('FAIL No active reference passwords')->assertFailed();
    }

    public function test_administrator_bootstrap_has_no_password_arguments_or_noninteractive_defaults(): void
    {
        $this->artisan('security:create-admin', ['--no-interaction' => true])->assertFailed();
        $this->assertDatabaseCount('user', 3);
    }

    public function test_administrator_bootstrap_creates_a_unique_account_with_private_prompts(): void
    {
        Notification::fake();
        $this->artisan('security:create-admin')
            ->expectsQuestion('Nama lengkap', 'Owner')
            ->expectsQuestion('Username', 'owner')
            ->expectsQuestion('Email', 'owner@example.test')
            ->expectsQuestion('Kata sandi (minimal 12 karakter, maksimal 72 byte)', 'new-owner-password123')
            ->expectsQuestion('Ulangi kata sandi', 'new-owner-password123')->assertSuccessful();
        $this->assertDatabaseHas('user', ['username' => 'owner', 'role' => 'admin', 'email_verified_at' => null]);
        $this->assertTrue(Hash::check('new-owner-password123', User::whereUsername('owner')->first()->password));
    }
}
