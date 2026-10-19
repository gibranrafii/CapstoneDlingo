(() => {
  'use strict';
  const detail = order => {
    const buyer=Demo.get('buyers',order.buyerId);
    const farmers=[...new Set(order.items.map(i=>i.ownerId))].map(id=>Demo.get('users',id)).filter(Boolean);
    const lines=order.items.map(i=>`<div class="order-item"><span>${UI.escape(i.nama)} × ${i.quantity} ${UI.escape(i.satuan)}</span><b>${UI.money(i.harga*i.quantity)}</b></div>`).join('');
    return `<div class="flex-row">${UI.status(order.status)}<span class="muted">${UI.date(order.date)}</span></div><div class="mt-20"><p><b>${UI.escape(buyer?.nama||'Pembeli')}</b></p><p class="muted">${UI.escape(order.alamat)}</p></div><div class="mt-20">${lines}<div class="summary-line total"><span>Total</span><span>${UI.money(order.total)}</span></div></div>${order.catatan?`<p class="muted">Catatan: ${UI.escape(order.catatan)}</p>`:''}<h3 class="mt-20">Informasi Pembayaran</h3>${farmers.map(f=>`<div class="info-item mt-20"><p><b>${UI.escape(f.nama)}</b></p><p>${UI.escape(f.nama_bank||'Bank belum diisi')} · ${UI.escape(f.no_rekening||'Rekening belum diisi')}</p><p class="muted">${UI.escape(f.no_telepon||'')}</p></div>`).join('')}<p class="form-note">Hubungi petani untuk konfirmasi pembayaran dan pengiriman.</p>`;
  };
  const view = order => UI.dialog(`Pesanan ${order.id}`,detail(order),null,'');
  function create() {
    const buyers=Demo.list('buyers'),products=Demo.list('products');
    if(!buyers.length||!products.length){UI.toast('Tambahkan pembeli dan produk terlebih dahulu.','error');return;}
    const body=UI.field('buyerId','Pembeli',buyers[0].id,{type:'select',required:true,options:buyers.map(b=>[b.id,b.nama])})+
      UI.field('alamat','Alamat Pengiriman',buyers[0].alamat||'',{type:'textarea',required:true})+
      '<h3 class="mt-20">Produk</h3><p class="form-note">Isi jumlah untuk produk yang dipesan.</p>'+products.map(p=>UI.field(`qty-${p.id}`,`${p.nama} · ${UI.money(p.harga)}/${p.satuan} · Stok ${p.stok}`,0,{type:'number',min:0,max:p.stok,step:1})).join('')+
      UI.field('catatan','Catatan','',{type:'textarea'});
    const el=UI.dialog('Tambah Pesanan',body,values=>{
      const items=products.map(p=>({productId:p.id,quantity:Number(values[`qty-${p.id}`])})).filter(i=>i.quantity>0);
      Demo.createOrder({buyerId:values.buyerId,alamat:values.alamat,catatan:values.catatan,items});UI.toast('Pesanan berhasil ditambahkan.');
    },'Buat Pesanan');
    el.querySelector('[name=buyerId]').addEventListener('change',event=>{el.querySelector('[name=alamat]').value=buyers.find(b=>b.id===event.target.value)?.alamat||'';});
  }
  function status(order) {
    if(['selesai','dibatalkan'].includes(order.status)){UI.toast('Pesanan sudah ditutup.');return;}
    const steps=['pending','dikonfirmasi','diproses','dikirim','selesai'];
    const available=steps.slice(steps.indexOf(order.status)).concat('dibatalkan');
    UI.form(`Status ${order.id}`,[['status','Status Pesanan',order.status,{type:'select',options:available.map(s=>[s,UI.statusLabels[s]])}]],values=>{Demo.updateOrderStatus(order.id,values.status);UI.toast('Status pesanan berhasil diperbarui.');});
  }
  window.OrderUI={detail,view,create,status};
})();
