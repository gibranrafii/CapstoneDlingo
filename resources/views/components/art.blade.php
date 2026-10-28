@props(['product'])
<div class="photo-placeholder" @if($product->gambar) hidden @endif>{{ \App\Support\Ui::icon('image') }}<span>Foto {{ $product->nama_produk }}</span></div>
@if($product->gambar)<img src="{{ asset('storage/'.$product->gambar) }}" alt="{{ $product->nama_produk }}" data-product-image>@endif
