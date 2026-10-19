<?php
namespace App\Http\Controllers;
use App\Models\Product;
use App\Services\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB,Storage};
class ProductsController extends Controller {
    public function stock(){return view('manage.stock',['products'=>Product::orderBy('id_produk')->get()]);}
    public function index(){return view('manage.products',['products'=>Product::orderBy('id_produk')->get()]);}
    public function store(Request $r){return $this->save($r,new Product(['id_user'=>$r->user()->id_user]));}
    public function update(Request $r,int $id){return $this->save($r,Product::findOrFail($id));}
    private function save(Request $r,Product $product){
        $data=$r->validate(['nama_produk'=>['required','string','max:255'],'deskripsi'=>['nullable','string','max:255'],'kategori'=>['required','in:Jamur,Baglog,Bibit,Olahan'],'harga'=>['required','numeric','min:0','max:9999999999.99','decimal:0,2'],'satuan'=>['required','in:kg,pcs,pack,baglog'],'stok'=>['required','integer','min:0','max:2147483647'],'gambar'=>['nullable','image','mimes:jpeg,png,webp','max:2048'],'remove_image'=>['nullable','boolean']]);
        unset($data['gambar'],$data['remove_image']);$old=$product->gambar;$path=$r->file('gambar')?->store('products','public');
        if($path)$data['gambar']=$path;elseif($r->boolean('remove_image'))$data['gambar']=null;
        try{DB::transaction(function()use($product,$data){$product->fill($data)->save();Activity::record('Produk '.$product->nama_produk.' disimpan','Produk');});}
        catch(\Throwable $error){if($path)Storage::disk('public')->delete($path);throw $error;}
        if($old&&($path||$r->boolean('remove_image')))Storage::disk('public')->delete($old);
        return redirect()->route('manage.products.index')->with('success','Produk berhasil disimpan.');
    }
    public function destroy(int $id){
        $product=Product::findOrFail($id);
        if(DB::table('detail_pesanan')->where('id_produk',$id)->exists())return back()->with('error','Produk sudah tercatat dalam pesanan dan tidak dapat dihapus.');
        DB::transaction(function()use($product){Activity::record('Produk '.$product->nama_produk.' dihapus','Produk');$product->delete();});
        if($product->gambar)Storage::disk('public')->delete($product->gambar);
        return redirect()->route('manage.products.index')->with('success','Produk berhasil dihapus.');
    }
}
