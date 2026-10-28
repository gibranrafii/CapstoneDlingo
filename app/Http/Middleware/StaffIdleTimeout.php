<?php

namespace App\Http\Middleware;

use App\Services\SecurityEvent;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffIdleTimeout
{
    public function handle(Request $request, Closure $next)
    {
        if ($user = $request->user()) {
            $sameUser = $request->session()->get('security.user_id') === $user->id_user;
            $last = $sameUser ? $request->session()->get('security.last_active', time()) : time();
            if ($user->isManager() && (Auth::viaRemember() || time() - $last >= config('security.staff_idle_minutes', 30) * 60)) {
                SecurityEvent::record('session.expired');
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('admin.login')->with('error', 'Sesi pengelola berakhir. Silakan masuk kembali.');
            }
            $request->session()->put(['security.user_id' => $user->id_user, 'security.last_active' => time()]);
        }

        return $next($request);
    }
}
