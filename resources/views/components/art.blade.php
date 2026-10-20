@props(['product'])
@if($product->gambar)<img src="{{ asset('storage/'.$product->gambar) }}" alt="{{ $product->nama_produk }}" style="width:100%;height:100%;object-fit:cover">
@else @php $art=\App\Support\Ui::art($product); @endphp @include('illustrations.'.$art) @endif
