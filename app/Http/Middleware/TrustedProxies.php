<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

class TrustedProxies extends TrustProxies
{
    protected $headers = Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_X_FORWARDED_PORT;

    public function handle(Request $request, \Closure $next)
    {
        $this->proxies = config('security.trusted_proxies', []);
        abort_if(in_array('*', $this->proxies, true) || in_array('0.0.0.0/0', $this->proxies, true) || in_array('::/0', $this->proxies, true), 503);

        return parent::handle($request, $next);
    }
}
