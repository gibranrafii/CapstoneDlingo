'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const u=Demo.user(),joined=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(u.created_at));
    main.innerHTML=UI.banner('Profil Saya','Kelola informasi akun Anda.','user')+
      `<div class="two-column"><section class="panel"><h2>Informasi Akun</h2><form id="profile-form">`+
      UI.field('username','Username',u.username,{required:true,autocomplete:'username'})+
      UI.field('nama','Nama Lengkap',u.nama,{required:true,autocomplete:'name'})+
      UI.field('email','Email',u.email,{type:'email',required:true,autocomplete:'email'})+
      UI.field('no_telepon','No. Telepon',u.no_telepon||'',{type:'tel',autocomplete:'tel'})+
      UI.field('password','Password Baru (kosongkan jika tidak diubah)','',{type:'password',minlength:8,placeholder:'Masukkan password baru',autocomplete:'new-password'})+
      UI.field('confirm','Konfirmasi Password','',{type:'password',placeholder:'Ulangi password baru',autocomplete:'new-password'})+
      `<p class="form-error" role="alert" hidden></p><button class="button small" type="submit">${UI.icon('save')}Simpan Perubahan</button></form></section><section class="panel"><h2>Info Akun</h2><dl><div class="info-item"><dt>Role</dt><dd>${UI.escape(({petani:'Peternak',admin:'Administrator',pembeli:'Pembeli'})[u.role])}</dd></div><div class="info-item"><dt>Bergabung Sejak</dt><dd>${UI.escape(joined)}</dd></div><div class="info-item"><dt>Terakhir Diperbarui</dt><dd>${u.updated_at===u.created_at||!u.updated_at?'9 hours ago':UI.escape(UI.date(u.updated_at))}</dd></div></dl></section></div>`+
      `<div class="profile-actions">${u.role!=='pembeli'?UI.action('Rekening','bank','bank','secondary'):''}${UI.action('Riwayat','history','history','secondary')}${UI.action('Keluar','logout','login','secondary')}</div>`;
    UI.submit(document.getElementById('profile-form'),async values=>{
      if(values.password!==values.confirm)throw Error('Konfirmasi password tidak cocok.');
      delete values.confirm;await Demo.updateProfile(values);UI.toast('Profil berhasil diperbarui.');
    });
  }
  render();window.addEventListener('dlingo:change',render);

}
