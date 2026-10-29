<x-layout page="orders" :title="'Pesanan '.\App\Support\Ui::code('PSN',$order->id_pesanan)">
<p class="breadcrumbs"><a href="{{ route(auth()->user()->isManager()?'manage.orders.index':'buyer.orders') }}">Kembali ke pesanan</a></p>
<x-banner :title="'Detail Pesanan '.\App\Support\Ui::code('PSN',$order->id_pesanan)" subtitle="Rincian produk, pengiriman, dan pembayaran pesanan." icon="orders"/>
<section class="panel" aria-label="Rincian pesanan">@include('partials.order-detail')</section>
</x-layout>
