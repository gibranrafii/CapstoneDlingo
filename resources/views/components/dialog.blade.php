@props(['id','title','action'=>null,'method'=>'POST','submit'=>'Simpan','danger'=>false])
<dialog class="dialog" id="{{ $id }}" aria-labelledby="{{ $id }}-title">
@if($action)<form method="POST" action="{{ $action }}" enctype="multipart/form-data">@csrf @if($method!=='POST')@method($method)@endif<input type="hidden" name="_modal" value="{{ $id }}">@endif
<header class="dialog-header"><h2 id="{{ $id }}-title">{{ $title }}</h2><button class="dialog-close" type="button" data-close aria-label="Tutup dialog">×</button></header>
<div class="dialog-body">{{ $slot }}<x-errors :for="$id"/><footer class="dialog-footer"><button class="button secondary" type="button" data-close>{{ $action?'Batal':'Tutup' }}</button>@if($action)<button class="button {{ $danger?'danger':'' }}" type="submit">{{ $submit }}</button>@endif</footer></div>
@if($action)</form>@endif</dialog>
