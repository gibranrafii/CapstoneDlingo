@props(['items'])
<div class="stats {{ count($items)===3?'three':'' }}" style="--cols:{{ count($items)===8?4:count($items) }}">
@foreach($items as $item)<div class="stat"><strong class="stat-value {{ $item[3]??'' }}">{{ $item[1] }}</strong><span class="stat-label">{{ $item[2] }}</span></div>@endforeach
</div>
