<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\PasswordBytes;
use App\Services\Activity;
use App\Services\SecurityEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UsersController extends Controller
{
    public function index()
    {
        return view('admin.users', ['users' => User::orderByDesc('is_active')->orderBy('id_user')->get()]);
    }

    public function store(Request $r)
    {
        return $this->save($r, new User(['is_active' => true]));
    }

    public function update(Request $r, int $id)
    {
        return $this->save($r, User::findOrFail($id));
    }

    private function save(Request $r, User $user)
    {
        $r->validate(['current_password' => ['required', 'string', 'current_password']]);
        $data = $r->validate(['nama' => ['required', 'string', 'max:255'], 'username' => ['required', 'string', 'max:255', Rule::unique('user')->ignore($user->id_user, 'id_user')], 'email' => ['required', 'email', 'max:255', Rule::unique('user')->ignore($user->id_user, 'id_user')], 'no_telepon' => ['nullable', 'string', 'max:50'], 'role' => ['required', Rule::in(['admin', 'petani', 'pembeli'])], 'password' => [$user->exists ? 'nullable' : 'required', 'string', 'min:12', new PasswordBytes]]);
        if ($user->id_user === $r->user()->id_user && $data['role'] !== $user->role) {
            throw ValidationException::withMessages(['role' => 'Anda tidak dapat mengubah role akun sendiri.']);
        }
        // A linked buyer stays a buyer so historical order ownership remains stable.
        if ($user->exists && $user->role === 'pembeli' && $data['role'] !== 'pembeli') {
            throw ValidationException::withMessages(['role' => 'Akun pembeli tetap terhubung ke riwayat pesanannya. Buat akun pengelola terpisah.']);
        }
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $emailChanged = ! $user->exists || $data['email'] !== $user->email;
        $oldEmail = $user->email;
        $oldRole = $user->role;
        if ($emailChanged) {
            $data['email_verified_at'] = null;
        }
        DB::transaction(function () use ($user, $data, $r, $emailChanged, $oldEmail, $oldRole) {
            $user->fill($data)->save();
            if ($user->role === 'pembeli') {
                $buyer = $user->buyer()->firstOrNew();
                $buyer->fill(['nama_pembeli' => $user->nama, 'email_pembeli' => $user->email, 'no_telepon_pembeli' => $user->no_telepon]);
                if (! $buyer->exists) {
                    $buyer->id_user = $r->user()->id_user;
                }
                $buyer->save();
            }
            if (isset($data['password']) || $emailChanged || $oldRole !== $user->role) {
                if ($user->id_user === $r->user()->id_user) {
                    $r->session()->regenerate(true);
                }
                $user->forceFill(['remember_token' => Str::random(60)])->save();
                DB::table('sessions')->where('user_id', $user->id_user)->where('id', '!=', $r->session()->getId())->delete();
            }
            if ($emailChanged && $oldEmail) {
                DB::table('password_reset_tokens')->where('email', $oldEmail)->delete();
            }
            SecurityEvent::record('account.updated', ['target_id' => $user->id_user, 'old_role' => $oldRole, 'new_role' => $user->role]);
            Activity::record('Pengguna '.$user->nama.' disimpan', 'Pengguna');
        });

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return redirect()->route('admin.users.index')->with('success', 'Pengguna berhasil disimpan.');
    }

    public function reactivate(Request $r, int $id)
    {
        $r->validate(['current_password' => ['required', 'string', 'current_password']]);
        DB::transaction(function () use ($id) {
            $user = User::lockForUpdate()->findOrFail($id);
            if ($user->is_active) {
                return;
            }
            $user->update(['is_active' => true, 'remember_token' => Str::random(60)]);
            DB::table('sessions')->where('user_id', $id)->delete();
            SecurityEvent::record('account.reactivated', ['target_id' => $id]);
            Activity::record('Pengguna '.$user->nama.' diaktifkan kembali', 'Pengguna');
        });

        return redirect()->route('admin.users.index')->with('success', 'Akun berhasil diaktifkan kembali.');
    }

    public function destroy(Request $r, int $id)
    {
        $r->validate(['current_password' => ['required', 'string', 'current_password']]);
        if ($id === $r->user()->id_user) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }
        DB::transaction(function () use ($id) {
            $user = User::lockForUpdate()->findOrFail($id);
            $user->update(['is_active' => false, 'remember_token' => Str::random(60)]);
            DB::table('sessions')->where('user_id', $id)->delete();
            SecurityEvent::record('account.deactivated', ['target_id' => $id]);
            Activity::record('Pengguna '.$user->nama.' dinonaktifkan', 'Pengguna');
        });

        return redirect()->route('admin.users.index')->with('success', 'Akun dinonaktifkan. Riwayat dan data usaha tetap tersimpan.');
    }
}
