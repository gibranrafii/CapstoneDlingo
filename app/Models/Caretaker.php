<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Caretaker extends Model
{
    use SoftDeletes;

    protected $table = 'pengurus';

    protected $primaryKey = 'id_pengurus';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
