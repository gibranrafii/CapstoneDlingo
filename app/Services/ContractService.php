<?php
namespace App\Services;
use App\Models\{Caretaker,Livestock};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class ContractService {
    public static function active() {
        return DB::table('pengurus_ternak')->where('status_kontrak','aktif')->where(fn($q)=>$q->whereNull('waktu_kontrak_akhir')->orWhere('waktu_kontrak_akhir','>',now()));
    }
    public function sync(Livestock $animal,array $ids): void {
        DB::transaction(function()use($animal,$ids){
            Livestock::whereKey($animal->id_ternak)->lockForUpdate()->firstOrFail();
            $ids=array_values(array_unique(array_map('intval',$ids)));
            $current=self::active()->where('id_ternak',$animal->id_ternak)->get();
            $existing=$current->pluck('id_pengurus')->map(fn($id)=>(int)$id)->all();
            $new=array_values(array_diff($ids,$existing));
            if(count($new)!==Caretaker::whereIn('id_pengurus',$new)->where('is_active',true)->count())throw ValidationException::withMessages(['staff_ids'=>'Pilih pengurus aktif yang valid.']);
            $time=now()->format('Y-m-d H:i:s.u');
            foreach($current as $contract)if(!in_array((int)$contract->id_pengurus,$ids)) {
                DB::table('pengurus_ternak')->where('id_pengurus',$contract->id_pengurus)->where('id_ternak',$contract->id_ternak)->where('waktu_kontrak_awal',$contract->waktu_kontrak_awal)->update(['waktu_kontrak_akhir'=>$time,'status_kontrak'=>'selesai','updated_at'=>now()]);
            }
            foreach($new as $id)DB::table('pengurus_ternak')->insert(['id_pengurus'=>$id,'id_ternak'=>$animal->id_ternak,'waktu_kontrak_awal'=>$time,'waktu_kontrak_akhir'=>null,'status_kontrak'=>'aktif','created_at'=>now(),'updated_at'=>now()]);
        },3);
    }
    public function endCaretaker(int $id): void { self::active()->where('id_pengurus',$id)->update(['waktu_kontrak_akhir'=>now()->format('Y-m-d H:i:s.u'),'status_kontrak'=>'selesai','updated_at'=>now()]); }
}
