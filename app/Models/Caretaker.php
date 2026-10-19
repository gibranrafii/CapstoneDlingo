<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Caretaker extends Model {
    use \Illuminate\Database\Eloquent\SoftDeletes;
    protected $table='pengurus';
    protected $primaryKey='id_pengurus';
    protected $guarded=[];
    protected function casts(): array { return ['is_active'=>'boolean']; }

}
