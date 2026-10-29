<?php

return [
    'staff_idle_minutes' => 30,
    'login_decay_seconds' => 900,
    'limits' => [
        'login' => 30,
        'failed_login' => 5,
        'failed_login_account' => 20,
        'register' => 10,
        'reset' => 10,
        'verification_minute' => 3,
        'verification_hour' => 10,
        'checkout' => 5,
        'cart' => 30,
        'write' => 60,
        'public' => 120,
        'upload' => 10,
    ],
    'trusted_proxies' => array_values(array_filter(explode(',', env('TRUSTED_PROXIES', '')))),
];
