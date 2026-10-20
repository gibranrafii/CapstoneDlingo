<?php

namespace App\Http\Controllers;

use App\Models\FarmSetting;
use App\Models\Product;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $r)
    {
        $data = $r->validate(['q' => ['nullable', 'string', 'max:100'], 'category' => ['nullable', 'in:Jamur,Baglog,Bibit,Olahan'], 'sort' => ['nullable', 'in:name,price-low,price-high']]);
        $query = Product::query();
        $search = trim($data['q'] ?? '');
        if ($search !== '') {
            $query->where(fn ($q) => $q->where('nama_produk', 'like', '%'.$search.'%')->orWhere('deskripsi', 'like', '%'.$search.'%'));
        }
        if (! empty($data['category'])) {
            $query->where('kategori', $data['category']);
        }
        match ($data['sort'] ?? 'name') {
            'price-low' => $query->orderBy('harga'),'price-high' => $query->orderByDesc('harga'),default => $query->orderBy('nama_produk')
        };

        return view('store.index', ['products' => $query->orderBy('id_produk')->paginate(12)->withQueryString()]);
    }

    public function show(int $id)
    {
        return view('store.show', ['product' => Product::findOrFail($id), 'farm' => app(FarmSetting::class)]);
    }
}
