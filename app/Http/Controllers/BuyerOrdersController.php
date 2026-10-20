<?php
namespace App\Http\Controllers;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class BuyerOrdersController extends Controller {
    public function index(Request $r){
        $data=$r->validate(['status'=>['nullable',Rule::in(OrderService::STATUSES)]]);
        $query=Order::whereHas('buyer',fn($q)=>$q->where('account_user_id',$r->user()->id_user));
        $counts=(clone $query)->selectRaw("COUNT(*) total,SUM(status IN ('menunggu','dikonfirmasi','diproses')) processing,SUM(status='dikirim') shipped,SUM(status='selesai') completed")->first();
        $orders=$query->when($data['status']??null,fn($q,$status)=>$q->where('status',$status))->latest('id_pesanan')->paginate(20)->withQueryString();
        $lines=DB::table('detail_pesanan as d')->leftJoin('product as p','p.id_produk','=','d.id_produk')->whereIn('d.id_pesanan',$orders->modelKeys())->selectRaw('d.id_pesanan,d.jumlah,COALESCE(d.nama_produk,p.nama_produk) nama_produk')->get()->groupBy('id_pesanan');
        return view('store.orders',compact('orders','counts','lines'));
    }
}
