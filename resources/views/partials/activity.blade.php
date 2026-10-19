@foreach($activities as $activity)<div class="activity-row"><div><b>{{ $activity->message }}</b><small>{{ \Illuminate\Support\Carbon::parse($activity->created_at)->locale('en')->diffForHumans() }}</small></div><span class="activity-tag">{{ $activity->category }}</span></div>@endforeach
@if($activities->isEmpty())<p class="muted">Belum ada aktivitas.</p>@endif
