'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const staff=Demo.list('staff'),livestock=Demo.list('livestock');
    main.innerHTML=UI.banner('Pengurus','Kelola data pengurus yang merawat ternak Anda.','users',UI.action('Tambah Pengurus','add',null,'white'))+
      UI.stats([['👥',staff.length,'Total Pengurus'],['🐄',livestock.filter(l=>l.staffIds?.length).length,'Total Ternak Diurus'],['✅',staff.filter(s=>s.active).length,'Pengurus Aktif','green']])+
      `<section class="section">${UI.heading('Daftar Pengurus',UI.action('Tambah Pengurus','add'))}`+
      UI.table(['ID','Nama','No. Telepon','Email','Alamat','Total Ternak','Aksi'],staff.map(s=>UI.row([
        UI.id(s.id),UI.strong(s.nama),UI.escape(s.no_telepon||'—'),UI.escape(s.email||'—'),UI.escape(s.alamat||'—'),UI.strong(livestock.filter(l=>l.staffIds?.includes(s.id)).length),UI.editButtons(s.id,s.nama)
      ])))+'</section>';
  }
  Management.bind('staff','Pengurus',s=>[
    ['nama','Nama Pengurus',s.nama||'',{required:true}],
    ['no_telepon','No. Telepon',s.no_telepon||'',{type:'tel'}],
    ['email','Email',s.email||'',{type:'email'}],
    ['alamat','Alamat',s.alamat||'',{type:'textarea'}],
    ['active','Status',s.active===false?'false':'true',{type:'select',options:[['true','Aktif'],['false','Tidak Aktif']]}]
  ],render,v=>({...v,active:v.active==='true'}));

}
