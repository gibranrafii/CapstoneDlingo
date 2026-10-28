<?php

require __DIR__.'/bootstrap-database.php';

use App\Http\Controllers\AccountRecoveryController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;

if (($argv[1] ?? '') === '--worker') {
    $input = json_decode(stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR);
    while (microtime(true) < $input['start']) {
        usleep(10000);
    }
    $request = Request::create('/reset-password', 'POST', $input['data']);
    $request->setLaravelSession(app('session')->driver('array'));
    $request->session()->start();
    $response = app(AccountRecoveryController::class)->reset($request);
    echo json_encode(['success' => parse_url($response->getTargetUrl(), PHP_URL_PATH) === '/login']);
    exit;
}
$user = User::create(['nama' => 'Reset race fixture', 'username' => 'reset-race-'.bin2hex(random_bytes(4)), 'email' => 'reset-race-'.bin2hex(random_bytes(4)).'@example.test', 'password' => 'initial-fixture-password', 'role' => 'pembeli', 'is_active' => true]);
try {
    $token = Password::createToken($user);
    $workers = [];
    $start = microtime(true) + 2;
    for ($index = 0; $index < 2; $index++) {
        $process = proc_open([PHP_BINARY, __FILE__, '--worker'], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (! is_resource($process)) {
            throw new RuntimeException('Reset worker could not start.');
        }
        // Secrets travel through a private pipe, not process arguments or logs.
        fwrite($pipes[0], json_encode(['start' => $start, 'data' => ['token' => $token, 'email' => $user->email, 'password' => 'race-password-'.$index.'-private', 'password_confirmation' => 'race-password-'.$index.'-private']]));
        fclose($pipes[0]);
        $workers[] = [$process, $pipes];
    }
    $successes = 0;
    foreach ($workers as [$process, $pipes]) {
        $output = stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        if (proc_close($process) !== 0) {
            throw new RuntimeException('Reset worker failed; secrets omitted.');
        }
        $successes += json_decode($output, true, flags: JSON_THROW_ON_ERROR)['success'] ? 1 : 0;
    }
    if ($successes !== 1) {
        throw new RuntimeException('A reset token was accepted more than once concurrently.');
    }
    echo "PASS simultaneous reset requests consume a token exactly once.\n";
} finally {
    DB::table('password_reset_tokens')->where('email', $user->email)->delete();
    $user->delete();
}
