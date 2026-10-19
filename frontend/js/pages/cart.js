'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  const draft={alamat:Demo.user().alamat||'',catatan:''};
  function render(){
    const items=Demo.cartItems(),total=items.reduce((sum,i)=>sum+i.product.harga*i.quantity,0);
    if(!items.length){main.innerHTML=UI.banner('Keranjang Belanja','Produk pilihan Anda sebelum memesan.','cart')+`<section class="panel empty-panel section">${UI.icon('cart')}<h2>Keranjang Anda Kosong</h2><p>Temukan produk dari petani Desa Dlingo.</p>${UI.link('Lihat Katalog','index.html','arrow')}</section>`;return;}
    main.innerHTML=UI.banner('Keranjang Belanja','Periksa produk dan jumlah pesanan Anda.','cart')+`<div class="checkout-layout"><section>`+
      UI.table(['Produk','Harga','Jumlah','Subtotal','Aksi'],items.map(i=>UI.row([
        `<a href="${UI.url('pages/product-detail.html?id='+i.productId)}"><b>${UI.escape(i.product.nama)}</b></a>`,UI.money(i.product.harga),
        `<div class="quantity"><button type="button" data-action="quantity" data-id="${i.productId}" data-quantity="${i.quantity-1}" aria-label="Kurangi ${UI.escape(i.product.nama)}">−</button><input data-product-id="${i.productId}" type="number" min="1" max="${i.product.stok}" step="1" value="${i.quantity}" aria-label="Jumlah ${UI.escape(i.product.nama)}"><button type="button" data-action="quantity" data-id="${i.productId}" data-quantity="${i.quantity+1}" aria-label="Tambah ${UI.escape(i.product.nama)}" ${i.quantity>=i.product.stok?'disabled':''}>+</button></div>`,
        UI.strong(UI.money(i.product.harga*i.quantity)),`<button type="button" class="icon-button danger" data-action="remove-cart" data-id="${i.productId}" aria-label="Hapus ${UI.escape(i.product.nama)}">${UI.icon('trash')}</button>`
      ])))+`<p class="form-note">${UI.link('Lanjut Belanja','index.html',null,'small secondary')}</p></section><aside class="panel"><h2>Ringkasan Pesanan</h2><div class="summary-line"><span>Jumlah barang</span><b>${items.reduce((s,i)=>s+i.quantity,0)}</b></div><div class="summary-line total"><span>Total</span><span>${UI.money(total)}</span></div><form id="checkout-form">${UI.field('alamat','Alamat Pengiriman',draft.alamat,{type:'textarea',required:true})}${UI.field('catatan','Catatan',draft.catatan,{type:'textarea',placeholder:'Catatan untuk petani (opsional)'})}<p class="form-error" role="alert" hidden></p><button class="button full-width" type="submit">${UI.icon('orders')}Buat Pesanan</button><p class="form-note">Transfer langsung ke rekening petani setelah pesanan dibuat. Pengiriman diatur bersama petani.</p></form></aside></div>`;
    const form=document.getElementById('checkout-form');
    form.addEventListener('input',event=>{if(event.target.name)draft[event.target.name]=event.target.value;});
    UI.submit(form,values=>{const order=Demo.createOrder({...values,items:Demo.cartItems().map(i=>({productId:i.productId,quantity:i.quantity}))});location.href=UI.url('pages/my-orders.html?order='+order.id);});
  }
  UI.on('quantity',button=>Demo.setCartQty(button.dataset.id,Number(button.dataset.quantity)));
  UI.on('remove-cart',button=>Demo.setCartQty(button.dataset.id,0));
  document.addEventListener('change',event=>{if(event.target.matches('[data-product-id]')){try{Demo.setCartQty(event.target.dataset.productId,Number(event.target.value));}catch(error){UI.toast(error.message,'error');render();}}});
  render();window.addEventListener('dlingo:cart',render);window.addEventListener('dlingo:change',render);

}
