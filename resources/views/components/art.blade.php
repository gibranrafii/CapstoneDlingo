@props(['product'])
@if($product->gambar)<img src="{{ asset('storage/'.$product->gambar) }}" alt="{{ $product->nama_produk }}" style="width:100%;height:100%;object-fit:cover">
@else @php($art=$product->kategori==='Baglog'?'baglog':(str_contains(mb_strtolower($product->nama_produk),'kuping')?'kuping':'tiram')) @include('illustrations.'.$art) @endif
