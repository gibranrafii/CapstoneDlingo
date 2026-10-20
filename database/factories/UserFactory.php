<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return ['username' => fake()->unique()->userName(), 'nama' => fake()->name(), 'email' => fake()->unique()->safeEmail(), 'password' => 'password123', 'role' => 'pembeli', 'is_active' => true];
    }
}
