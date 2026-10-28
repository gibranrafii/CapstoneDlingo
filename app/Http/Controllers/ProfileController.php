<?php

namespace App\Http\Controllers;

use App\Rules\PasswordBytes;
use App\Services\Activity;
use App\Support\Ui;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function edit(Request $r)
    {
        return view('profile', ['user' => $r->user()]);
    }

    public function update(Request $r)
    {
        $user = $r->user();
        $emailChanged = $r->input('email') !== $user->email;
        $oldEmail = $user->email;
        $data = $r->validate(['username' => ['required', 'string', 'max:255', Rule::unique('user', 'username')->ignore($user->id_user, 'id_user')], 'nama' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255', Rule::unique('user', 'email')->ignore($user->id_user, 'id_user')], 'no_telepon' => ['nullable', 'string', 'max:50'], 'alamat' => ['nullable', 'string', 'max:255'], 'password' => ['nullable', 'string', 'min:12', new PasswordBytes, 'confirmed'], 'current_password' => [Rule::requiredIf($r->filled('password') || $emailChanged), 'nullable', 'string', 'current_password']]);
        $password = $data['password'] ?? null;
        $address = $data['alamat'] ?? null;
        unset($data['current_password'],$data['alamat']);
        if (! $password) {
            unset($data['password']);
        } else {
            $data['remember_token'] = Str::random(60);
        }
        if ($emailChanged) {
            $data['email_verified_at'] = null;
            $data['remember_token'] = Str::random(60);
        }
        DB::transaction(function () use ($user, $data, $address, $r, $password, $emailChanged, $oldEmail) {
            $user->update($data);
            if ($buyer = $user->buyer) {
                $buyer->update(['nama_pembeli' => $user->nama, 'email_pembeli' => $user->email, 'no_telepon_pembeli' => $user->no_telepon, 'alamat_pembeli' => $address ?? $buyer->alamat_pembeli]);
            }
            if ($password || $emailChanged) {
                $r->session()->regenerate(true);
                DB::table('sessions')->where('user_id', $user->id_user)->where('id', '!=', $r->session()->getId())->delete();
            }
            if ($emailChanged) {
                DB::table('password_reset_tokens')->where('email', $oldEmail)->delete();
            }
            Activity::record('Profil akun diperbarui', 'Profil');
        });

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return redirect(Ui::profileUrl())->with('success', 'Profil berhasil diperbarui.');
    }
}
