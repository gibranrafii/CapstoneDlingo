<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
class UserFactory extends Factory {
    protected $model=User::class;
    public function definition(): array {return ['username'=>fake()->unique()->userName(),'nama'=>fake()->name(),'email'=>fake()->unique()->safeEmail(),'password'=>'password123','role'=>'pembeli','is_active'=>true];}
}
