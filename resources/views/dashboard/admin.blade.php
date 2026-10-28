<x-layout page="admin" title="Dashboard Administrator">
<x-banner title="Dashboard Administrator" subtitle="Kelola pengguna, produk, pesanan, dan peternakan Desa Dlingo."><x-slot:action><a class="button" href="{{ route('admin.users.index') }}">Kelola Pengguna</a></x-slot:action></x-banner>
<x-stats :items="[['',$users->count(),'Total Pengguna','','Akun aktif'],['',$products,'Produk','','Tersedia di katalog'],['',$orders->total,'Pesanan','',$pendingOrders.' pesanan menunggu'],['',\App\Support\Ui::money($orders->income),'Pemasukan','green','Dari pesanan selesai']]"/>
<section class="section"><x-heading title="Menu Administrasi"/><div class="menu-grid">
<x-tile label="Kelola Pengguna" :href="route('admin.users.index')" icon="users"/><x-tile label="Kelola Produk" :href="route('manage.products.index')" icon="product"/><x-tile label="Pesanan" :href="route('manage.orders.index')" icon="orders"/>
<x-tile label="Pembeli" :href="route('manage.buyers.index')" icon="cart"/><x-tile label="Kelola Stok" :href="route('manage.stock')" icon="stock"/><x-tile label="Kelola Ternak" :href="route('manage.livestock.index')" icon="leaf"/>
<x-tile label="Pengurus" :href="route('manage.caretakers.index')" icon="users"/><x-tile label="Profil Saya" :href="route('profile')" icon="user"/>
</div></section>
@include('partials.staff-overview')
<section class="section panel"><x-heading title="Pengguna Terbaru"><a class="subtle-link" href="{{ route('admin.users.index') }}">Lihat Semua</a></x-heading><p class="muted">{{ $users->where('role','petani')->count() }} petani · {{ $users->where('role','pembeli')->count() }} akun pembeli · {{ $users->where('role','admin')->count() }} administrator</p>
<x-table :headers="['ID','Nama','Email','Role']" :empty="$users->isEmpty()">@foreach($users->sortByDesc('id_user')->take(5) as $user)<tr><td class="record-id">{{ \App\Support\Ui::code('USR',$user->id_user) }}</td><td class="record-name">{{ $user->nama }}</td><td>{{ $user->email }}</td><td><span class="badge {{ $user->role==='admin'?'':($user->role==='petani'?'green':'gray') }}">{{ ucfirst($user->role) }}</span></td></tr>@endforeach</x-table></section>
</x-layout>
