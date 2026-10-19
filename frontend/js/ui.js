/* Shared presentation helpers. All dynamic text is escaped before rendering. */
(() => {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    home:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
    product:'M5 5h14a2 2 0 012 2v14H3V7a2 2 0 012-2zm4-3h6v3H9zm1 6v3h4V8z',
    box:'M2 7l10-5 10 5v13l-10 3-10-3zm2 1v10l7 2V10zm9 2v10l7-2V8zM5 6l7 3 7-3-7-2z',
    orders:'M7 3h3V1h4v2h3v2h3v17H4V5h3zm0 5v2h10V8zm0 5v2h10v-2zm0 5v2h7v-2z',
    leaf:'M22 2c-3 4-7 2-12 4-6 2-7 9-3 12 3-5 6-7 11-8-6 3-9 6-11 11H4c1-3 1-5 3-8C3 15 2 18 1 21l2 1c1-3 2-4 4-6 1 6 8 6 12 1 4-5 3-10 3-15z',
    user:'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-6 0-9 3-9 7h18c0-4-3-7-9-7z',
    users:'M8 11a4 4 0 100-8 4 4 0 000 8zm9 0a4 4 0 100-8 4 4 0 000 8zM8 13c-5 0-7 3-7 8h12c-1-4 0-6 2-7-2-1-4-1-7-1zm10 0c-4 0-5 3-4 8h9c0-5-1-8-5-8z',
    cart:'M1 2h4l1 4h17l-3 10H8L5 5H1zm7 16h13v2H8zm2 2a2 2 0 110 4 2 2 0 010-4zm9 0a2 2 0 110 4 2 2 0 010-4z',
    stock:'M2 12h8v10H2zm12 0h8v10h-8zM8 1h8v9H8zm3 0v4h2V1zM5 12v4h2v-4zm12 0v4h2v-4z',
    bank:'M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zm0 3v4h18V6zm2 9v2h6v-2z',
    history:'M12 3a9 9 0 11-8 5H1l4-5 4 5H6a7 7 0 106-3zm-1 4h2v5l4 2-1 2-5-3z',
    upload:'M11 2h2l6 7h-5v7h-4V9H5zm-8 13h3v5h12v-5h3v8H3z',
    edit:'M16 2l6 6-14 14H2v-6zm-3 6L5 16v3h3L19 8l-3-3z',
    trash:'M8 2h8l1 3h5v3H2V5h5zm-3 8h14l-1 12H6zm4 1v8h2v-8zm4 0v8h2v-8z',
    login:'M13 2h8v20h-8v-3h5V5h-5zM8 5l7 7-7 7-2-2 3-3H1v-4h8L6 7z',
    lock:'M6 10V7a6 6 0 1112 0v3h2v12H4V10zm3 0h6V7a3 3 0 00-6 0zm2 4v5h2v-5z',
    save:'M2 2h17l3 3v17H2zm4 2v6h11V4zm0 10v6h12v-6z',
    plus:'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
    eye:'M12 4C6 4 2 8 0 12c2 4 6 8 12 8s10-4 12-8c-2-4-6-8-12-8zm0 3a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z',
    check:'M9 20L1 12l3-3 5 5L20 3l3 3z',
    search:'M10 2a8 8 0 105 14l7 7 2-2-7-7a8 8 0 00-7-12zm0 3a5 5 0 110 10 5 5 0 010-10z',
    mail:'M1 4h22v16H1zm2 2l9 7 9-7-1-1-8 6-8-6z',
    mushroom:'M11 13H8l-1 9h10l-1-9h-3v-2h9C22-3 2-3 2 11h9z',
    arrow:'M13 3l9 9-9 9-2-2 5-5H2v-4h14l-5-5z',
    file:'M4 1h10l6 6v16H4zm9 2v6h6zm-6 9v2h10v-2zm0 5v2h10v-2z'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
  const url = path => new URL(path,base).href;
  const money = n => 'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(n)||0);
  const date = value => new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(value));
  const action = (label, name, glyph='plus', cls='') => `<button type="button" class="button ${cls}" data-action="${escape(name)}">${glyph?icon(glyph):''}${escape(label)}</button>`;
  const link = (label,path,glyph,cls='') => `<a class="button ${cls}" href="${url(path)}">${glyph?icon(glyph):''}${escape(label)}</a>`;
  const banner = (title,description,glyph,cta='') => `<section class="banner ${cta?'has-action':''}" aria-label="${escape(title)}"><h1>${escape(title)}</h1><p>${escape(description)}</p>${cta}<span class="banner-art">${icon(glyph)}</span></section>`;
  const stats = items => `<div class="stats ${items.length===3?'three':''}" style="--cols:${items.length===8?4:items.length}">${items.map(i=>`<div class="stat"><span class="stat-emoji" aria-hidden="true">${i[0]}</span><strong class="stat-value ${i[3]||''}">${escape(i[1])}</strong><span class="stat-label">${escape(i[2])}</span></div>`).join('')}</div>`;
  const heading = (title,button='',cls='') => `<div class="section-heading ${cls}"><h2>${escape(title)}</h2>${button}</div>`;
  const table = (headers,rows,empty='Belum ada data.',cls='') => `<div class="table-wrap"><table class="data-table ${cls}"><thead><tr>${headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td class="empty" colspan="${headers.length}">${escape(empty)}</td></tr>`}</tbody></table></div>`;
  const row = (cells,cls='') => `<tr class="${cls}">${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`;
  const id = value => `<span class="record-id">${escape(value)}</span>`;
  const strong = value => `<span class="record-name">${escape(value)}</span>`;
  const editButtons = (value,label='data') => `<div class="actions"><button type="button" class="icon-button" data-action="edit" data-id="${escape(value)}" aria-label="Edit ${escape(label)}">${icon('edit')}</button><button type="button" class="icon-button danger" data-action="delete" data-id="${escape(value)}" aria-label="Hapus ${escape(label)}">${icon('trash')}</button></div>`;
  const statusLabels = {pending:'Menunggu',dikonfirmasi:'Dikonfirmasi',diproses:'Diproses',dikirim:'Dikirim',selesai:'Selesai',dibatalkan:'Dibatalkan'};
  const badge = (value, tone='') => `<span class="badge ${tone}">${escape(value)}</span>`;
  const status = value => badge(statusLabels[value] || value,({pending:'amber',dikonfirmasi:'',diproses:'',dikirim:'',selesai:'green',dibatalkan:'red'})[value] || '');
  const on = (name,handler) => document.addEventListener('click',event=>{const target=event.target.closest(`[data-action="${name}"]`);if(target){event.preventDefault();Promise.resolve().then(()=>handler(target,event)).catch(error=>toast(error.message,'error'));}});
  let toastRegion;
  function toast(message, tone='') {
    if(!toastRegion){toastRegion=document.createElement('div');toastRegion.className='toast-region';toastRegion.setAttribute('role','status');toastRegion.setAttribute('aria-live','polite');document.body.append(toastRegion);}
    const el=document.createElement('div');el.className=`toast-message ${tone}`;el.textContent=message;toastRegion.append(el);setTimeout(()=>el.remove(),4500);
  }
  function dialog(title,body,onSubmit,submitLabel='Simpan',opts={}) {
    document.querySelector('dialog')?.close();
    const el=document.createElement('dialog');el.className='dialog';el.setAttribute('aria-labelledby','dialog-title');
    el.innerHTML=`<form><header class="dialog-header"><h2 id="dialog-title">${escape(title)}</h2><button class="dialog-close" type="button" aria-label="Tutup dialog">×</button></header><div class="dialog-body">${body}<p class="form-error" role="alert" hidden></p><footer class="dialog-footer"><button class="button secondary" type="button" data-cancel>Batal</button>${submitLabel?`<button class="button ${opts.danger?'danger':''}" type="submit">${escape(submitLabel)}</button>`:''}</footer></div></form>`;
    const returnFocus=document.activeElement;
    el.querySelector('.dialog-close').onclick=()=>el.close();el.querySelector('[data-cancel]').onclick=()=>el.close();
    el.addEventListener('click',event=>{if(event.target===el){const r=el.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)el.close();}});
    el.addEventListener('close',()=>{el.remove();if(returnFocus?.isConnected)returnFocus.focus();});
    el.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();const button=el.querySelector('[type=submit]');if(!button)return;
      const errorBox=el.querySelector('.form-error');errorBox.hidden=true;button.disabled=true;
      try {await onSubmit(Object.fromEntries(new FormData(event.target)),el);el.close();}catch(error){errorBox.textContent=error.message;errorBox.hidden=false;}finally{button.disabled=false;}
    });
    document.body.append(el);el.showModal();return el;
  }
  const field = (name,label,value='',options={}) => {
    const attrs=`id="field-${escape(name)}" name="${escape(name)}" ${options.required?'required':''} ${options.min!==undefined?`min="${options.min}"`:''} ${options.max!==undefined?`max="${options.max}"`:''} ${options.step?`step="${options.step}"`:''} ${options.minlength?`minlength="${options.minlength}"`:''} ${options.placeholder?`placeholder="${escape(options.placeholder)}"`:''} ${options.autocomplete?`autocomplete="${escape(options.autocomplete)}"`:''}`;
    let input;
    if(options.type==='select') input=`<select class="input" ${attrs}>${options.options.map(o=>{const pair=Array.isArray(o)?o:[o,o];return `<option value="${escape(pair[0])}" ${String(pair[0])===String(value)?'selected':''}>${escape(pair[1])}</option>`;}).join('')}</select>`;
    else if(options.type==='textarea') input=`<textarea class="input" ${attrs}>${escape(value)}</textarea>`;
    else input=`<input class="input" type="${options.type||'text'}" ${attrs} value="${escape(value)}">`;
    return `<div class="field"><label for="field-${escape(name)}">${escape(label)}</label>${input}</div>`;
  };
  const form = (title,fields,save,label='Simpan') => dialog(title,fields.map(f=>field(...f)).join(''),save,label);
  const confirm = (title,text,callback) => dialog(title,`<p>${escape(text)}</p>`,callback,'Hapus',{danger:true});
  const productArt = (type='tiram') => {
    let art;
    if(type==='baglog') art='<rect x="45" y="35" width="110" height="120" rx="21" fill="#b48963" stroke="#111" stroke-width="4"/><path d="M53 55h95m-95 15h95m-95 55h95" stroke="#d6b897" stroke-width="9"/><path d="M85 35V14h30v21" fill="#ede3d2" stroke="#111" stroke-width="4"/><path d="M82 14h36" stroke="#111" stroke-width="6"/><path d="M87 100c-25-25-31-11-20 0 12 10 24 12 33 25 0-23 24-30 27-43-18-9-27 5-27 24" fill="#fff6de" stroke="#111" stroke-width="3"/>';
    else if(type==='kuping') art='<path d="M100 151C65 143 35 117 45 87c5-18 29-17 31 2C43 24 93 7 111 59c27-53 75-17 41 26 30-10 38 22 15 38-20 16-42 24-67 28z" fill="#745140" stroke="#111" stroke-width="4"/><path d="M100 146L82 74m20 60l35-57m-40 68L66 104m37 34l44-24" stroke="#bd9074" stroke-width="5" fill="none" stroke-linecap="round"/>';
    else art='<path d="M91 84l-8 63q17 15 34 0l-9-63" fill="#fff7e5" stroke="#111" stroke-width="4"/><path d="M25 86C27 5 173 5 176 86c-35 20-114 20-151 0z" fill="#e6ccaa" stroke="#111" stroke-width="4"/><path d="M35 84q65-18 131 0" fill="none" stroke="#fff6e5" stroke-width="11"/><path d="M56 61q43-34 83 0" stroke="#b99877" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M125 119l-4 34q13 9 24 0l-5-34" fill="#fff7e5" stroke="#111" stroke-width="3"/><path d="M101 119c2-43 65-43 67 0-18 10-49 10-67 0z" fill="#f1dfc4" stroke="#111" stroke-width="3"/>';
    return `<svg viewBox="0 0 200 180" role="img" aria-label="Ilustrasi ${type==='baglog'?'baglog jamur':type==='kuping'?'jamur kuping':'jamur tiram'}">${art}</svg>`;
  };
  const tile = (label,path,glyph,tone='') => `<a class="menu-tile" href="${url(path)}"><span class="tile-icon ${tone}">${icon(glyph)}</span>${escape(label)}</a>`;
  const modalTile = (label,name,glyph,tone='') => `<button type="button" class="menu-tile" data-action="${name}"><span class="tile-icon ${tone}">${icon(glyph)}</span>${escape(label)}</button>`;
  const activities = (limit=5) => Demo.list('activities').slice(0,limit).map(a=>`<div class="activity-row"><div><b>${escape(a.text)}</b><small>${a.initial?'9 hours ago':escape(new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(a.date)))}</small></div><span class="activity-tag">${escape(a.category)}</span></div>`).join('') || '<p class="muted">Belum ada aktivitas.</p>';
  const dashboard = role => `dashboard/${role==='admin'?'admin':role==='pembeli'?'pembeli':'petani'}.html`;
  function shell() {
    const page=document.body.dataset.page, current=Demo.user();
    if(document.body.dataset.auth){
      const roles=document.body.dataset.auth.split(',');
      if(!current){location.replace(url(`login.html?next=${encodeURIComponent(location.href)}`));return false;}
      if(!roles.includes(current.role)){location.replace(url(dashboard(current.role)));return false;}
    }
    const host=document.getElementById('app-header');
    if(host){
      if(document.body.dataset.shell==='store'){
        host.innerHTML=`<div class="top-band"></div><nav class="store-header" aria-label="Navigasi utama"><a class="brand" href="${url('index.html')}"><span class="brand-icon">${icon('mushroom')}</span>JamurTani</a><div class="store-links"><a class="nav-link ${page==='store'?'active':''}" href="${url('index.html')}">Katalog</a>${current?`${link('Dashboard',dashboard(current.role),'home','small')}${current.role==='pembeli'?link('Keranjang','pages/cart.html','cart','small white'):''}`:`${link('Masuk','login.html','login','small secondary')}${link('Daftar','register.html',null,'small')}`}</div></nav>`;
      } else {
        const active=({farmer:'home',admin:'home',buyer:'home',products:'product',buyers:'product',stock:'product',orders:'orders',myorders:'orders',livestock:'leaf',staff:'leaf',profile:'user',users:'users'})[page];
        const navs=current?.role==='pembeli'?[['Home',dashboard('pembeli'),'home'],['Produk','index.html','product'],['Pesanan','pages/my-orders.html','orders'],['Keranjang','pages/cart.html','cart'],['Profil','pages/profile.html','user']]:[['Home',dashboard(current?.role),'home'],['Produk','pages/products-manage.html','product'],['Pesanan','pages/orders-manage.html','orders'],['Ternak','pages/livestock.html','leaf'],['Profil','pages/profile.html','user']];
        host.innerHTML=`<div class="top-band"></div><nav class="top-nav" aria-label="Navigasi utama">${navs.map(([label,path,glyph])=>`<a class="nav-link ${active===glyph?'active':''}" ${active===glyph?'aria-current="page"':''} href="${url(path)}">${icon(glyph)}${label}</a>`).join('')}</nav>`;
      }
    }
    return true;
  }
  const authFormError = (form,error) => {const box=form.querySelector('[role=alert]');box.textContent=error.message;box.hidden=false;};
  const submit = (form,handler) => form.addEventListener('submit',async event=>{event.preventDefault();const btn=form.querySelector('[type=submit]');const error=form.querySelector('[role=alert]');if(error)error.hidden=true;btn.disabled=true;try{await handler(Object.fromEntries(new FormData(form)));}catch(e){if(error)authFormError(form,e);else toast(e.message,'error');}finally{btn.disabled=false;}});
  on('logout',()=>{Demo.logout();location.href=url('login.html');});
  on('history',()=>dialog('Riwayat Aktivitas',activities(30),null,''));
  on('bank',()=>{const u=Demo.user();form('Rekening Pembayaran',[
    ['nama_bank','Nama Bank',u.nama_bank||'',{required:true}],['no_rekening','Nomor Rekening',u.no_rekening||'',{required:true}],
  ],async values=>{await Demo.updateProfile(values);toast('Rekening berhasil diperbarui.');});});
  on('upload',()=>{
    const el=dialog('Upload File',`${field('file','Pilih file gambar atau dokumen','',{type:'file'})}<p class="form-note">File hanya dipratinjau di perangkat Anda.</p><div id="upload-preview" aria-live="polite"></div>`,null,'');
    const input=el.querySelector('[type=file]');input.removeAttribute('value');input.accept='image/*,.pdf,.csv,.txt,.docx';let objectUrl;
    input.addEventListener('change',()=>{const file=input.files[0],preview=el.querySelector('#upload-preview');if(objectUrl)URL.revokeObjectURL(objectUrl);preview.replaceChildren();if(!file)return;const meta=document.createElement('div');meta.className='upload-meta';meta.textContent=`${file.name} · ${(file.size/1024).toFixed(1)} KB`;preview.append(meta);if(file.type.startsWith('image/')){objectUrl=URL.createObjectURL(file);const img=document.createElement('img');img.src=objectUrl;img.alt=file.name;img.className='file-preview';preview.append(img);}});
    el.addEventListener('close',()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);});
  });
  on('toggle-password',button=>{const input=document.getElementById(button.dataset.target);input.type=input.type==='password'?'text':'password';button.setAttribute('aria-label',input.type==='password'?'Tampilkan kata sandi':'Sembunyikan kata sandi');});
  window.UI={escape,icon,url,money,date,action,link,banner,stats,heading,table,row,id,strong,editButtons,status,statusLabels,badge,on,toast,dialog,field,form,confirm,productArt,tile,modalTile,activities,dashboard,submit,authFormError};
  window.AppReady=shell();
})();
