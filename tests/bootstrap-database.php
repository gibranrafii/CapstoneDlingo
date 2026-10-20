<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

// Standalone HTTP/concurrency helpers must never connect to the shared application database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->loadEnvironmentFrom('.env.testing');
$app->make(Kernel::class)->bootstrap();
if (DB::getDatabaseName() !== 'dlingo_jamur_test') {
    throw new RuntimeException('This helper may only use dlingo_jamur_test.');
}

return $app;
