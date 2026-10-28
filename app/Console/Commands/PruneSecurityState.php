<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;

class PruneSecurityState extends Command
{
    protected $signature = 'security:prune';

    protected $description = 'Prune expired security state without touching live sessions or counters';

    public function handle(): int
    {
        if (config('cache.default') === 'database') {
            $connection = DB::connection(config('cache.stores.database.connection'));
            $connection->table(config('cache.stores.database.table'))->where('expiration', '<', time())->delete();
            $connection->table(config('cache.stores.database.lock_table') ?: 'cache_locks')->where('expiration', '<', time())->delete();
        }
        Password::getRepository()->deleteExpired();
        if (config('session.driver') === 'database') {
            DB::connection(config('session.connection'))->table(config('session.table'))->where('last_activity', '<', time() - config('session.lifetime') * 60)->delete();
        }
        $this->info('Expired security state pruned.');

        return self::SUCCESS;
    }
}
