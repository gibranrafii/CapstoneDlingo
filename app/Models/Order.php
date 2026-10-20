<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Order extends Model {

    protected $table='pesanan';
    protected $primaryKey='id_pesanan';
    protected $guarded=[];
    protected function casts(): array { return ['tanggal_pesan'=>'datetime','total_harga'=>'decimal:2']; }
    public function buyer() { return $this->belongsTo(Buyer::class,'id_pembeli'); }
    public function lines() { return \Illuminate\Support\Facades\DB::table('detail_pesanan')->leftJoin('product','product.id_produk','=','detail_pesanan.id_produk')->where('id_pesanan',$this->id_pesanan)->select('detail_pesanan.*')->selectRaw('COALESCE(detail_pesanan.nama_produk,product.nama_produk) AS nama_produk, COALESCE(detail_pesanan.satuan,product.satuan) AS satuan')->get(); }
    public function canBeViewedBy(User $user): bool { return $user->isManager() || ($user->role==='pembeli' && $this->buyer?->account_user_id===$user->id_user); }
}
