'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const buyers=Demo.list('buyers'),orders=Demo.list('orders');
    main.innerHTML=UI.banner('Pembeli','Kelola data pembeli yang membeli produk Anda.','cart',UI.action('Tambah Pembeli','add',null,'white'))+
      UI.stats([['👥',buyers.length,'Total Pembeli'],['📋',orders.length,'Total Pesanan'],['✅',buyers.filter(b=>orders.some(o=>o.buyerId===b.id&&o.status!=='dibatalkan')).length,'Pembeli Aktif','green']])+
      `<section class="section">${UI.heading('Daftar Pembeli',UI.action('Tambah Pembeli','add'))}`+
      UI.table(['ID','Nama','No. Telepon','Email','Alamat','Total Pesanan','Aksi'],buyers.map(b=>UI.row([
        UI.id(b.id),UI.strong(b.nama),UI.escape(b.no_telepon||'—'),UI.escape(b.email||'—'),UI.escape(b.alamat||'—'),UI.strong(orders.filter(o=>o.buyerId===b.id).length),UI.editButtons(b.id,b.nama)
      ])))+'</section>';
  }
  Management.bind('buyers','Pembeli',b=>[
    ['nama','Nama Pembeli',b.nama||'',{required:true}],
    ['no_telepon','No. Telepon',b.no_telepon||'',{type:'tel'}],
    ['email','Email',b.email||'',{type:'email'}],
    ['alamat','Alamat',b.alamat||'',{type:'textarea'}]
  ],render);

}
