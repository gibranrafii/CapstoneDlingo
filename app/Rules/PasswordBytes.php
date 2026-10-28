<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordBytes implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || strlen($value) > 72) {
            $fail('Kata sandi maksimal 72 byte. Gunakan kata sandi yang lebih pendek.');
        }
    }
}
