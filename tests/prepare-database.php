<?php

require __DIR__.'/bootstrap-database.php';
use Illuminate\Support\Facades\Artisan;

Artisan::call('migrate:fresh', ['--force' => true]);
Artisan::call('db:seed', ['--class' => 'ReferenceSeeder', '--force' => true]);
echo "Isolated dlingo_jamur_test database prepared.\n";
