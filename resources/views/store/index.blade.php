<x-layout page="store" title="Katalog Produk" shell="store">
<x-banner title="Hasil budidaya Desa Dlingo" subtitle="Jamur segar dan kebutuhan budidaya dari petani lokal."/>
<section id="catalog"><x-heading title="Katalog Produk"><span class="muted">{{ $products->total() }} produk</span></x-heading>
<form class="filters" action="{{ route('store') }}#catalog" method="GET" data-filters>
    <input class="input search" type="search" name="q" value="{{ request('q') }}" placeholder="Cari produk jamur…" maxlength="100" aria-label="Cari produk">
    <select class="input" name="category" aria-label="Kategori produk"><option value="">Semua Kategori</option>@foreach(['Jamur','Baglog','Bibit','Olahan'] as $category)<option @selected(request('category')===$category)>{{ $category }}</option>@endforeach</select>
    <select class="input" name="sort" aria-label="Urutkan produk">@foreach(['name'=>'Nama A–Z','price-low'=>'Harga Terendah','price-high'=>'Harga Tertinggi'] as $value=>$label)<option value="{{ $value }}" @selected(request('sort','name')===$value)>{{ $label }}</option>@endforeach</select><button class="button" type="submit">Cari</button>
</form><x-errors/>
@guest<p class="form-note guest-order-note">Katalog dapat dilihat tanpa akun. <a href="{{ route('login') }}">Masuk</a> atau <a href="{{ route('register') }}">daftar</a> untuk membuat pesanan.</p>@endguest
<div class="product-grid">@forelse($products as $product)<x-product-card :product="$product"/>@empty<div class="panel empty-panel span-all">{{ \App\Support\Ui::icon('search') }}<h2>Produk tidak ditemukan</h2><p>Coba kata kunci atau kategori lain.</p><a class="button" href="{{ route('store') }}#catalog">Tampilkan Semua</a></div>@endforelse</div>
{{ $products->links('partials.pagination') }}</section>@include('partials.farm-note')
</x-layout>
