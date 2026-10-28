@props(['product'])
<article class="product-card">
    <a class="product-art" href="{{ route('products.show',$product->id_produk) }}" aria-label="Lihat {{ $product->nama_produk }}"><x-art :product="$product"/></a>
    <div class="product-card-body">
        <h3>{{ $product->nama_produk }}</h3>
        <p>{{ $product->kategori }} · {{ $product->satuan }}</p>
        <div class="product-price">{{ \App\Support\Ui::money($product->harga) }}</div>
        <small class="{{ $product->stok===0?'red':($product->stok<10?'amber':'green') }}">{{ $product->stok===0?'Stok habis':'Stok '.$product->stok.' '.$product->satuan }}</small>
        <div class="product-actions">
            <a class="button secondary" href="{{ route('products.show',$product->id_produk) }}">Detail</a>
            @if(!auth()->check() || auth()->user()->role==='pembeli')
                @if(!$product->stok)<button class="button" disabled>Stok habis</button>
                @elseif(auth()->check())
                    <form method="POST" action="{{ route('cart.add',$product->id_produk) }}">@csrf<input type="hidden" name="quantity" value="1"><button class="button" type="submit">Tambah ke keranjang</button></form>
                @else<a class="button" href="{{ route('login') }}">Tambah ke keranjang</a>@endif
            @endif
        </div>
    </div>
</article>
