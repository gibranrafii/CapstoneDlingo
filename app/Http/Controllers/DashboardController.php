<?php
namespace App\Http\Controllers;
use App\Models\{Buyer,Caretaker,Livestock,Order,Product,User};
use App\Support\Ui;
use Illuminate\Support\Facades\DB;
class DashboardController extends Controller {
    private function farmMetrics():array {
        $herd=Livestock::selectRaw("COUNT(*) total,SUM(kategori_ternak='Sapi') cattle,SUM(kategori_ternak='Kambing') goats")->first();
        $orders=Order::selectRaw("COUNT(*) total,COALESCE(SUM(CASE WHEN status='selesai' THEN total_harga ELSE 0 END),0) income")->first();
        return compact('herd','orders')+['products'=>Product::count(),'caretakers'=>Caretaker::where('is_active',true)->count(),'activities'=>DB::table('activity_logs')->latest('id')->limit(3)->get()];
    }
    public function farmer(){return view('dashboard.farmer',$this->farmMetrics()+['buyers'=>Buyer::count()]);}

    public function admin(){
        $users=User::where('is_active',true)->get();
        return view('dashboard.admin',$this->farmMetrics()+['users'=>$users]);
    }

    public function buyer(\Illuminate\Http\Request $r,\App\Services\CartService $cart){
        $query=Order::whereHas('buyer',fn($q)=>$q->where('account_user_id',$r->user()->id_user));
        return view('dashboard.buyer',['orders'=>(clone $query)->latest('id_pesanan')->limit(5)->get(),'counts'=>(clone $query)->selectRaw("COUNT(*) total,SUM(status='selesai') completed,COALESCE(SUM(CASE WHEN status!='dibatalkan' THEN total_harga ELSE 0 END),0) spent")->first(),'cart'=>$cart->items($r)]);
    }
}
