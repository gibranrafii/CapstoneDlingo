@php
    $buyerNav = [['Home','dashboard.pembeli','home','buyer'],['Produk','store','product','store'],['Pesanan','buyer.orders','orders','myorders'],['Keranjang','cart','cart','cart'],['Profil','profile','user','profile']];
    $staffNav = [['Home','dashboard','home','farmer|admin'],['Produk','manage.products.index','product','products'],['Pesanan','manage.orders.index','orders','orders'],['Ternak','manage.livestock.index','leaf','livestock']];
    $extraNav = [['Pembeli','manage.buyers.index','cart','buyers'],['Kelola Stok','manage.stock','stock','stock'],['Pengurus','manage.caretakers.index','users','staff'],['Profil Saya','profile','user','profile']];
    if(auth()->user()?->role === 'admin') $extraNav[] = ['Kelola Pengguna','admin.users.index','users','users'];
    $isActive = fn($pages) => in_array($page, explode('|',$pages)) || ($pages === 'store' && $page === 'detail');
@endphp
@if($staffShell)
<aside class="sidebar">
    <a class="brand" href="{{ route('dashboard') }}"><span class="brand-icon">{{ $ui::icon('mushroom') }}</span><span>JamurTani<small>Desa Dlingo</small></span></a>
    <nav aria-label="Navigasi utama" class="sidebar-links">
        @foreach(array_merge($staffNav,$extraNav) as [$label,$route,$icon,$pages])
        <a class="nav-link {{ $isActive($pages)?'active':'' }}" @if($isActive($pages)) aria-current="page" @endif href="{{ route($route) }}">{{ $ui::icon($icon) }}{{ $label }}</a>
        @endforeach
        <div class="nav-tools">
            @foreach([['bank','Rekening','bank'],['history','Riwayat','history'],['upload','Upload File','upload']] as [$target,$label,$icon])<button class="nav-link" type="button" data-open="{{ $target }}">{{ $ui::icon($icon) }}{{ $label }}</button>@endforeach
            <form method="POST" action="{{ route('logout') }}">@csrf<button class="nav-link" type="submit">{{ $ui::icon('login') }}Keluar</button></form>
        </div>
    </nav>
</aside>
<header class="workspace-header"><a class="brand mobile-brand" href="{{ route('dashboard') }}"><span class="brand-icon">{{ $ui::icon('mushroom') }}</span>JamurTani</a><span class="workspace-title">{{ $title }}</span><a class="account-link" href="{{ route('profile') }}"><span class="avatar">{{ mb_substr(auth()->user()->nama,0,1) }}</span><span class="account-name">{{ auth()->user()->nama }}<small>{{ auth()->user()->role==='admin'?'Administrator':'Petani' }}</small></span></a></header>
<nav class="bottom-nav" aria-label="Navigasi seluler">
    @foreach($staffNav as [$label,$route,$icon,$pages])<a class="nav-link {{ $isActive($pages)?'active':'' }}" @if($isActive($pages)) aria-current="page" @endif href="{{ route($route) }}">{{ $ui::icon($icon) }}<span>{{ $label }}</span></a>@endforeach
    <button class="nav-link {{ in_array($page,['buyers','stock','staff','profile','users'])?'active':'' }}" @if(in_array($page,['buyers','stock','staff','profile','users'])) aria-current="page" @endif type="button" data-open="staff-more" aria-haspopup="dialog">{{ $ui::icon('menu') }}<span>Lainnya</span></button>
</nav>
<x-dialog id="staff-more" title="Menu Lainnya"><nav class="more-menu" aria-label="Menu lainnya">
    @foreach($extraNav as [$label,$route,$icon,$pages])<a class="nav-link" href="{{ route($route) }}">{{ $ui::icon($icon) }}{{ $label }}</a>@endforeach
    @foreach([['bank','Rekening','bank'],['history','Riwayat','history'],['upload','Upload File','upload']] as [$target,$label,$icon])<button class="nav-link" type="button" data-open="{{ $target }}">{{ $ui::icon($icon) }}{{ $label }}</button>@endforeach
    <form method="POST" action="{{ route('logout') }}">@csrf<button class="nav-link" type="submit">{{ $ui::icon('login') }}Keluar</button></form>
</nav></x-dialog>
@else
<header class="store-header">
    <a class="brand" href="{{ auth()->user()?->role==='pembeli'?route('dashboard.pembeli'):route('store') }}"><span class="brand-icon">{{ $ui::icon('mushroom') }}</span>JamurTani</a>
    <nav class="desktop-shopping-nav" aria-label="Navigasi utama">
        @if(!auth()->check() || auth()->user()->role==='pembeli')
        @foreach($buyerNav as [$label,$route,$icon,$pages])<a class="nav-link {{ $isActive($pages)?'active':'' }}" @if($isActive($pages)) aria-current="page" @endif href="{{ route($route) }}">{{ $label }}</a>@endforeach
        @else<a class="nav-link active" aria-current="page" href="{{ route('store') }}">Produk</a>@endif
    </nav>
    <div class="store-links">@auth
        <a class="account-link" href="{{ auth()->user()->isManager()?route('dashboard'):route('profile') }}"><span class="avatar">{{ mb_substr(auth()->user()->nama,0,1) }}</span><span class="account-name">{{ auth()->user()->isManager()?'Dashboard':auth()->user()->nama }}</span></a>
    @else<a class="button secondary" href="{{ route('login') }}">Masuk</a><a class="button desktop-signup" href="{{ route('register') }}">Daftar</a>@endauth</div>
</header>
@if(!auth()->check() || auth()->user()->role==='pembeli')
<nav class="bottom-nav" aria-label="Navigasi seluler">@foreach($buyerNav as [$label,$route,$icon,$pages])<a class="nav-link {{ $isActive($pages)?'active':'' }}" @if($isActive($pages)) aria-current="page" @endif href="{{ route($route) }}">{{ $ui::icon($icon) }}<span>{{ $label }}</span></a>@endforeach</nav>
@endif
@endif
