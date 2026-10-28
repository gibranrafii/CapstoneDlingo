<?php

namespace App\Models;

use App\Services\SecurityEvent;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $table = 'user';

    protected $primaryKey = 'id_user';

    protected $guarded = [];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'is_active' => 'boolean', 'email_verified_at' => 'datetime'];
    }

    public function sendEmailVerificationNotification(): void
    {
        try {
            $this->notify(new VerifyEmail);
        } catch (\Throwable $error) {
            SecurityEvent::record('verification.delivery_failed', ['target_id' => $this->id_user, 'exception_class' => $error::class]);
        }
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
