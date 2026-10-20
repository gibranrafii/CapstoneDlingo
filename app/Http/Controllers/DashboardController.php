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
}
