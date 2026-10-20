<x-layout page="farmer" title="Dashboard Petani"><x-banner :title="'Selamat Datang, '.auth()->user()->nama" subtitle="Kelola produk, stok, pesanan, dan ternak Anda dari sini." icon="leaf"><x-slot:action><a class="button white" href="{{ route('manage.products.index') }}">Lihat Semua</a></x-slot:action></x-banner>
<x-stats :items="[['🐄',$herd->total,'Total Ternak'],['🐂',$herd->cattle??0,'Sapi'],['🐐',$herd->goats??0,'Kambing'],['👥',$caretakers,'Pengurus'],['📦',$products,'Produk'],['📋',$orders->total,'Pesanan'],['💳',$buyers,'Pembeli'],['💰',\App\Support\Ui::money($orders->income),'Pemasukan','green']]"/>
<section class="section"><x-heading title="Menu Utama" compact/><div class="menu-grid">
<x-tile label="Kelola Produk" :href="route('manage.products.index')" icon="product"/><x-tile label="Pembeli" :href="route('manage.buyers.index')" icon="cart" tone="purple"/>
<x-tile label="Kelola Stok" :href="route('manage.stock')" icon="stock" tone="green"/><x-tile label="Pesanan" :href="route('manage.orders.index')" icon="orders" tone="yellow"/>
<x-tile label="Profil Saya" :href="route('profile')" icon="user" tone="purple"/><x-tile label="Kelola Ternak" :href="route('manage.livestock.index')" icon="leaf" tone="green"/>
<x-tile label="Pengurus" :href="route('manage.caretakers.index')" icon="users" tone="orange"/><x-tile label="Rekening" target="bank" icon="bank" tone="teal"/>
<x-tile label="Riwayat" target="history" icon="history" tone="pink"/><x-tile label="Upload File" target="upload" icon="upload" tone="sky"/>
</div></section><section class="section activity-box"><h2>Aktivitas Terbaru</h2>@include('partials.activity',['activities'=>$activities->take(1)])</section></x-layout>
