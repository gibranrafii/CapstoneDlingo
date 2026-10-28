<?php

namespace App\Http\Controllers;

use App\Models\FarmSetting;
use App\Services\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function update(Request $r)
    {
        $r->validate(['current_password' => ['required', 'string', 'current_password']]);
        $data = $r->validate(['nama' => ['required', 'string', 'max:255'], 'alamat' => ['nullable', 'string', 'max:255'], 'no_telepon' => ['nullable', 'string', 'max:50'], 'nama_bank' => ['required', 'string', 'max:100'], 'no_rekening' => ['required', 'string', 'max:50'], 'atas_nama' => ['required', 'string', 'max:255']]);
        DB::transaction(function () use ($data) {
            FarmSetting::updateOrCreate(['id' => 1], $data);
            Activity::record('Informasi rekening dan usaha diperbarui', 'Rekening');
        });

        return back()->with('success', 'Informasi usaha berhasil diperbarui.');
    }
}
