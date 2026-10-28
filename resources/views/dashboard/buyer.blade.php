<x-layout page="buyer" title="Home Pembeli">
<x-banner :title="'Selamat datang, '.auth()->user()->nama.'.'" subtitle="Jamur segar dan kebutuhan budidaya dari petani lokal."/>
<div class="buyer-summaries">
    <section class="panel buyer-summary"><div><small>Pesanan Anda</small><strong class="{{ $pendingOrders?'amber':'' }}">{{ $pendingOrders?$pendingOrders.' pesanan menunggu':'Tidak ada pesanan menunggu' }}</strong></div><a class="subtle-link" href="{{ route('buyer.orders') }}">Lihat Pesanan →</a></section>
    <section class="panel buyer-summary"><div><small>Keranjang</small><strong>{{ $cart->sum('quantity') }} barang · {{ \App\Support\Ui::money($cart->sum('subtotal')) }}</strong></div><a class="subtle-link" href="{{ route('cart') }}">Lihat Keranjang →</a></section>
</div>
@if($orders->isNotEmpty())<p class="form-note latest-order">Pesanan terakhir: <a data-order href="{{ route('orders.show',$orders->first()->id_pesanan) }}">{{ \App\Support\Ui::code('PSN',$orders->first()->id_pesanan) }}</a> · <x-badge :status="$orders->first()->status"/></p>@endif
<section class="section"><x-heading title="Produk pilihan"><a class="subtle-link" href="{{ route('store') }}">Lihat Semua →</a></x-heading><div class="product-grid">@forelse($products as $product)<x-product-card :product="$product"/>@empty<div class="panel empty-panel span-all"><h2>Belum ada produk</h2><p>Produk petani akan ditampilkan di sini.</p><a class="button secondary" href="{{ route('store') }}">Lihat Katalog</a></div>@endforelse</div></section>
@include('partials.farm-note')
</x-layout>
