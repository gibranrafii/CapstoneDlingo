<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use App\Models\User;
use App\Rules\PasswordBytes;
use App\Services\Activity;
use App\Services\SecurityEvent;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function loginForm(Request $request)
    {
        return view('auth.login', ['staff' => $request->is('admin/*')]);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['username' => ['required', 'string', 'max:255'], 'password' => ['required', 'string', new PasswordBytes], 'remember' => ['nullable', 'boolean']]);
        $identity = trim($data['username']);
        $column = filter_var($identity, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $accountId = User::where($column, $identity)->value('id_user');
        $accountHash = hash_hmac('sha256', $accountId ? 'user:'.$accountId : 'identity:'.mb_strtolower($identity), config('app.key'));
        $prefix = app()->environment().':login:';
        $key = $prefix.'ip:'.hash('sha256', $accountHash.'|'.$request->ip());
        $accountKey = $prefix.'account:'.$accountHash;
        $staff = $request->is('admin/*');
        $identityHash = hash_hmac('sha256', mb_strtolower($identity), config('app.key'));
        if (RateLimiter::tooManyAttempts($key, config('security.limits.failed_login')) || RateLimiter::tooManyAttempts($accountKey, config('security.limits.failed_login_account'))) {
            SecurityEvent::record('login.throttled', ['identity_hash' => $identityHash]);
            abort(response('Terlalu banyak percobaan. Silakan coba lagi.', 429)->header('Retry-After', max(RateLimiter::availableIn($key), RateLimiter::availableIn($accountKey))));
        }
        if (! Auth::attemptWhen([$column => $identity, 'password' => $data['password'], 'is_active' => 1], fn (User $user) => $staff ? $user->isManager() : $user->role === 'pembeli', ! $staff && $request->boolean('remember'))) {
            RateLimiter::hit($key, config('security.login_decay_seconds'));
            RateLimiter::hit($accountKey, config('security.login_decay_seconds'));
            SecurityEvent::record('login.failed', ['identity_hash' => $identityHash]);
            throw ValidationException::withMessages(['username' => 'Username atau kata sandi salah.']);
        }
        RateLimiter::clear($key);
        // Keep the account-wide failure history until expiry; a valid login must
        // not reset protection against attempts from other addresses.
        SecurityEvent::record('login.succeeded');
        $request->session()->regenerate();

        $request->session()->put(['security.user_id' => $request->user()->id_user, 'security.last_active' => time()]);
        $intended = $request->session()->pull('url.intended');
        if (is_string($intended)) {
            $parts = parse_url($intended);
            $origin = parse_url(config('app.url'));
            $path = $parts['path'] ?? '/';
            $sameOrigin = isset($parts['host']) && strcasecmp($parts['host'], $origin['host'] ?? '') === 0
                && ($parts['scheme'] ?? '') === ($origin['scheme'] ?? '') && ($parts['port'] ?? null) === ($origin['port'] ?? null)
                && ! isset($parts['user']) && ! isset($parts['pass']);
            $staffPath = $path === '/admin' || str_starts_with($path, '/admin/');
            $buyerPath = in_array($path, ['/cart', '/orders', '/profile', '/dashboard/pembeli']) || preg_match('#^/(orders|products)/[0-9]+$#', $path);
            if ($sameOrigin && ($staff ? $staffPath && $path !== '/admin/login' : $buyerPath)) {
                return redirect()->to($intended);
            }
        }

        return redirect()->route($staff ? 'admin.dashboard' : 'dashboard.pembeli');
    }

    public function registerForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $data = $request->validate(['nama' => ['required', 'string', 'max:255'], 'username' => ['required', 'string', 'max:255', 'unique:user,username'], 'email' => ['required', 'email', 'max:255', 'unique:user,email'], 'no_telepon' => ['nullable', 'string', 'max:50'], 'alamat' => ['nullable', 'string', 'max:255'], 'password' => ['required', 'string', 'min:12', new PasswordBytes, 'confirmed'], 'role' => ['prohibited']]);
        $user = DB::transaction(function () use ($data) {
            $user = User::create(collect($data)->except('alamat')->all() + ['role' => 'pembeli', 'is_active' => true]);
            Buyer::create(['id_user' => $user->id_user, 'account_user_id' => $user->id_user, 'nama_pembeli' => $user->nama, 'email_pembeli' => $user->email, 'no_telepon_pembeli' => $user->no_telepon, 'alamat_pembeli' => $data['alamat'] ?? null]);
            Activity::record($user->nama.' mendaftar', 'Pengguna', $user);

            return $user;
        });
        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function logout(Request $request)
    {
        $staff = $request->user()?->isManager();
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route($staff ? 'admin.login' : 'login');
    }
}
