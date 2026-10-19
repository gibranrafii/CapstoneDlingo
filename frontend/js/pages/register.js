'use strict';
if (window.AppReady) {

  document.getElementById('register-logo').innerHTML=UI.icon('leaf');
  document.getElementById('register-watermark').innerHTML=UI.icon('leaf');
  document.getElementById('register-fields').innerHTML=
    '<div class="field-grid">'+UI.field('nama','Nama Lengkap','',{required:true,autocomplete:'name',placeholder:'Nama Anda'})+UI.field('username','Username','',{required:true,autocomplete:'username',placeholder:'Pilih username'})+'</div>'+
    UI.field('email','Email','',{type:'email',required:true,autocomplete:'email',placeholder:'nama@email.com'})+
    UI.field('no_telepon','No. Telepon','',{type:'tel',autocomplete:'tel',placeholder:'08xxxxxxxxxx'})+
    UI.field('alamat','Alamat','',{type:'textarea',autocomplete:'street-address',placeholder:'Alamat lengkap Anda'})+
    '<div id="farmer-fields" hidden>'+UI.field('nama_bank','Nama Bank','',{placeholder:'Contoh: BRI'})+UI.field('no_rekening','Nomor Rekening','',{placeholder:'Nomor rekening pembayaran'})+'</div>'+
    UI.field('password','Kata Sandi','',{type:'password',required:true,minlength:8,autocomplete:'new-password',placeholder:'Minimal 8 karakter'})+
    UI.field('confirm','Konfirmasi Kata Sandi','',{type:'password',required:true,minlength:8,autocomplete:'new-password',placeholder:'Ulangi kata sandi'});
  document.querySelectorAll('[name=role]').forEach(input=>input.addEventListener('change',()=>{document.getElementById('farmer-fields').hidden=input.value!=='petani'||!input.checked;}));
  UI.submit(document.getElementById('register-form'),async values=>{
    if(values.password!==values.confirm)throw Error('Konfirmasi kata sandi tidak cocok.');
    const {confirm,...data}=values;await Demo.register(data);
    await Demo.login(data.username,data.password);location.href=UI.url(UI.dashboard(data.role));
  });

}
