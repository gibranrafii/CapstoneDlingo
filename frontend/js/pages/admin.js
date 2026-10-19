'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const users=Demo.list('users'),orders=Demo.list('orders');
    main.innerHTML=UI.banner('Dashboard Administrator','Kelola pengguna, produk, pesanan, dan peternakan Desa Dlingo.','users',UI.link('Kelola Pengguna','pages/users-manage.html',null,'white'))+
      UI.stats([['👥',users.length,'Total Pengguna'],['🌱',users.filter(u=>u.role==='petani').length,'Petani'],['🛒',users.filter(u=>u.role==='pembeli').length,'Akun Pembeli'],['📦',Demo.list('products').length,'Produk'],['📋',orders.length,'Pesanan'],['🐄',Demo.list('livestock').length,'Ternak'],['👥',Demo.list('staff').length,'Pengurus'],['💰',UI.money(orders.filter(o=>o.status!=='dibatalkan').reduce((s,o)=>s+o.total,0)),'Pemasukan','green']])+
      `<section class="section">${UI.heading('Menu Administrasi','','compact')}<div class="menu-grid">`+
      UI.tile('Kelola Pengguna','pages/users-manage.html','users','purple')+UI.tile('Kelola Produk','pages/products-manage.html','product')+
      UI.tile('Pembeli','pages/buyers-manage.html','cart','green')+UI.tile('Kelola Stok','pages/stock.html','stock','teal')+
      UI.tile('Pesanan','pages/orders-manage.html','orders','yellow')+UI.tile('Kelola Ternak','pages/livestock.html','leaf','green')+
      UI.tile('Pengurus','pages/caretakers.html','users','orange')+UI.tile('Profil Saya','pages/profile.html','user','sky')+
      `</div></section><section class="section">${UI.heading('Pengguna Terbaru',UI.link('Lihat Semua','pages/users-manage.html',null,'small'))}`+
      UI.table(['ID','Nama','Email','Role'],users.slice(-5).reverse().map(u=>UI.row([UI.id(u.id),UI.strong(u.nama),UI.escape(u.email),UI.badge(({admin:'Admin',petani:'Petani',pembeli:'Pembeli'})[u.role],u.role==='admin'?'red':u.role==='petani'?'green':'')])),'Belum ada pengguna.')+
      `</section><section class="section activity-box"><h2>Aktivitas Terbaru</h2>${UI.activities(3)}</section>`;
  }
  render();window.addEventListener('dlingo:change',render);

}
