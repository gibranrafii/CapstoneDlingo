'use strict';
if (window.AppReady) {

  document.getElementById('hero-art').innerHTML=UI.productArt('tiram');
  function render(){
    const query=document.getElementById('search').value.toLowerCase().trim(),category=document.getElementById('category').value,sort=document.getElementById('sort').value;
    const products=Demo.list('products').filter(p=>(!query||`${p.nama} ${p.deskripsi}`.toLowerCase().includes(query))&&(!category||p.kategori===category));
    products.sort((a,b)=>sort==='price-low'?a.harga-b.harga:sort==='price-high'?b.harga-a.harga:a.nama.localeCompare(b.nama,'id'));
    document.getElementById('result-count').textContent=`${products.length} produk`;
    document.getElementById('products').innerHTML=products.length?products.map(p=>`<article class="product-card"><a class="product-art ${UI.escape(p.art||'tiram')}" href="${UI.url('pages/product-detail.html?id='+p.id)}" aria-label="Lihat ${UI.escape(p.nama)}">${UI.productArt(p.art)}</a><div class="product-card-body"><h3>${UI.escape(p.nama)}</h3><p>${UI.escape(p.deskripsi||'Produk pilihan dari petani Desa Dlingo.')}</p><span class="badge">${UI.escape(p.kategori)}</span><div class="product-footer"><div><div class="product-price">${UI.money(p.harga)}</div><small class="muted">per ${UI.escape(p.satuan)}</small></div>${UI.link('Detail','pages/product-detail.html?id='+p.id,'eye','small')}</div><div class="product-footer"><span class="${p.stok<10?'red':'muted'}">Stok: ${p.stok} ${UI.escape(p.satuan)}</span>${!Demo.user()||Demo.user().role==='pembeli'?`<button class="button small" data-action="add-cart" data-id="${p.id}" ${p.stok===0?'disabled':''}>${UI.icon('cart')}${p.stok===0?'Habis':'Keranjang'}</button>`:''}</div></div></article>`).join(''):'<div class="panel empty-panel span-all"><h2>Produk tidak ditemukan</h2><p>Coba kata kunci atau kategori lain.</p><button class="button" data-action="clear-filters">Tampilkan Semua</button></div>';
  }
  document.getElementById('search').addEventListener('input',render);
  document.getElementById('category').addEventListener('change',render);
  document.getElementById('sort').addEventListener('change',render);
  UI.on('clear-filters',()=>{document.getElementById('search').value='';document.getElementById('category').value='';render();});
  UI.on('add-cart',button=>{
    if(!Demo.user()){location.href=UI.url('login.html?next='+encodeURIComponent(location.href));return;}
    Demo.addToCart(button.dataset.id);UI.toast('Produk ditambahkan ke keranjang.');
  });
  render();window.addEventListener('dlingo:change',render);

}
