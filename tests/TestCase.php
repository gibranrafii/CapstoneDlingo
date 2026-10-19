<?php
namespace Tests;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
abstract class TestCase extends BaseTestCase {
    public function createApplication() {
        $app=parent::createApplication();
        $connection=$app->make('config')->get('database.default');
        if($app->make('config')->get('database.connections.'.$connection.'.database')!=='dlingo_jamur_test')throw new \RuntimeException('Tests may only run against dlingo_jamur_test.');
        return $app;
    }
    protected function setUp(): void {
        parent::setUp();
        if(DB::getDatabaseName()!=='dlingo_jamur_test')throw new \RuntimeException('Tests may only run against dlingo_jamur_test.');
        $this->withoutVite();
    }
}
