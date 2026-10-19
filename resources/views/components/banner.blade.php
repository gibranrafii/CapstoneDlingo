@props(['title','subtitle','icon'=>'box'])
<section class="banner {{ isset($action) ? 'has-action' : '' }}" aria-label="{{ $title }}"><h1>{{ $title }}</h1><p>{{ $subtitle }}</p>{{ $action ?? '' }}<span class="banner-art">{{ \App\Support\Ui::icon($icon) }}</span></section>
