@props(['name','label','value'=>'','type'=>'text','options'=>[],'form'=>null,'required'=>false])
@php $selected=old('_modal')===$form ? old($name,$value) : $value; @endphp
<div class="field"><label for="{{ $form }}-{{ $name }}">{{ $label }}</label>
@if($type==='select')<select id="{{ $form }}-{{ $name }}" name="{{ $name }}" class="input" {{ $required?'required':'' }} {{ $attributes }}>@foreach($options as $key=>$text)<option value="{{ $key }}" @selected((string)$key===(string)$selected)>{{ $text }}</option>@endforeach</select>
@elseif($type==='textarea')<textarea id="{{ $form }}-{{ $name }}" name="{{ $name }}" class="input" {{ $required?'required':'' }} {{ $attributes }}>{{ $selected }}</textarea>
@else<input id="{{ $form }}-{{ $name }}" name="{{ $name }}" type="{{ $type }}" class="input" @if(!in_array($type,['password','file'])) value="{{ $selected }}" @endif {{ $required?'required':'' }} {{ $attributes }}>@endif
</div>
