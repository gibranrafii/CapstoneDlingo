@props(['headers','empty'=>false,'message'=>'Belum ada data.'])
<div class="table-wrap"><table class="data-table"><thead><tr>@foreach($headers as $header)<th scope="col">{{ $header }}</th>@endforeach</tr></thead><tbody>@if($empty)<tr><td class="empty" colspan="{{ count($headers) }}">{{ $message }}</td></tr>@else{{ $slot }}@endif</tbody></table></div>
