'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const products=Demo.list('products'),low=products.filter(p=>p.stok<10);
    main.innerHTML=UI.banner('Kelola Stok','Pantau stok produk Anda.','stock')+
      UI.stats([['📊',products.reduce((s,p)=>s+p.stok,0),'Total Stok'],['📦',products.length,'Total Produk'],['⚠️',low.length,'Stok Menipis','red']])+
      `<section class="section">${UI.heading(`⚠ Stok Menipis (${low.length})`,'','red')}`+
      UI.table(['ID','Nama Produk','Kategori','Stok Saat Ini','Satuan','Aksi'],low.map(p=>UI.row([
        UI.id(p.id),UI.strong(p.nama),UI.escape(p.kategori),`<b class="red">${p.stok}</b>`,UI.escape(p.satuan),`<a class="subtle-link" href="${UI.url('pages/products-manage.html')}">Kelola Produk</a>`
      ],'stock-low')),'Semua produk memiliki stok yang cukup.')+
      `</section><section class="section">${UI.heading('Semua Produk')}`+
      UI.table(['ID','Nama Produk','Kategori','Stok','Satuan','Harga'],products.map(p=>UI.row([
        UI.id(p.id),UI.strong(p.nama),UI.escape(p.kategori),`<b class="${p.stok<10?'red':'green'}">${p.stok}</b>`,UI.escape(p.satuan),UI.strong(UI.money(p.harga))
      ])))+'</section>';
  }
  render();window.addEventListener('dlingo:change',render);

}
