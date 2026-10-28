<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Rules\PasswordBytes;
use App\Services\SecurityEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateAdministrator extends Command
{
    protected $signature = 'security:create-admin';

    protected $description = 'Create an administrator interactively, without default credentials';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('Use an interactive terminal. Passwords must not be supplied as arguments.');

            return self::FAILURE;
        }
        $data = [
            'nama' => $this->ask('Nama lengkap'),
            'username' => $this->ask('Username'),
            'email' => $this->ask('Email'),
            'password' => $this->secret('Kata sandi (minimal 12 karakter, maksimal 72 byte)'),
            'password_confirmation' => $this->secret('Ulangi kata sandi'),
        ];
        $validator = Validator::make($data, [
            'nama' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:user,username'],
            'email' => ['required', 'email', 'max:255', 'unique:user,email'],
            'password' => ['required', 'string', 'min:12', new PasswordBytes, 'confirmed'],
        ]);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }
        unset($data['password_confirmation']);
        $user = User::create($data + ['role' => 'admin', 'is_active' => true]);
        SecurityEvent::record('account.bootstrapped', ['target_id' => $user->id_user]);
        $user->sendEmailVerificationNotification();
        $this->info('Administrator created. Sign in at /admin/login.');

        return self::SUCCESS;
    }
}
