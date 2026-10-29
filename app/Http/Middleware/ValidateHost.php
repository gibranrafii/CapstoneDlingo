<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ValidateHost
{
    public function handle(Request $request, Closure $next)
    {
        $host = parse_url(config('app.url'), PHP_URL_HOST);
        $allowed = app()->environment(['production', 'staging']) ? [$host] : [$host, 'localhost', '127.0.0.1', '::1'];
        abort_unless(in_array(strtolower($request->getHost()), array_map('strtolower', array_filter($allowed)), true), 400);

        return $next($request);
    }
}
