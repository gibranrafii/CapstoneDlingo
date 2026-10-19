<x-layout page="products" title="Produk"><x-banner title="Produk" subtitle="Kelola produk jamur Anda." icon="box"><x-slot:action><button class="button white" type="button" data-open="product-new">Tambah Produk</button></x-slot:action></x-banner>
<x-stats :items="[['📦',$products->count(),'Total Produk'],['📊',$products->sum('stok'),'Total Stok'],['⚠️',$products->where('stok','<',10)->count(),'Stok Menipis','red']]"/>
<section class="section"><x-heading title="Daftar Produk"><button class="button" type="button" data-open="product-new">{{ \App\Support\Ui::icon('plus') }}Tambah Produk</button></x-heading>
<x-table :headers="['ID','Nama Produk','Kategori','Harga','Satuan','Stok','Aksi']" :empty="$products->isEmpty()">@foreach($products as $product)<tr><td class="record-id">{{ \App\Support\Ui::code('PRD',$product->id_produk) }}</td><td class="record-name">{{ $product->nama_produk }}</td><td>{{ $product->kategori }}</td><td class="price">{{ \App\Support\Ui::money($product->harga) }}</td><td>{{ $product->satuan }}</td><td><b class="{{ $product->stok<10?'red':'' }}">{{ $product->stok }}</b></td><td><x-actions :edit="'product-'.$product->id_produk" :delete="route('manage.products.destroy',$product->id_produk)" :name="$product->nama_produk"/></td></tr>@endforeach</x-table></section>
@foreach($products->concat([new \App\Models\Product]) as $product)
@php $modal=$product->exists?'product-'.$product->id_produk:'product-new'; @endphp
<x-dialog :id="$modal" :title="($product->exists?'Edit':'Tambah').' Produk'" :action="$product->exists?route('manage.products.update',$product->id_produk):route('manage.products.store')" :method="$product->exists?'PUT':'POST'">
<x-field :form="$modal" name="nama_produk" label="Nama Produk" :value="$product->nama_produk" maxlength="255" required/>
<x-field :form="$modal" name="kategori" label="Kategori" type="select" :value="$product->kategori??'Jamur'" :options="['Jamur'=>'Jamur','Baglog'=>'Baglog','Bibit'=>'Bibit','Olahan'=>'Olahan']"/>
<x-field :form="$modal" name="harga" label="Harga (Rp)" type="number" :value="$product->harga??0" min="0" max="9999999999.99" step="0.01" required/>
<x-field :form="$modal" name="satuan" label="Satuan" type="select" :value="$product->satuan??'kg'" :options="['kg'=>'kg','pcs'=>'pcs','pack'=>'pack','baglog'=>'baglog']"/>
<x-field :form="$modal" name="stok" label="Stok" type="number" :value="$product->stok??0" min="0" max="2147483647" step="1" required/>
<x-field :form="$modal" name="deskripsi" label="Deskripsi" type="textarea" :value="$product->deskripsi" maxlength="255"/>
<x-field :form="$modal" name="gambar" label="Foto Produk (JPG, PNG, WebP · maks. 2 MB)" type="file" accept="image/jpeg,image/png,image/webp" :data-preview="$modal.'-preview'"/><div id="{{ $modal }}-preview"></div>
@if($product->gambar)<label class="inline-checkbox"><input type="checkbox" name="remove_image" value="1">Hapus foto saat ini</label>@endif
</x-dialog>@endforeach</x-layout>
