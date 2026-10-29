<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use App\Models\FarmSetting;
use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrdersController extends Controller
{
    public function index()
    {
        return view('manage.orders', ['orders' => Order::with('buyer')->latest('id_pesanan')->paginate(20), 'counts' => Order::selectRaw("COUNT(*) total,SUM(status='menunggu') waiting,SUM(status='dikirim') shipped,SUM(status='selesai') completed")->first(), 'buyers' => Buyer::orderBy('id_pembeli')->get(), 'products' => Product::orderBy('id_produk')->get()]);
    }

    public function store(Request $r, OrderService $service)
    {
        $data = $r->validate(['id_pembeli' => ['required', 'integer', 'exists:pembeli,id_pembeli'], 'alamat_kirim' => ['required', 'string', 'max:255'], 'catatan' => ['nullable', 'string', 'max:255'], 'items' => ['required', 'array'], 'items.*' => ['nullable', 'integer', 'min:0', 'max:1000000']]);
        $service->create($r->user(), (int) $data['id_pembeli'], $data['items'], $data['alamat_kirim'], $data['catatan'] ?? null);

        return redirect()->route('manage.orders.index')->with('success', 'Pesanan berhasil ditambahkan.');
    }

    public function show(Request $r, int $id)
    {
        $order = Order::with('buyer')->findOrFail($id);
        abort_unless($order->canBeViewedBy($r->user()), 403);

        $response = response()->view($r->ajax() ? 'partials.order-detail' : 'orders.show', ['order' => $order, 'lines' => $order->lines(), 'farm' => app(FarmSetting::class)])
            ->header('Vary', 'X-Requested-With');
        if ($r->ajax()) {
            $response->header('X-Dlingo-Order', '1');
        }

        return $response;
    }

    public function transition(Request $r, int $id, OrderService $service)
    {
        $data = $r->validate(['status' => ['required', Rule::in(OrderService::STATUSES)]]);
        $service->transition($r->user(), $id, $data['status']);

        return redirect()->route('manage.orders.index')->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function cancel(Request $r, int $id, OrderService $service)
    {
        $service->transition($r->user(), $id, 'dibatalkan');

        return redirect()->route('buyer.orders')->with('success', 'Pesanan dibatalkan. Stok telah dikembalikan.');
    }
}
