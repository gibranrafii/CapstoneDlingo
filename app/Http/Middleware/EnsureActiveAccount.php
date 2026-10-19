<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
class EnsureActiveAccount {
    public function handle(Request $request,Closure $next) {
        if(Auth::check()&&!Auth::user()->is_active) { Auth::logout();$request->session()->invalidate();$request->session()->regenerateToken();return redirect()->route('login')->with('error','Akun telah dinonaktifkan.'); }
        return $next($request);
    }
}
