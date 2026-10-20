<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ContractService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CaretakersTest extends TestCase
{
    use DatabaseTransactions;

    public function test_archiving_caretakers_closes_contracts_without_erasing_history(): void
    {
        $this->actingAs(User::find(2))->get('/manage/caretakers')->assertOk()->assertSee('Slamet Riyadi');
        $this->delete('/manage/caretakers/1')->assertRedirect();
        $this->assertSoftDeleted('pengurus', ['id_pengurus' => 1]);
        $this->assertSame(0, ContractService::active()->where('id_pengurus', 1)->count());
        $this->assertSame(2, DB::table('pengurus_ternak')->where('id_pengurus', 1)->count());
    }
}
