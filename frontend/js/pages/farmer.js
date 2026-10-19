'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const user=Demo.user(),p=Demo.list('products'),l=Demo.list('livestock'),o=Demo.list('orders');
    main.innerHTML=UI.banner(`Selamat Datang, ${user.nama}`,'Kelola produk, stok, pesanan, dan ternak Anda dari sini.','leaf',UI.link('Lihat Semua','pages/products-manage.html',null,'white'))+
      UI.stats([['🐄',l.length,'Total Ternak'],['🐂',l.filter(i=>i.kategori==='Sapi').length,'Sapi'],['🐐',l.filter(i=>i.kategori==='Kambing').length,'Kambing'],['👥',Demo.list('staff').length,'Pengurus'],['📦',p.length,'Produk'],['📋',o.length,'Pesanan'],['💳',Demo.list('buyers').length,'Pembeli'],['💰',UI.money(o.filter(i=>i.status!=='dibatalkan').reduce((s,i)=>s+i.total,0)),'Pemasukan','green']])+
      `<section class="section">${UI.heading('Menu Utama','','compact')}<div class="menu-grid">`+
      UI.tile('Kelola Produk','pages/products-manage.html','product')+UI.tile('Pembeli','pages/buyers-manage.html','cart','purple')+
      UI.tile('Kelola Stok','pages/stock.html','stock','green')+UI.tile('Pesanan','pages/orders-manage.html','orders','yellow')+
      UI.tile('Profil Saya','pages/profile.html','user','purple')+UI.tile('Kelola Ternak','pages/livestock.html','leaf','green')+
      UI.tile('Pengurus','pages/caretakers.html','users','orange')+UI.modalTile('Rekening','bank','bank','teal')+
      UI.modalTile('Riwayat','history','history','pink')+UI.modalTile('Upload File','upload','upload','sky')+
      `</div></section><section class="section activity-box"><h2>Aktivitas Terbaru</h2>${UI.activities(1)}</section>`;
  }
  render();window.addEventListener('dlingo:change',render);

}
