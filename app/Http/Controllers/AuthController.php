<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use App\Models\User;
use App\Services\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function loginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $data = $request->validate(['username' => ['required', 'string', 'max:255'], 'password' => ['required', 'string'], 'remember' => ['nullable', 'boolean']]);
        $identity = trim($data['username']);
        $key = mb_strtolower($identity).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['username' => 'Terlalu banyak percobaan. Coba kembali dalam '.RateLimiter::availableIn($key).' detik.']);
        }
        $column = filter_var($identity, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        if (! Auth::attempt([$column => $identity, 'password' => $data['password'], 'is_active' => 1], $request->boolean('remember'))) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['username' => 'Username atau kata sandi salah.']);
        }
        RateLimiter::clear($key);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function registerForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $data = $request->validate(['nama' => ['required', 'string', 'max:255'], 'username' => ['required', 'string', 'max:255', 'unique:user,username'], 'email' => ['required', 'email', 'max:255', 'unique:user,email'], 'no_telepon' => ['nullable', 'string', 'max:50'], 'alamat' => ['nullable', 'string', 'max:255'], 'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'], 'role' => ['prohibited']]);
        $user = DB::transaction(function () use ($data) {
            $user = User::create(collect($data)->except('alamat')->all() + ['role' => 'pembeli', 'is_active' => true]);
            Buyer::create(['id_user' => $user->id_user, 'account_user_id' => $user->id_user, 'nama_pembeli' => $user->nama, 'email_pembeli' => $user->email, 'no_telepon_pembeli' => $user->no_telepon, 'alamat_pembeli' => $data['alamat'] ?? null]);
            Activity::record($user->nama.' mendaftar', 'Pengguna', $user);

            return $user;
        });
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
