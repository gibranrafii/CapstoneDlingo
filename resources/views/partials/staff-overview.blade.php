@if($lowStock->isNotEmpty())
<section class="stock-warning"><h2>Stok menipis</h2><p>@foreach($lowStock as $product){{ $product->nama_produk }}: {{ $product->stok }} {{ $product->satuan }}{{ $loop->last?'.':'; ' }}@endforeach</p><a class="subtle-link" href="{{ route('manage.stock') }}">Kelola Stok →</a></section>
@endif
<div class="dashboard-columns"><section class="panel"><x-heading title="Pesanan terbaru"><a class="subtle-link" href="{{ route('manage.orders.index') }}">Lihat Semua</a></x-heading>
<div class="dashboard-orders">@forelse($recentOrders as $order)<a class="dashboard-order" data-order href="{{ route('orders.show',$order->id_pesanan) }}"><span><b>{{ \App\Support\Ui::code('PSN',$order->id_pesanan) }}</b><small>{{ $order->buyer->nama_pembeli }}</small></span><span><b>{{ \App\Support\Ui::money($order->total_harga) }}</b><br><x-badge :status="$order->status"/></span></a>@empty<p class="muted">Belum ada pesanan.</p>@endforelse</div></section>
<section class="panel"><h2>Ringkasan peternakan</h2><dl>@foreach([['Sapi',$herd->cattle??0],['Kambing',$herd->goats??0],['Pengurus',$caretakers],['Pembeli',$buyers]] as [$label,$value])<div class="summary-line"><dt>{{ $label }}</dt><dd>{{ $value }}</dd></div>@endforeach</dl></section></div>
<section class="section activity-box"><h2>Aktivitas Terbaru</h2>@include('partials.activity',['activities'=>$activities])</section>
