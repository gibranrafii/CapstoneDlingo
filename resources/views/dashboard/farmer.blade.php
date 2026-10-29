<x-layout page="farmer" title="Dashboard Petani">
<x-banner :title="'Selamat datang, '.auth()->user()->nama" subtitle="Kelola produk, pesanan, dan peternakan Anda dari satu tempat."/>
<x-stats :items="[['',$products,'Produk','','Tersedia di katalog'],['',$orders->total,'Pesanan','',$pendingOrders.' pesanan menunggu'],['',$herd->total,'Total Ternak','',($herd->cattle??0).' sapi · '.($herd->goats??0).' kambing'],['',\App\Support\Ui::money($orders->income),'Pemasukan','green','Dari pesanan selesai']]"/>
<section class="section"><x-heading title="Menu Utama"/><div class="menu-grid">
<x-tile label="Kelola Produk" :href="route('manage.products.index')" icon="product"/><x-tile label="Kelola Stok" :href="route('manage.stock')" icon="stock"/><x-tile label="Pesanan" :href="route('manage.orders.index')" icon="orders"/>
<x-tile label="Pembeli" :href="route('manage.buyers.index')" icon="cart"/><x-tile label="Kelola Ternak" :href="route('manage.livestock.index')" icon="leaf"/><x-tile label="Pengurus" :href="route('manage.caretakers.index')" icon="users"/>
</div><div class="profile-actions"><button type="button" class="button secondary" data-open="bank">{{ \App\Support\Ui::icon('bank') }}Rekening</button><button type="button" class="button secondary" data-open="history">{{ \App\Support\Ui::icon('history') }}Riwayat</button><a class="button secondary" href="{{ \App\Support\Ui::profileUrl() }}">Profil Saya</a></div></section>
@include('partials.staff-overview')
</x-layout>
