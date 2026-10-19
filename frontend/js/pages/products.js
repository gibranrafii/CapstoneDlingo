'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  function render(){
    const products=Demo.list('products');
    main.innerHTML=UI.banner('Produk','Kelola produk jamur Anda.','box',UI.action('Tambah Produk','add',null,'white'))+
      UI.stats([['📦',products.length,'Total Produk'],['📊',products.reduce((s,p)=>s+p.stok,0),'Total Stok'],['⚠️',products.filter(p=>p.stok<10).length,'Stok Menipis','red']])+
      `<section class="section">${UI.heading('Daftar Produk',UI.action('Tambah Produk','add'))}`+
      UI.table(['ID','Nama Produk','Kategori','Harga','Satuan','Stok','Aksi'],products.map(p=>UI.row([
        UI.id(p.id),UI.strong(p.nama),UI.escape(p.kategori),`<span class="price">${UI.money(p.harga)}</span>`,UI.escape(p.satuan),`<b class="${p.stok<10?'red':''}">${p.stok}</b>`,UI.editButtons(p.id,p.nama)
      ])))+'</section>';
  }
  Management.bind('products','Produk',p=>[
    ['nama','Nama Produk',p.nama||'',{required:true}],
    ['kategori','Kategori',p.kategori||'Jamur',{type:'select',options:['Jamur','Baglog','Bibit','Olahan']}],
    ['harga','Harga (Rp)',p.harga??0,{type:'number',required:true,min:0,step:1}],
    ['satuan','Satuan',p.satuan||'kg',{type:'select',options:['kg','pcs','pack','baglog']}],
    ['stok','Stok',p.stok??0,{type:'number',required:true,min:0,step:1}],
    ['deskripsi','Deskripsi',p.deskripsi||'',{type:'textarea'}]
  ],render,v=>({...v,harga:Number(v.harga),stok:Number(v.stok),art:v.kategori==='Baglog'?'baglog':v.nama.toLowerCase().includes('kuping')?'kuping':'tiram'}));

}
