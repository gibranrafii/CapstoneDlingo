<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartService
{
    private function key(Request $r): string
    {
        return 'cart.'.$r->user()->id_user;
    }

    public function quantities(Request $r): array
    {
        return $r->session()->get($this->key($r), []);
    }

    public function items(Request $r)
    {
        $quantities = $this->quantities($r);
        $products = Product::whereIn('id_produk', array_keys($quantities))->orderBy('id_produk')->get();
        $this->prune($r, $quantities, $products->modelKeys());

        return $products->map(fn ($p) => ['product' => $p, 'quantity' => (int) $quantities[$p->id_produk], 'subtotal' => (int) round((float) $p->harga * 100) * (int) $quantities[$p->id_produk] / 100]);
    }

    public function set(Request $r, int $id, int $quantity, bool $add = false): void
    {
        $cart = $this->quantities($r);
        if ($add) {
            $quantity += (int) ($cart[$id] ?? 0);
        }
        if ($quantity > 1000000) {
            throw ValidationException::withMessages(['quantity' => 'Jumlah produk melebihi batas.']);
        }
        if ($quantity > 0) {
            $product = Product::findOrFail($id);
            if ($quantity > $product->stok) {
                throw ValidationException::withMessages(['quantity' => 'Stok '.$product->nama_produk.' tidak mencukupi.']);
            }$cart[$id] = $quantity;
        } else {
            unset($cart[$id]);
        }
        $r->session()->put($this->key($r), $cart);
    }

    private function prune(Request $r, array $quantities, array $ids): void
    {
        $r->session()->put($this->key($r), array_intersect_key($quantities, array_flip($ids)));
    }

    public function clear(Request $r): void
    {
        $r->session()->forget($this->key($r));
    }
}
