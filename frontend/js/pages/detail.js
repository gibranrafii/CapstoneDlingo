'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  const productId=new URLSearchParams(location.search).get('id');
  function render(){
    const p=Demo.get('products',productId);
    if(!p){main.innerHTML=`<section class="panel empty-panel"><h1>Produk Tidak Ditemukan</h1><p>Produk ini mungkin sudah dihapus.</p>${UI.link('Kembali ke Katalog','index.html','arrow')}</section>`;return;}
    document.title=p.nama+' — JamurTani';
    const farmer=Demo.get('users',p.ownerId);
    main.innerHTML=`<p class="breadcrumbs"><a href="${UI.url('index.html')}">Katalog Produk</a> / ${UI.escape(p.nama)}</p><section class="detail-layout"><div class="product-art ${UI.escape(p.art||'tiram')}">${UI.productArt(p.art)}</div><div class="detail-content">${UI.badge(p.kategori)}<h1>${UI.escape(p.nama)}</h1><p class="muted">Dibudidayakan oleh ${UI.escape(farmer?.nama||'petani Desa Dlingo')}</p><div class="product-price">${UI.money(p.harga)}</div><p class="muted">per ${UI.escape(p.satuan)} · <b class="${p.stok<10?'red':'green'}">Stok ${p.stok}</b></p><p class="detail-description">${UI.escape(p.deskripsi||'Produk pilihan dari petani lokal Desa Dlingo.')}</p>${!Demo.user()||Demo.user().role==='pembeli'?`<form id="add-cart-form" class="mt-20"><label for="quantity">Jumlah (${UI.escape(p.satuan)})</label><div class="flex-row mt-20"><input class="input" style="width:100px" id="quantity" name="quantity" type="number" value="${p.stok?1:0}" min="1" max="${p.stok}" step="1" required ${!p.stok?'disabled':''}><button class="button" type="submit" ${!p.stok?'disabled':''}>${UI.icon('cart')}${p.stok?'Tambah ke Keranjang':'Stok Habis'}</button></div><p class="form-error" role="alert" hidden></p></form>`:''}</div></section><div class="two-column"><section class="panel"><h2>Informasi Petani</h2><p><b>${UI.escape(farmer?.nama||'Petani Desa Dlingo')}</b></p><p class="muted">Desa Dlingo, Imogiri</p>${farmer?.no_telepon?`<p class="mt-20"><a href="tel:${farmer.no_telepon.replace(/[^\d+]/g,'')}">${UI.escape(farmer.no_telepon)}</a></p>`:''}</section><section class="panel"><h2>Informasi Pembayaran</h2><p><b>${UI.escape(farmer?.nama_bank||'Hubungi petani')}</b> · ${UI.escape(farmer?.no_rekening||'Rekening belum diisi')}</p><p class="form-note">Pembayaran ditransfer langsung ke rekening petani. Hubungi petani untuk menyepakati pengiriman.</p></section></div>`;
    const form=document.getElementById('add-cart-form');
    if(form)UI.submit(form,values=>{
      if(!Demo.user()){location.href=UI.url('login.html?next='+encodeURIComponent(location.href));return;}
      Demo.addToCart(p.id,Number(values.quantity));UI.toast('Produk ditambahkan ke keranjang.');
    });
  }
  render();window.addEventListener('dlingo:change',render);

}
