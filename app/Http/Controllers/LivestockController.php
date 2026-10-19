<?php
namespace App\Http\Controllers;
use App\Models\{Caretaker,Livestock};
use App\Services\{Activity,ContractService};
use App\Support\Ui;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class LivestockController extends Controller {
    public function index(){
        $assignments=ContractService::active()->join('pengurus','pengurus.id_pengurus','=','pengurus_ternak.id_pengurus')->whereNull('pengurus.deleted_at')->select('pengurus_ternak.*','pengurus.nama_pengurus')->get()->groupBy('id_ternak');
        return view('manage.livestock',['animals'=>Livestock::orderBy('id_ternak')->get(),'caretakers'=>Caretaker::whereIsActive(true)->orderBy('id_pengurus')->get(),'assignments'=>$assignments]);
    }
    public function store(Request $r){return $this->save($r,new Livestock(['id_user'=>$r->user()->id_user]));}
    public function update(Request $r,int $id){return $this->save($r,Livestock::findOrFail($id));}
    private function save(Request $r,Livestock $animal){
        $data=$r->validate(['nama_ternak'=>['required','string','max:255'],'nomor_ternak'=>['nullable','string','max:255',Rule::unique('ternak','nomor_ternak')->ignore($animal->id_ternak,'id_ternak')],'kategori_ternak'=>['required','in:Sapi,Kambing'],'usia_ternak'=>['required','integer','min:0','max:1200'],'berat_ternak'=>['required','numeric','min:0','max:10000'],'harga_ternak'=>['required','numeric','min:0','max:999999999999.99','decimal:0,2'],'staff_ids'=>['nullable','array'],'staff_ids.*'=>['integer','distinct','exists:pengurus,id_pengurus']]);
        $ids=$data['staff_ids']??[];unset($data['staff_ids']);
        DB::transaction(function()use($animal,$data,$ids){$animal->fill($data)->save();if(!$animal->nomor_ternak)$animal->update(['nomor_ternak'=>Ui::code('TNK',$animal->id_ternak)]);app(ContractService::class)->sync($animal,$ids);Activity::record('Ternak '.$animal->nama_ternak.' disimpan','Ternak');},3);
        return redirect()->route('manage.livestock.index')->with('success','Ternak berhasil disimpan.');
    }
    public function destroy(int $id){DB::transaction(function()use($id){$animal=Livestock::lockForUpdate()->findOrFail($id);app(ContractService::class)->sync($animal,[]);$animal->delete();Activity::record('Ternak '.$animal->nama_ternak.' diarsipkan','Ternak');});return redirect()->route('manage.livestock.index')->with('success','Ternak dihapus dari daftar aktif; riwayat kontrak disimpan.');}
}
