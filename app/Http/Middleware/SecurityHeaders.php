<?php

namespace App\Http\Middleware;

use App\Services\SecurityEvent;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        return self::apply($next($request), $request);
    }

    public static function apply(Response $response, Request $request): Response
    {
        if ($request->attributes->get('security.headers_applied')) {
            return $response;
        }
        $request->attributes->set('security.headers_applied', true);
        $scripts = "'self'";
        $styles = "'self'";
        $connections = "'self'";
        if (! app()->environment(['production', 'staging']) && is_file(public_path('hot'))) {
            $url = trim(file_get_contents(public_path('hot')));
            $parts = parse_url($url);
            if (in_array($parts['scheme'] ?? '', ['http', 'https'], true) && isset($parts['host'])) {
                $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
                $scripts .= ' '.$origin;
                $styles .= " 'unsafe-inline' ".$origin;
                $connections .= ' '.$origin.' '.preg_replace('/^http/', 'ws', $origin);
            }
        }
        $response->headers->set('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src ".$scripts.'; style-src '.$styles."; img-src 'self' blob: data:; connect-src ".$connections);
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $account = $request->is('login', 'register', 'admin/login', 'forgot-password', 'reset-password', 'reset-password/*', 'email/*');
        if ($account || ($request->hasSession() && $request->user())) {
            $response->headers->set('Cache-Control', 'no-store, private');
            $response->headers->set('Pragma', 'no-cache');
        }
        if ($account) {
            $response->headers->set('Referrer-Policy', 'no-referrer');
        }
        if (app()->environment(['production', 'staging']) && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }
        if (in_array($response->getStatusCode(), [401, 403, 419], true)) {
            SecurityEvent::record('request.denied', ['status' => $response->getStatusCode()]);
        }

        return $response;
    }
}
