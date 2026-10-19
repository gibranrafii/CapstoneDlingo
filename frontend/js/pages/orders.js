'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const orders=Demo.list('orders');
    main.innerHTML=UI.banner('Pesanan','Kelola pesanan dari pembeli.','orders',UI.action('Tambah Pesanan','add',null,'white'))+
      UI.stats([['📋',orders.length,'Total Pesanan'],['⏳',orders.filter(o=>o.status==='pending').length,'Menunggu','amber'],['🚚',orders.filter(o=>o.status==='dikirim').length,'Dikirim'],['✅',orders.filter(o=>o.status==='selesai').length,'Selesai','green']])+
      `<section class="section">${UI.heading('Daftar Pesanan',UI.action('Tambah Pesanan','add'))}`+
      UI.table(['ID','Pembeli','Tanggal','Total','Status','Aksi'],orders.map(o=>UI.row([
        UI.id(o.id),UI.strong(Demo.get('buyers',o.buyerId)?.nama||'Pembeli'),UI.date(o.date),UI.strong(UI.money(o.total)),UI.status(o.status),`<div class="actions"><button type="button" class="icon-button" data-action="view" data-id="${o.id}" aria-label="Lihat ${o.id}">${UI.icon('eye')}</button>${!['selesai','dibatalkan'].includes(o.status)?`<button type="button" class="icon-button" data-action="status" data-id="${o.id}" aria-label="Ubah status ${o.id}">${UI.icon('edit')}</button>`:''}</div>`
      ])),'Belum ada pesanan.')+'</section>';
  }
  UI.on('add',OrderUI.create);
  UI.on('view',button=>OrderUI.view(Demo.get('orders',button.dataset.id)));
  UI.on('status',button=>OrderUI.status(Demo.get('orders',button.dataset.id)));
  render();window.addEventListener('dlingo:change',render);
  if(location.hash==='#add')OrderUI.create();

}
