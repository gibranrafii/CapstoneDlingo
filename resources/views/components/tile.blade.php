@props(['label','href'=>null,'target'=>null,'icon'=>'box','tone'=>''])
@if($href)<a class="menu-tile" href="{{ $href }}">@else<button type="button" class="menu-tile" data-open="{{ $target }}">@endif<span class="tile-icon {{ $tone }}">{{ \App\Support\Ui::icon($icon) }}</span>{{ $label }}@if($href)</a>@else</button>@endif
