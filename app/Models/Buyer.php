<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Buyer extends Model {

    protected $table='pembeli';
    protected $primaryKey='id_pembeli';
    protected $guarded=[];
    protected function casts(): array { return []; }
    public function orders() { return $this->hasMany(Order::class,'id_pembeli'); }
    public function account() { return $this->belongsTo(User::class,'account_user_id'); }
}
