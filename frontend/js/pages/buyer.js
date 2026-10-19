'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const user=Demo.user(),orders=Demo.list('orders').filter(o=>o.userId===user.id||o.buyerId===user.buyerId),cart=Demo.cartItems();
    main.innerHTML=UI.banner(`Selamat Datang, ${user.nama}`,'Temukan produk lokal dan pantau pesanan Anda.','cart',UI.link('Lihat Katalog','index.html',null,'white'))+
      UI.stats([['📋',orders.length,'Total Pesanan'],['✅',orders.filter(o=>o.status==='selesai').length,'Selesai','green'],['🛒',cart.reduce((s,i)=>s+i.quantity,0),'Keranjang'],['💰',UI.money(orders.filter(o=>o.status!=='dibatalkan').reduce((s,i)=>s+i.total,0)),'Total Belanja']])+
      `<section class="section">${UI.heading('Menu Utama','','compact')}<div class="menu-grid">`+
      UI.tile('Katalog Produk','index.html','product')+UI.tile('Keranjang Belanja','pages/cart.html','cart','purple')+UI.tile('Pesanan Saya','pages/my-orders.html','orders','yellow')+UI.tile('Profil Saya','pages/profile.html','user','green')+
      `</div></section><section class="section">${UI.heading('Keranjang Belanja',UI.link('Lihat Keranjang','pages/cart.html','cart','small'))}`+
      (cart.length?UI.table(['Produk','Jumlah','Subtotal'],cart.map(i=>UI.row([UI.strong(i.product.nama),String(i.quantity),UI.money(i.product.harga*i.quantity)]))):'<div class="panel"><p class="muted">Keranjang Anda masih kosong.</p></div>')+
      `</section><section class="section">${UI.heading('Pesanan Terbaru',UI.link('Lihat Semua','pages/my-orders.html',null,'small'))}`+
      UI.table(['ID','Tanggal','Total','Status','Aksi'],orders.slice(0,5).map(o=>UI.row([UI.id(o.id),UI.date(o.date),UI.money(o.total),UI.status(o.status),`<button class="icon-button" data-action="view" data-id="${o.id}" aria-label="Lihat ${o.id}">${UI.icon('eye')}</button>`])),'Belum ada pesanan.')+'</section>';
  }
  UI.on('view',button=>{const order=Demo.get('orders',button.dataset.id);if(order)OrderUI.view(order);});
  render();window.addEventListener('dlingo:change',render);window.addEventListener('dlingo:cart',render);

}
