<?php

require __DIR__.'/bootstrap-database.php';
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

if (($argv[1] ?? '') === '--worker') {
    $action = $argv[2];
    $id = (int) $argv[3];
    $start = (float) $argv[4];
    $buyerId = (int) ($argv[5] ?? 1);
    while (microtime(true) < $start) {
        usleep(10000);
    }
    try {
        $service = app(OrderService::class);
        $actor = User::findOrFail(2);
        $order = $action === 'create' ? $service->create($actor, $buyerId, [$id => 1], 'Concurrency test') : $service->transition($actor, $id, 'dibatalkan');
        echo json_encode(['result' => 'ok', 'order' => $order->id_pesanan]);
    } catch (ValidationException $e) {
        echo json_encode(['result' => 'rejected']);
    }
    exit;
}
function race(string $action, int $id): array
{
    $processes = [];
    $start = microtime(true) + 2;
    for ($i = 0; $i < 2; $i++) {
        $process = proc_open([PHP_BINARY, __FILE__, '--worker', $action, (string) $id, (string) $start, (string) ($i + 1)], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (! is_resource($process)) {
            throw new RuntimeException('Worker did not start');
        }
        fclose($pipes[0]);
        $processes[] = [$process, $pipes];
    }
    $results = [];
    foreach ($processes as [$process,$pipes]) {
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        if (proc_close($process) !== 0) {
            throw new RuntimeException('Worker failed: '.$errors);
        }
        $results[] = json_decode($output, true, flags: JSON_THROW_ON_ERROR);
    }

    return $results;
}
$product = Product::create(['id_user' => 2, 'nama_produk' => 'Concurrent stock fixture', 'harga' => 15000, 'stok' => 1, 'kategori' => 'Jamur', 'satuan' => 'kg']);
$logId = DB::table('activity_logs')->max('id') ?? 0;
try {
    $checkout = race('create', $product->id_produk);
    if (count(array_filter($checkout, fn ($r) => $r['result'] === 'ok')) !== 1 || $product->fresh()->stok !== 0) {
        throw new RuntimeException('Checkout race oversold stock');
    }
    $orderId = array_values(array_filter($checkout, fn ($r) => $r['result'] === 'ok'))[0]['order'];
    $cancel = race('cancel', $orderId);
    if (count(array_filter($cancel, fn ($r) => $r['result'] === 'ok')) !== 1 || $product->fresh()->stok !== 1) {
        throw new RuntimeException('Cancellation race restored stock twice');
    }
    echo json_encode(['checkout' => $checkout, 'cancellation' => $cancel, 'stock' => $product->fresh()->stok])."\n";
} finally {
    $ids = DB::table('detail_pesanan')->where('id_produk', $product->id_produk)->pluck('id_pesanan');
    Order::whereIn('id_pesanan', $ids)->delete();
    $product->delete();
    DB::table('activity_logs')->where('id', '>', $logId)->where('category', 'Pesanan')->delete();
}
