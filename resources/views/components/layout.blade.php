@props(['page','title','shell'=>'app'])
@php
    $ui = \App\Support\Ui::class;
    $staffShell = $shell === 'app' && auth()->user()?->isManager();
    $shoppingShell = $shell !== 'auth' && !$staffShell;
@endphp
<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0047ab"><meta name="csrf-token" content="{{ csrf_token() }}"><title>{{ $title }} — Desa Dlingo</title>@vite(['resources/css/app.css','resources/js/app.js'])</head>
<body data-page="{{ $page }}" data-reopen="{{ old('_modal') }}" data-order-auto="{{ request()->integer('order')>0?route('orders.show',request()->integer('order')):'' }}" class="{{ $shell==='auth'?'auth-page':($staffShell?'staff-page':'shopping-page') }}">
<a class="skip-link" href="#app-main">Lewati ke konten utama</a>
@if($shell !== 'auth')
    @include('partials.navigation')
@endif
@if($shell==='auth'){{ $slot }}@else<main id="app-main" class="page" tabindex="-1">{{ $slot }}</main>@endif
@if($shoppingShell)<footer class="site-footer"><strong>{{ $farm->nama }}</strong><br>Jamur pilihan dari petani. Tumbuh bersama masyarakat lokal.</footer>@endif
@if(session('success')||session('error'))<div class="toast-region" role="status" aria-live="polite"><div class="toast-message {{ session('error')?'error':'' }}">{{ session('success')??session('error') }}</div></div>@endif
@auth
<x-dialog id="order-detail" title="Detail Pesanan"><div id="order-detail-body"></div></x-dialog>
<x-dialog id="bank" title="Rekening Pembayaran" :action="auth()->user()->role==='admin'?route('farm.update'):null">
@if(auth()->user()->role==='admin')
<x-field form="bank" name="nama" label="Nama Usaha" :value="$farm->nama" required/><x-field form="bank" name="alamat" label="Alamat" :value="$farm->alamat"/>
<x-field form="bank" name="no_telepon" label="No. Telepon" :value="$farm->no_telepon"/><x-field form="bank" name="nama_bank" label="Nama Bank" :value="$farm->nama_bank" required/><x-field form="bank" name="no_rekening" label="Nomor Rekening" :value="$farm->no_rekening" required/><x-field form="bank" name="atas_nama" label="Atas Nama" :value="$farm->atas_nama" required/>
@else<dl><div class="info-item"><dt>Bank</dt><dd>{{ $farm->nama_bank?:'Belum diisi' }}</dd></div><div class="info-item"><dt>Nomor Rekening</dt><dd>{{ $farm->no_rekening?:'Belum diisi' }}</dd></div><div class="info-item"><dt>Atas Nama</dt><dd>{{ $farm->atas_nama?:'Belum diisi' }}</dd></div></dl>@endif
</x-dialog>
<x-dialog id="history" title="Riwayat Aktivitas">@include('partials.activity',['activities'=>\Illuminate\Support\Facades\DB::table('activity_logs')->when(!auth()->user()->isManager(),fn($q)=>$q->where('user_id',auth()->id()))->latest('id')->limit(30)->get()])</x-dialog>
@can('manage-farm')
<x-dialog id="upload" title="Upload File"><x-field name="file" label="Pilih file gambar atau dokumen" type="file" data-preview="upload-preview" accept="image/*,.pdf,.csv,.txt,.docx"/><p class="form-note">File hanya dipratinjau di perangkat Anda.</p><div id="upload-preview" aria-live="polite"></div></x-dialog>
<dialog class="dialog" id="delete-record" aria-labelledby="delete-title"><form method="POST" id="delete-form">@csrf @method('DELETE')<header class="dialog-header"><h2 id="delete-title">Hapus Data</h2><button type="button" class="dialog-close" data-close aria-label="Tutup dialog">×</button></header><div class="dialog-body"><p id="delete-message"></p><footer class="dialog-footer"><button type="button" class="button secondary" data-close>Batal</button><button type="submit" class="button danger">Hapus</button></footer></div></form></dialog>
@endcan
@endauth
</body></html>
