<x-layout page="buyers" title="Pembeli"><x-banner title="Pembeli" subtitle="Kelola data pembeli yang membeli produk Anda." icon="cart"><x-slot:action><button class="button white" type="button" data-open="buyer-new">Tambah Pembeli</button></x-slot:action></x-banner>
<x-stats :items="[['👥',$buyers->count(),'Total Pembeli'],['📋',$orderCount,'Total Pesanan'],['✅',$buyers->where('active_orders_count','>',0)->count(),'Pembeli Aktif','green']]"/>
<section class="section"><x-heading title="Daftar Pembeli"><button class="button" type="button" data-open="buyer-new">{{ \App\Support\Ui::icon('plus') }}Tambah Pembeli</button></x-heading><x-table :headers="['ID','Nama','No. Telepon','Email','Alamat','Total Pesanan','Aksi']" :empty="$buyers->isEmpty()">@foreach($buyers as $buyer)<tr><td class="record-id">{{ \App\Support\Ui::code('PBL',$buyer->id_pembeli) }}</td><td class="record-name">{{ $buyer->nama_pembeli }}</td><td>{{ $buyer->no_telepon_pembeli?:'—' }}</td><td>{{ $buyer->email_pembeli?:'—' }}</td><td>{{ $buyer->alamat_pembeli?:'—' }}</td><td><b>{{ $buyer->orders_count }}</b></td><td><x-actions :edit="'buyer-'.$buyer->id_pembeli" :delete="route('manage.buyers.destroy',$buyer->id_pembeli)" :name="$buyer->nama_pembeli"/></td></tr>@endforeach</x-table></section>
@foreach($buyers->concat([new \App\Models\Buyer]) as $buyer)
@php $modal=$buyer->exists?'buyer-'.$buyer->id_pembeli:'buyer-new'; @endphp
<x-dialog :id="$modal" :title="($buyer->exists?'Edit':'Tambah').' Pembeli'" :action="$buyer->exists?route('manage.buyers.update',$buyer->id_pembeli):route('manage.buyers.store')" :method="$buyer->exists?'PUT':'POST'">
<x-field :form="$modal" name="nama_pembeli" label="Nama Pembeli" :value="$buyer->nama_pembeli" maxlength="255" required/>
<x-field :form="$modal" name="no_telepon_pembeli" label="No. Telepon" type="tel" :value="$buyer->no_telepon_pembeli" maxlength="50"/>
<x-field :form="$modal" name="email_pembeli" label="Email" type="email" :value="$buyer->email_pembeli"/>
<x-field :form="$modal" name="alamat_pembeli" label="Alamat" type="textarea" :value="$buyer->alamat_pembeli" maxlength="255"/>
</x-dialog>@endforeach</x-layout>
