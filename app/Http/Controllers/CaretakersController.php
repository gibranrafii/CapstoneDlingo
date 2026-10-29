<?php

namespace App\Http\Controllers;

use App\Models\Caretaker;
use App\Services\Activity;
use App\Services\ContractService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CaretakersController extends Controller
{
    public function index()
    {
        $assignments = ContractService::active()->join('ternak', 'ternak.id_ternak', '=', 'pengurus_ternak.id_ternak')->whereNull('ternak.deleted_at')->get();

        return view('manage.caretakers', ['caretakers' => Caretaker::orderBy('id_pengurus')->get(), 'assignments' => $assignments]);
    }

    public function store(Request $r)
    {
        return $this->save($r, new Caretaker(['id_user' => $r->user()->id_user]));
    }

    public function update(Request $r, int $id)
    {
        return $this->save($r, Caretaker::findOrFail($id));
    }

    private function save(Request $r, Caretaker $staff)
    {
        $data = $r->validate(['nama_pengurus' => ['required', 'string', 'max:255'], 'no_telepon_pengurus' => ['nullable', 'string', 'max:50'], 'email_pengurus' => ['nullable', 'email', 'max:255'], 'alamat_pengurus' => ['nullable', 'string', 'max:255'], 'is_active' => ['required', 'boolean']]);
        DB::transaction(function () use ($staff, $data) {
            $staff->fill($data)->save();
            if (! $staff->is_active) {
                app(ContractService::class)->endCaretaker($staff->id_pengurus);
            }Activity::record('Pengurus '.$staff->nama_pengurus.' disimpan', 'Pengurus');
        });

        return redirect()->route('manage.caretakers.index')->with('success', 'Pengurus berhasil disimpan.');
    }

    public function destroy(int $id)
    {
        DB::transaction(function () use ($id) {
            $staff = Caretaker::lockForUpdate()->findOrFail($id);
            app(ContractService::class)->endCaretaker($id);
            $staff->delete();
            Activity::record('Pengurus '.$staff->nama_pengurus.' diarsipkan', 'Pengurus');
        });

        return redirect()->route('manage.caretakers.index')->with('success', 'Pengurus dihapus dari daftar aktif; riwayat kontrak disimpan.');
    }
}
