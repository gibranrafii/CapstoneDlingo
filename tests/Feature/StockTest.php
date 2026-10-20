<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class StockTest extends TestCase
{
    use DatabaseTransactions;

    public function test_stock_page_uses_current_database_values(): void
    {
        $this->actingAs(User::find(2))->get('/manage/stock')->assertOk()->assertSee('183')->assertSee('Jamur Kuping');
        Product::find(2)->update(['stok' => 15]);
        $this->get('/manage/stock')->assertOk()->assertSee('190')->assertSee('STOK MENIPIS (0)');
        $this->actingAs(User::find(3))->get('/manage/stock')->assertForbidden();
    }
}
