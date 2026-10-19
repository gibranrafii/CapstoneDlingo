<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Services\ContractService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
class LivestockTest extends TestCase {
    use DatabaseTransactions;
    public function test_assignments_close_old_contracts_and_keep_their_composite_history():void{
        $this->actingAs(User::find(2))->get('/manage/livestock')->assertOk()->assertSee('Sapi Brahman');
        $this->put('/manage/livestock/2',['nama_ternak'=>'Sapi Brahman','nomor_ternak'=>'TNK-002','kategori_ternak'=>'Sapi','usia_ternak'=>24,'berat_ternak'=>280,'harga_ternak'=>12000000,'staff_ids'=>[1]])->assertRedirect();
        $this->assertSame([1],ContractService::active()->where('id_ternak',2)->pluck('id_pengurus')->all());
        $this->assertSame(2,DB::table('pengurus_ternak')->where('id_ternak',2)->count());
        $this->delete('/manage/livestock/2')->assertRedirect();$this->assertSoftDeleted('ternak',['id_ternak'=>2]);$this->assertSame(0,ContractService::active()->where('id_ternak',2)->count());
    }
}
