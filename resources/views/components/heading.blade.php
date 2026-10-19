@props(['title','compact'=>false])
<div class="section-heading {{ $compact?'compact':'' }}"><h2>{{ $title }}</h2>{{ $slot }}</div>
