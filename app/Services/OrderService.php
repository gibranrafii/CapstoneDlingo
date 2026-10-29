<?php

namespace App\Services;

use App\Models\Buyer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Support\Ui;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public const STATUSES = ['menunggu', 'dikonfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];

    public function create(User $actor, int $buyerId, array $quantities, string $address, ?string $note = null): Order
    {
        return DB::transaction(function () use ($actor, $buyerId, $quantities, $address, $note) {
            $buyer = Buyer::lockForUpdate()->findOrFail($buyerId);
            abort_unless($actor->is_active && ($actor->isManager() || ($actor->role === 'pembeli' && $buyer->account_user_id === $actor->id_user)), 403);
            $items = [];
            foreach ($quantities as $id => $qty) {
                if (! ctype_digit((string) $id) || filter_var($qty, FILTER_VALIDATE_INT) === false || (int) $qty < 0 || (int) $qty > 1000000) {
                    throw ValidationException::withMessages(['items' => 'Jumlah produk tidak valid.']);
                }
                if ((int) $qty > 0) {
                    $items[(int) $id] = (int) $qty;
                }
            }
            if (! $items) {
                throw ValidationException::withMessages(['items' => 'Pilih minimal satu produk.']);
            }
            ksort($items);
            $products = Product::whereIn('id_produk', array_keys($items))->orderBy('id_produk')->lockForUpdate()->get()->keyBy('id_produk');
            if ($products->count() !== count($items)) {
                throw ValidationException::withMessages(['items' => 'Produk tidak ditemukan.']);
            }
            $lines = [];
            $total = 0;
            foreach ($items as $id => $qty) {
                $p = $products[$id];
                if ($p->stok < $qty) {
                    throw ValidationException::withMessages(['items' => 'Stok '.$p->nama_produk.' tidak mencukupi.']);
                }
                $cents = (int) round((float) $p->harga * 100);
                $subtotal = $cents * $qty;
                $total += $subtotal;
                if ($total > 999999999999) {
                    throw ValidationException::withMessages(['items' => 'Total pesanan melebihi batas.']);
                }
                $lines[] = ['id_produk' => $id, 'nama_produk' => $p->nama_produk, 'satuan' => $p->satuan, 'jumlah' => $qty, 'harga_satuan' => number_format($cents / 100, 2, '.', ''), 'subtotal' => number_format($subtotal / 100, 2, '.', ''), 'created_at' => now(), 'updated_at' => now()];
            }
            $order = Order::create(['id_pembeli' => $buyerId, 'tanggal_pesan' => now(), 'total_harga' => number_format($total / 100, 2, '.', ''), 'alamat_kirim' => $address, 'catatan' => $note, 'status' => 'menunggu', 'created_by' => $actor->id_user]);
            foreach ($lines as &$line) {
                $line['id_pesanan'] = $order->id_pesanan;
            }unset($line);
            DB::table('detail_pesanan')->insert($lines);
            foreach ($items as $id => $qty) {
                $products[$id]->decrement('stok', $qty);
            }
            Activity::record('Pesanan '.Ui::code('PSN', $order->id_pesanan).' ditambahkan', 'Pesanan', $actor);

            return $order;
        }, 3);
    }

    public function transition(User $actor, int $orderId, string $status): Order
    {
        return DB::transaction(function () use ($actor, $orderId, $status) {
            $order = Order::lockForUpdate()->findOrFail($orderId);
            abort_unless($actor->is_active && $order->canBeViewedBy($actor), 403);
            if (! in_array($status, self::STATUSES)) {
                throw ValidationException::withMessages(['status' => 'Status tidak valid.']);
            }
            if (in_array($order->status, ['selesai', 'dibatalkan'])) {
                throw ValidationException::withMessages(['status' => 'Pesanan sudah ditutup.']);
            }
            if ($actor->role === 'pembeli' && ($status !== 'dibatalkan' || ! in_array($order->status, ['menunggu', 'dikonfirmasi']))) {
                abort(403);
            }
            if ($status === $order->status) {
                return $order;
            }
            $steps = array_slice(self::STATUSES, 0, 5);
            if ($status !== 'dibatalkan' && array_search($status, $steps) !== array_search($order->status, $steps) + 1) {
                throw ValidationException::withMessages(['status' => 'Status harus mengikuti urutan proses pesanan.']);
            }
            if ($status === 'dibatalkan') {
                $lines = $order->lines();
                $products = Product::whereIn('id_produk', $lines->pluck('id_produk'))->orderBy('id_produk')->lockForUpdate()->get()->keyBy('id_produk');
                foreach ($lines as $line) {
                    $products[$line->id_produk]->increment('stok', $line->jumlah);
                }
            }
            $order->update(['status' => $status]);
            Activity::record('Pesanan '.Ui::code('PSN', $orderId).': '.$status, 'Pesanan', $actor);

            return $order;
        }, 3);
    }
}
