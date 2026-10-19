'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  const labels={admin:'Admin',petani:'Petani',pembeli:'Pembeli'};
  function render(){
    const users=Demo.list('users');
    main.innerHTML=UI.banner('Pengguna','Kelola akun pengguna sistem Desa Dlingo.','users',UI.action('Tambah Pengguna','add',null,'white'))+
      UI.stats([['👥',users.length,'Total Pengguna'],['🌱',users.filter(u=>u.role==='petani').length,'Petani'],['🛒',users.filter(u=>u.role==='pembeli').length,'Pembeli']])+
      `<section class="section">${UI.heading('Daftar Pengguna',UI.action('Tambah Pengguna','add'))}`+
      UI.table(['ID','Nama','Username','Email','Role','No. Telepon','Aksi'],users.map(u=>UI.row([
        UI.id(u.id),UI.strong(u.nama),UI.escape(u.username),UI.escape(u.email),UI.badge(labels[u.role],u.role==='admin'?'red':u.role==='petani'?'green':''),UI.escape(u.no_telepon||'—'),UI.editButtons(u.id,u.nama)
      ])))+'</section>';
  }
  function edit(user){
    UI.form(`${user?'Edit':'Tambah'} Pengguna`,[
      ['nama','Nama Lengkap',user?.nama||'',{required:true}],
      ['username','Username',user?.username||'',{required:true,autocomplete:'off'}],
      ['email','Email',user?.email||'',{type:'email',required:true}],
      ['no_telepon','No. Telepon',user?.no_telepon||'',{type:'tel'}],
      ['role','Role',user?.role||'petani',{type:'select',options:Object.entries(labels)}],
      ['password',user?'Password Baru (kosongkan jika tidak diubah)':'Kata Sandi','',{type:'password',required:!user,minlength:8,autocomplete:'new-password'}]
    ],async values=>{await Demo.saveUser({...values,id:user?.id});UI.toast('Pengguna berhasil disimpan.');});
  }
  UI.on('add',()=>edit(null));UI.on('edit',button=>edit(Demo.get('users',button.dataset.id)));
  UI.on('delete',button=>{const u=Demo.get('users',button.dataset.id);UI.confirm('Hapus Pengguna',`Hapus akun ${u.nama}?`,()=>{Demo.removeUser(u.id);UI.toast('Pengguna berhasil dihapus.');});});
  render();window.addEventListener('dlingo:change',render);if(location.hash==='#add')edit(null);

}
