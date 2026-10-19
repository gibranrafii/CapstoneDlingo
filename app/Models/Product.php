<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Product extends Model {

    protected $table='product';
    protected $primaryKey='id_produk';
    protected $guarded=[];
    protected function casts(): array { return ['harga'=>'decimal:2','stok'=>'integer']; }

}
