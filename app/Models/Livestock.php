<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Livestock extends Model
{
    use SoftDeletes;

    protected $table = 'ternak';

    protected $primaryKey = 'id_ternak';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['usia_ternak' => 'integer', 'berat_ternak' => 'float', 'harga_ternak' => 'decimal:2'];
    }
}
