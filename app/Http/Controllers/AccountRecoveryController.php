<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\PasswordBytes;
use App\Services\SecurityEvent;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AccountRecoveryController extends Controller
{
    public function requestForm()
    {
        return view('auth.forgot-password');
    }

    public function send(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        try {
            Password::sendResetLink($data + ['is_active' => true]);
        } catch (\Throwable $error) {
            SecurityEvent::record('password_reset.delivery_failed', ['exception_class' => $error::class]);
        }
        SecurityEvent::record('password_reset.requested');

        return back()->with('success', 'Jika akun aktif dengan email tersebut tersedia, instruksi reset akan dikirim. Periksa email Anda atau coba kembali nanti.');
    }

    public function resetForm(Request $request, string $token)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        abort_if(strlen($token) > 255, 404);

        return view('auth.reset-password', ['token' => $token, 'email' => $data['email']]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:12', new PasswordBytes, 'confirmed'],
        ]);
        $staff = false;
        $status = DB::transaction(function () use ($data, &$staff) {
            // Serialize validation and consumption so simultaneous requests cannot
            // both use the same reset token successfully.
            DB::table(config('auth.passwords.users.table'))->where('email', $data['email'])->lockForUpdate()->first();

            return Password::reset($data + ['is_active' => true], function (User $user, string $password) use (&$staff) {
                DB::transaction(function () use ($user, $password) {
                    $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                    DB::table('sessions')->where('user_id', $user->id_user)->delete();
                });
                $staff = $user->isManager();
                event(new PasswordReset($user));
                SecurityEvent::record('password_reset.completed', ['target_id' => $user->id_user]);
            });
        }, 3);
        if ($status !== Password::PASSWORD_RESET) {
            return back()->withErrors(['email' => 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.']);
        }
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route($staff ? 'admin.login' : 'login')->with('success', 'Kata sandi diperbarui. Silakan masuk kembali.');
    }
}
