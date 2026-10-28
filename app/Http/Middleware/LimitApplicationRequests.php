<?php

namespace App\Http\Middleware;

use App\Services\SecurityEvent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class LimitApplicationRequests
{
    public function handle(Request $request, Closure $next)
    {
        $limits = [];
        $actor = $request->user() ? 'user:'.$request->user()->id_user : 'ip:'.$request->ip();
        if (! $request->isMethodSafe()) {
            $limits[] = ['write', $actor, 60, config('security.limits.write')];
        }
        if ($request->routeIs('login.submit', 'admin.login.submit')) {
            $limits[] = ['login', $request->ip(), 60, config('security.limits.login')];
        }
        if ($request->routeIs('register.submit')) {
            $limits[] = ['register', $request->ip(), 3600, config('security.limits.register')];
        }
        if ($request->routeIs('password.email', 'password.update')) {
            $limits[] = ['reset', $request->ip(), 3600, config('security.limits.reset')];
        }
        if ($request->routeIs('verification.send')) {
            $limits[] = ['verification-minute', $actor, 60, config('security.limits.verification_minute')];
            $limits[] = ['verification-hour', $actor, 3600, config('security.limits.verification_hour')];
        }
        if ($request->routeIs('checkout')) {
            $limits[] = ['checkout', $actor, 60, config('security.limits.checkout')];
        }
        if ($request->routeIs('cart.add', 'cart.update')) {
            $limits[] = ['cart', $actor, 60, config('security.limits.cart')];
        }
        if ($request->isMethodSafe() && $request->routeIs('store', 'products.show')) {
            $limits[] = ['public', $request->ip(), 60, config('security.limits.public')];
        }
        if ($request->routeIs('manage.products.store', 'manage.products.update') && $request->hasFile('gambar')) {
            $limits[] = ['upload', $actor, 60, config('security.limits.upload')];
        }
        foreach ($limits as [$name, $identity, $seconds, $max]) {
            $key = app()->environment().':request:'.$name.':'.hash('sha256', (string) $identity);
            if (RateLimiter::tooManyAttempts($key, $max)) {
                SecurityEvent::record('request.throttled', ['limiter' => $name]);

                return response()->view('errors.429', [], 429)->header('Retry-After', RateLimiter::availableIn($key));
            }
            RateLimiter::hit($key, $seconds);
        }

        return $next($request);
    }
}
