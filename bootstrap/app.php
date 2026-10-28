<?php

use App\Http\Middleware\EnsureActiveAccount;
use App\Http\Middleware\LimitApplicationRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\StaffIdleTimeout;
use App\Http\Middleware\TrustedProxies;
use App\Http\Middleware\ValidateHost;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(ValidateHost::class);
        $middleware->append(SecurityHeaders::class);
        $middleware->replace(TrustProxies::class, TrustedProxies::class);
        $middleware->appendToGroup('web', [EnsureActiveAccount::class, StaffIdleTimeout::class, LimitApplicationRequests::class]);
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin', 'admin/*', 'manage/*', 'dashboard/petani', 'dashboard/admin') ? route('admin.login') : route('login'));
        $middleware->redirectUsersTo('/dashboard');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash(['password', 'password_confirmation', 'current_password', 'token']);
        $exceptions->respond(fn ($response) => SecurityHeaders::apply($response, request()));
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
