<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
class AdoptDatabase extends Command {
    protected $signature='app:adopt-database';
    protected $description='Verify the eight existing Dlingo tables and register their migration baseline without recreating them';
    public function handle(): int {
        $baseline='2026_01_01_000000_create_dlingo_baseline';
        $repository=app('migration.repository');
        if ($repository->repositoryExists() && in_array($baseline,$repository->getRan())) { $this->info('Baseline already adopted.'); return self::SUCCESS; }
        $expected=json_decode(file_get_contents(database_path('schema/dlingo-baseline.json')),true,flags:JSON_THROW_ON_ERROR);
        $actual=collect(DB::select('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=?',[DB::getDatabaseName()]))->keyBy(fn($r)=>$r->TABLE_NAME.'.'.$r->COLUMN_NAME);
        foreach($expected as $column) {
            $key=$column['table'].'.'.$column['column']; $found=$actual->get($key);
            if (!$found || $found->COLUMN_TYPE!==$column['type'] || $found->IS_NULLABLE!==$column['nullable'] || $found->COLUMN_KEY!==$column['key']) {
                $this->error('Schema mismatch at '.$key.'. No baseline was registered.');return self::FAILURE;
            }
        }
        if (!$repository->repositoryExists()) $repository->createRepository();
        $repository->log($baseline,1);
        $this->info('Verified all eight domain tables; baseline adopted without modifying their data.');
        return self::SUCCESS;
    }
}
