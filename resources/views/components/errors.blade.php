@props(['for'=>null])
@if($errors->any() && ($for===null || old('_modal')===$for))<div class="form-error" role="alert">@foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach</div>@endif
