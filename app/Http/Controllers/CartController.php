<?php

namespace App\Http\Controllers;

use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $r, CartService $cart)
    {
        $items = $cart->items($r);

        return view('store.cart', ['items' => $items, 'buyer' => $r->user()->buyer, 'total' => $items->sum('subtotal')]);
    }

    public function add(Request $r, int $id, CartService $cart)
    {
        $data = $r->validate(['quantity' => ['required', 'integer', 'min:1', 'max:1000000']]);
        $cart->set($r, $id, (int) $data['quantity'], true);

        return back()->with('success', 'Produk ditambahkan ke keranjang.');
    }

    public function update(Request $r, int $id, CartService $cart)
    {
        $data = $r->validate(['quantity' => ['required', 'integer', 'min:0', 'max:1000000']]);
        $cart->set($r, $id, (int) $data['quantity']);

        return redirect()->route('cart');
    }

    public function checkout(Request $r, CartService $cart, OrderService $orders)
    {
        $data = $r->validate(['alamat_kirim' => ['required', 'string', 'max:255'], 'catatan' => ['nullable', 'string', 'max:255']]);
        $buyer = $r->user()->buyer;
        abort_unless($buyer, 403);
        $cart->items($r);
        $order = $orders->create($r->user(), $buyer->id_pembeli, $cart->quantities($r), $data['alamat_kirim'], $data['catatan'] ?? null);
        $cart->clear($r);

        return redirect()->route('buyer.orders', ['order' => $order->id_pesanan])->with('success','Pesanan berhasil dibuat. Silakan transfer ke rekening petani.');
    }
}
