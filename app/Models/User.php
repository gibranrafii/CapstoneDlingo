<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory, Notifiable;

    protected $table = 'user';

    protected $primaryKey = 'id_user';

    protected $guarded = [];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'is_active' => 'boolean'];
    }

    public function buyer()
    {
        return $this->hasOne(Buyer::class, 'account_user_id');
    }

    public function isManager(): bool
    {
        return $this->is_active && in_array($this->role, ['admin', 'petani']);
    }
}
