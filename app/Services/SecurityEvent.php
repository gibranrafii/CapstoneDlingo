<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SecurityEvent
{
    public static function record(string $event, array $context = []): void
    {
        // Never accept arbitrary payloads, URLs, email addresses or credentials here.
        $allowed = array_intersect_key($context, array_flip(['target_id', 'identity_hash', 'exception_class', 'old_role', 'new_role', 'limiter', 'status']));
        try {
            Log::channel('security')->notice($event, $allowed + [
                'actor_id' => Auth::id(),
                'ip' => app()->runningInConsole() ? null : request()->ip(),
                'route' => app()->runningInConsole() ? null : request()->route()?->getName(),
            ]);
        } catch (\Throwable) {
            error_log('JamurTani security log unavailable. Check storage permissions.');
        }
    }
}
