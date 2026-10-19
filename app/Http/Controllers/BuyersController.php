<?php
namespace App\Http\Controllers;
use App\Models\{Buyer,Order};
use App\Services\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class BuyersController extends Controller {
    public function index(){return view('manage.buyers',['buyers'=>Buyer::withCount(['orders','orders as active_orders_count'=>fn($q)=>$q->where('status','!=','dibatalkan')])->orderBy('id_pembeli')->get(),'orderCount'=>Order::count()]);}
    public function store(Request $r){return $this->save($r,new Buyer(['id_user'=>$r->user()->id_user]));}
    public function update(Request $r,int $id){return $this->save($r,Buyer::findOrFail($id));}
    private function save(Request $r,Buyer $buyer){
        $data=$r->validate(['nama_pembeli'=>['required','string','max:255'],'no_telepon_pembeli'=>['nullable','string','max:50'],'email_pembeli'=>['nullable','email','max:255'],'alamat_pembeli'=>['nullable','string','max:255']]);
        DB::transaction(function()use($buyer,$data){$buyer->fill($data)->save();Activity::record('Pembeli '.$buyer->nama_pembeli.' disimpan','Pembeli');});
        return redirect()->route('manage.buyers.index')->with('success','Pembeli berhasil disimpan.');
    }
    public function destroy(int $id){
        $buyer=Buyer::findOrFail($id);
        if($buyer->account_user_id||$buyer->orders()->exists())return back()->with('error','Pembeli terhubung dengan akun atau pesanan dan tidak dapat dihapus.');
        DB::transaction(function()use($buyer){Activity::record('Pembeli '.$buyer->nama_pembeli.' dihapus','Pembeli');$buyer->delete();});
        return redirect()->route('manage.buyers.index')->with('success','Pembeli berhasil dihapus.');
    }
}
