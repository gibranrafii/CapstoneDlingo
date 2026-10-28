<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_dashboard_is_admin_only_and_excludes_inactive_accounts(): void
    {
        User::find(3)->update(['is_active' => false]);
        $this->actingAs(User::find(1))->get('/admin')->assertOk()->assertSee('Total Pengguna')->assertDontSee('andi@dlingo.test');
        $this->actingAs(User::find(3))->get('/admin')->assertRedirect('/login');
    }
}
