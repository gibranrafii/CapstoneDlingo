@props(['edit','delete','name'])
<div class="actions"><button type="button" class="icon-button" data-open="{{ $edit }}" aria-label="Edit {{ $name }}">{{ \App\Support\Ui::icon('edit') }}</button><button type="button" class="icon-button danger" data-delete="{{ $delete }}" data-name="{{ $name }}" aria-label="Hapus {{ $name }}">{{ \App\Support\Ui::icon('trash') }}</button></div>
