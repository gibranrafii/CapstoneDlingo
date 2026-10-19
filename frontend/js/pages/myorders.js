'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  const mine=()=>Demo.list('orders').filter(o=>o.userId===Demo.user().id||o.buyerId===Demo.user().buyerId);
  function render(){
    const orders=mine();
    main.innerHTML=UI.banner('Pesanan Saya','Pantau pesanan produk Anda dari petani.','orders',UI.link('Belanja Lagi','index.html',null,'white'))+
      UI.stats([['📋',orders.length,'Total Pesanan'],['⏳',orders.filter(o=>['pending','dikonfirmasi','diproses'].includes(o.status)).length,'Dalam Proses','amber'],['🚚',orders.filter(o=>o.status==='dikirim').length,'Dikirim'],['✅',orders.filter(o=>o.status==='selesai').length,'Selesai','green']])+
      `<section class="section">${UI.heading('Daftar Pesanan')}<div class="filters"><select class="input" id="status-filter" aria-label="Filter status pesanan"><option value="">Semua Status</option>${Object.entries(UI.statusLabels).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div><div id="order-list"></div></section>`;
    document.getElementById('status-filter').addEventListener('change',renderList);renderList();
  }
  function renderList(){
    const filter=document.getElementById('status-filter').value,orders=mine().filter(o=>!filter||o.status===filter);
    document.getElementById('order-list').innerHTML=orders.length?orders.map(o=>`<article class="order-card"><header class="order-card-header"><div><h3>${o.id}</h3><p>${UI.date(o.date)}</p></div>${UI.status(o.status)}</header><div class="order-card-body"><div><p>${UI.escape(o.items.map(i=>`${i.nama} × ${i.quantity}`).join(', '))}</p><strong class="product-price">${UI.money(o.total)}</strong></div><div class="flex-row"><button class="button small" data-action="view" data-id="${o.id}">${UI.icon('eye')}Detail Pesanan</button>${o.userId===Demo.user().id&&['pending','dikonfirmasi'].includes(o.status)?`<button class="button small secondary" data-action="cancel-order" data-id="${o.id}">Batalkan</button>`:''}</div></div></article>`).join(''):`<section class="panel empty-panel">${UI.icon('orders')}<h2>${filter?'Tidak Ada Pesanan dengan Status Ini':'Belum Ada Pesanan'}</h2><p>Pesanan Anda akan tampil di sini.</p>${UI.link('Lihat Katalog','index.html','arrow')}</section>`;
  }
  UI.on('view',button=>{const order=mine().find(o=>o.id===button.dataset.id);if(order)OrderUI.view(order);});
  UI.on('cancel-order',button=>UI.dialog('Batalkan Pesanan',`<p>Batalkan pesanan ${UI.escape(button.dataset.id)}? Stok akan dikembalikan.</p>`,()=>{Demo.updateOrderStatus(button.dataset.id,'dibatalkan');UI.toast('Pesanan dibatalkan.');},'Batalkan Pesanan',{danger:true}));
  render();window.addEventListener('dlingo:change',render);
  const requested=new URLSearchParams(location.search).get('order'),order=mine().find(o=>o.id===requested);if(order)OrderUI.view(order);

}
