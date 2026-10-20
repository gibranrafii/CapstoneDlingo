<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FarmSetting extends Model
{
    protected $guarded = [];

    public static function current(): self
    {
        return static::find(1) ?? new static(['nama' => 'JamurTani Desa Dlingo', 'alamat' => 'Desa Dlingo, Imogiri']);
    }
}
