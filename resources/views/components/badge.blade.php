@props(['status'=>null,'tone'=>''])
@php
if($status){$tone=match($status){'menunggu'=>'amber','selesai'=>'green','dibatalkan'=>'red',default=>''};}
@endphp
<span class="badge {{ $tone }}">{{ $status ? (\App\Support\Ui::STATUSES[$status]??$status) : $slot }}</span>
