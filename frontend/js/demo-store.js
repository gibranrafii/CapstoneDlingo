/* Browser-local prototype data. Independent of the Node/Laravel API. */
(() => {
  'use strict';
  const KEY = 'dlingo.demo.v1';
  const SESSION = 'dlingo.session';
  const clone = value => JSON.parse(JSON.stringify(value));
  const seed = () => ({
    users: [
      { id: 'USR-001', username: 'superadmin', nama: 'Administrator', email: 'admin@dlingo.test', role: 'admin', no_telepon: '0812-0000-0001', created_at: '2026-07-02T08:00:00', updated_at: '2026-07-02T08:00:00', demo: true },
      { id: 'USR-002', username: 'admin', nama: 'Budi Santoso', email: 'budi@example.com', role: 'petani', no_telepon: '0812-3456-7890', created_at: '2026-07-02T08:00:00', updated_at: '2026-07-02T08:00:00', no_rekening: '1234567890', nama_bank: 'BRI', demo: true },
      { id: 'USR-003', username: 'pembeli', nama: 'Andi Pratama', email: 'andi@dlingo.test', role: 'pembeli', no_telepon: '0811-111-111', alamat: 'Jl. Merdeka No. 12', buyerId: 'PBL-001', created_at: '2026-07-02T08:00:00', demo: true }
    ],
    products: [
      { id: 'PRD-001', nama: 'Jamur Tiram', kategori: 'Jamur', harga: 15000, satuan: 'kg', stok: 25, deskripsi: 'Jamur tiram segar dari budidaya petani Desa Dlingo. Dipanen dengan teliti untuk menjaga kualitas dan kesegarannya.', art: 'tiram', ownerId: 'USR-002' },
      { id: 'PRD-002', nama: 'Jamur Kuping', kategori: 'Jamur', harga: 20000, satuan: 'kg', stok: 8, deskripsi: 'Jamur kuping pilihan dengan tekstur kenyal. Cocok untuk melengkapi sup, tumisan, dan berbagai olahan rumahan.', art: 'kuping', ownerId: 'USR-002' },
      { id: 'PRD-003', nama: 'Baglog Tiram', kategori: 'Baglog', harga: 12000, satuan: 'pcs', stok: 150, deskripsi: 'Media tanam jamur tiram siap budidaya. Pilihan praktis untuk memulai dan mengembangkan usaha jamur Anda.', art: 'baglog', ownerId: 'USR-002' }
    ],
    buyers: [
      { id: 'PBL-001', nama: 'Warung Makmur', no_telepon: '0811-111-111', email: '', alamat: 'Jl. Merdeka No. 12', ownerId: 'USR-002' },
      { id: 'PBL-002', nama: 'Toko Segar', no_telepon: '0811-222-222', email: '', alamat: 'Jl. Kemangi No. 7', ownerId: 'USR-002' }
    ],
    staff: [
      { id: 'PGR-001', nama: 'Slamet Riyadi', no_telepon: '0812-9876-543', email: '', alamat: 'Desa Sumberejo', active: true, ownerId: 'USR-002' },
      { id: 'PGR-002', nama: 'Supardi', no_telepon: '0812-2345-678', email: '', alamat: 'Dukuh Krajan', active: true, ownerId: 'USR-002' },
      { id: 'PGR-003', nama: 'Kartini', no_telepon: '0813-4567-890', email: '', alamat: 'Kedungrejo', active: true, ownerId: 'USR-002' }
    ],
    livestock: [
      { id: 'TNK-001', nama: 'Sapi Limosingffggf', nomor: 'TNK-001', kategori: 'Sapi', usia: 36, berat: 350, harga: 15000000, staffIds: ['PGR-001'], ownerId: 'USR-002' },
      { id: 'TNK-002', nama: 'Sapi Brahman', nomor: 'TNK-002', kategori: 'Sapi', usia: 24, berat: 280, harga: 12000000, staffIds: ['PGR-002'], ownerId: 'USR-002' },
      { id: 'TNK-003', nama: 'Kambing PE', nomor: 'TNK-003', kategori: 'Kambing', usia: 12, berat: 45, harga: 3000000, staffIds: ['PGR-001'], ownerId: 'USR-002' },
      { id: 'TNK-004', nama: 'Sapi Simental', nomor: 'TNK-004', kategori: 'Sapi', usia: 48, berat: 320, harga: 18000000, staffIds: ['PGR-003'], ownerId: 'USR-002' }
    ],
    orders: [],
    activities: [{ id: 'ACT-001', text: 'Ternak Sapi Limosingffggf diubah', category: 'Ternak', date: '2026-07-02T08:00:00', initial: true }]
  });
  const load = () => {
    try { const data = JSON.parse(localStorage.getItem(KEY)); if (data && ['users','products','buyers','staff','livestock','orders','activities'].every(k => Array.isArray(data[k]))) return data; } catch (_) { /* initialize damaged/missing demo data */ }
    const data = seed(); localStorage.setItem(KEY, JSON.stringify(data)); return data;
  };
  const write = data => { localStorage.setItem(KEY, JSON.stringify(data)); window.dispatchEvent(new CustomEvent('dlingo:change')); };
  const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION)); } catch (_) { return null; } };
  const user = () => load().users.find(u => u.id === session()?.userId) || null;
  const uid = (data, entity) => {
    const prefixes = { users:'USR', products:'PRD', buyers:'PBL', staff:'PGR', livestock:'TNK', orders:'PSN', activities:'ACT' };
    const n = Math.max(0,...data[entity].map(i => Number(i.id.split('-')[1]) || 0)) + 1;
    return `${prefixes[entity]}-${String(n).padStart(3, '0')}`;
  };
  const log = (data, text, category) => data.activities.unshift({ id: uid(data,'activities'), text, category, date: new Date().toISOString() });
  const digest = async password => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)))].map(b => b.toString(16).padStart(2,'0')).join('');
  const requireManager = () => { if (!['admin','petani'].includes(user()?.role)) throw Error('Anda tidak memiliki akses untuk mengubah data ini.'); };
  const cartKey = () => `dlingo.cart.${user()?.id || 'guest'}`;
  const getCart = () => { try { const value = JSON.parse(localStorage.getItem(cartKey())); return Array.isArray(value) ? value : []; } catch (_) { return []; } };
  const saveCart = items => { localStorage.setItem(cartKey(), JSON.stringify(items)); window.dispatchEvent(new CustomEvent('dlingo:cart')); };
  const Store = {
    snapshot: () => clone(load()), user, session,
    list: entity => clone(load()[entity] || []),
    get: (entity, id) => clone(load()[entity]?.find(i => i.id === id) || null),
    async login(identity, password, remember = false) {
      const found = load().users.find(u => u.username.toLowerCase() === identity.toLowerCase().trim() || u.email.toLowerCase() === identity.toLowerCase().trim());
      if (!found || (found.passwordHash ? found.passwordHash !== await digest(password) : !found.demo || password !== 'demo12345')) throw Error('Username atau kata sandi salah.');
      sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION);
      (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify({ userId: found.id }));
      return clone(found);
    },
    logout() { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); },
    async register(values) {
      const data = load();
      if (data.users.some(u => u.username.toLowerCase() === values.username.toLowerCase() || u.email.toLowerCase() === values.email.toLowerCase())) throw Error('Username atau email sudah digunakan.');
      const entry = { ...values, id: uid(data,'users'), role: values.role === 'petani' ? 'petani' : 'pembeli', created_at: new Date().toISOString(), passwordHash: await digest(values.password) };
      delete entry.password;
      if (entry.role === 'pembeli') { entry.buyerId = uid(data,'buyers'); data.buyers.push({ id:entry.buyerId, nama:entry.nama, email:entry.email, no_telepon:entry.no_telepon, alamat:entry.alamat, ownerId:'USR-002' }); }
      data.users.push(entry); log(data, `${entry.nama} mendaftar`, 'Pengguna'); write(data); return clone(entry);
    },
    async updateProfile(values) {
      const data = load(), current = data.users.find(u => u.id === user()?.id);
      if (!current) throw Error('Silakan masuk kembali.');
      if (data.users.some(u => u.id !== current.id && (u.email.toLowerCase() === values.email?.toLowerCase() || u.username.toLowerCase() === values.username?.toLowerCase()))) throw Error('Username atau email sudah digunakan.');
      const { nama, email, no_telepon, alamat, username, no_rekening, nama_bank } = values;
      Object.assign(current, Object.fromEntries(Object.entries({ nama,email,no_telepon,alamat,username,no_rekening,nama_bank }).filter(([,v]) => v !== undefined)));
      if (values.password) { current.passwordHash = await digest(values.password); current.demo = false; }
      current.updated_at = new Date().toISOString();
      if (current.buyerId) { const buyer=data.buyers.find(b=>b.id===current.buyerId); if(buyer) Object.assign(buyer,{nama:current.nama,email:current.email,no_telepon:current.no_telepon,alamat:current.alamat}); }
      log(data,'Profil akun diperbarui','Profil'); write(data); return clone(current);
    },
    save(entity, values) {
      requireManager();
      if (!['products','buyers','staff','livestock'].includes(entity)) throw Error('Jenis data tidak didukung.');
      const data = load(), existing = data[entity].find(i => i.id === values.id);
      const record = { ...existing, ...values, id:existing?.id || uid(data,entity), ownerId:existing?.ownerId || user().id };
      if (!record.nama?.trim()) throw Error('Nama wajib diisi.');
      if (entity === 'products' && (!Number.isInteger(record.stok) || record.stok < 0 || !Number.isFinite(record.harga) || record.harga < 0)) throw Error('Harga dan stok harus valid dan tidak boleh negatif.');
      if (entity === 'livestock' && [record.usia,record.berat,record.harga].some(v=>!Number.isFinite(v)||v<0)) throw Error('Usia, berat, dan harga harus valid dan tidak boleh negatif.');
      if (existing) data[entity][data[entity].findIndex(i=>i.id===existing.id)] = record; else data[entity].push(record);
      const labels = {products:'Produk',buyers:'Pembeli',staff:'Pengurus',livestock:'Ternak'};
      log(data,`${labels[entity]} ${record.nama} ${existing?'diubah':'ditambahkan'}`,labels[entity]); write(data); return clone(record);
    },
    remove(entity, id) {
      requireManager(); const data = load();
      if (!['products','buyers','staff','livestock'].includes(entity)) throw Error('Jenis data tidak didukung.');
      if (entity === 'products' && data.orders.some(o=>o.items.some(i=>i.productId===id))) throw Error('Produk sudah tercatat dalam pesanan dan tidak dapat dihapus.');
      if (entity === 'buyers' && data.orders.some(o=>o.buyerId===id)) throw Error('Pembeli sudah memiliki pesanan dan tidak dapat dihapus.');
      const entry = data[entity].find(i=>i.id===id); if(!entry) throw Error('Data tidak ditemukan.');
      data[entity]=data[entity].filter(i=>i.id!==id);
      if(entity==='staff') data.livestock.forEach(l=>{l.staffIds=(l.staffIds||[]).filter(s=>s!==id);});
      log(data,`${entry.nama} dihapus`,{products:'Produk',buyers:'Pembeli',staff:'Pengurus',livestock:'Ternak'}[entity]); write(data);
    },
    async saveUser(values) {
      if(user()?.role!=='admin') throw Error('Akses administrator diperlukan.');
      const data=load(), existing=data.users.find(u=>u.id===values.id);
      if(existing?.id===user().id && values.role!=='admin') throw Error('Peran akun Anda sendiri tidak dapat diubah.');
      if(data.users.some(u=>u.id!==values.id&&(u.username.toLowerCase()===values.username.toLowerCase()||u.email.toLowerCase()===values.email.toLowerCase()))) throw Error('Username atau email sudah digunakan.');
      const entry={...existing,...values,id:existing?.id||uid(data,'users'),created_at:existing?.created_at||new Date().toISOString()};
      if(values.password) {entry.passwordHash=await digest(values.password);entry.demo=false;} else if(!existing) throw Error('Kata sandi wajib diisi.');
      delete entry.password;
      if(entry.role==='pembeli'&&!entry.buyerId){entry.buyerId=uid(data,'buyers');data.buyers.push({id:entry.buyerId,nama:entry.nama,email:entry.email,no_telepon:entry.no_telepon,alamat:'',ownerId:'USR-002'});}
      if(existing) data.users[data.users.findIndex(u=>u.id===existing.id)]=entry; else data.users.push(entry);
      log(data,`Akun ${entry.nama} ${existing?'diubah':'ditambahkan'}`,'Pengguna');write(data);
    },
    removeUser(id) {
      if(user()?.role!=='admin') throw Error('Akses administrator diperlukan.');
      if(id===user().id) throw Error('Akun Anda sendiri tidak dapat dihapus.');
      const data=load();
      if(data.products.some(p=>p.ownerId===id)||data.livestock.some(l=>l.ownerId===id)||data.orders.some(o=>o.userId===id)) throw Error('Akun masih terhubung dengan data produk, ternak, atau pesanan.');
      data.users=data.users.filter(u=>u.id!==id);log(data,'Akun pengguna dihapus','Pengguna');write(data);
    },
    cart: getCart,
    cartItems: () => getCart().map(i=>({...i,product:Store.get('products',i.productId)})).filter(i=>i.product),
    setCartQty(productId, quantity) {
      if(user()?.role!=='pembeli') throw Error('Masuk sebagai pembeli untuk berbelanja.');
      const product=Store.get('products',productId);
      if(!product) throw Error('Produk tidak ditemukan.');
      if(!Number.isInteger(quantity)||quantity<0||quantity>product.stok) throw Error(`Jumlah harus antara 0 dan ${product.stok}.`);
      const items=getCart().filter(i=>i.productId!==productId); if(quantity) items.push({productId,quantity}); saveCart(items);
    },
    addToCart(id, quantity=1) { const existing=getCart().find(i=>i.productId===id); Store.setCartQty(id,(existing?.quantity||0)+quantity); },
    createOrder({ buyerId, items, alamat, catatan='' }) {
      if(!user()) throw Error('Silakan masuk terlebih dahulu.');
      const data=load(), current=user();
      if(current.role==='pembeli') buyerId=current.buyerId;
      if(!data.buyers.some(b=>b.id===buyerId)) throw Error('Pilih pembeli yang valid.');
      if(!alamat?.trim()) throw Error('Alamat pengiriman wajib diisi.');
      if(!items?.length) throw Error('Pesanan harus memiliki minimal satu produk.');
      const merged=new Map();
      items.forEach(i=>{if(!Number.isInteger(i.quantity)||i.quantity<1)throw Error('Jumlah produk harus berupa bilangan bulat positif.');merged.set(i.productId,(merged.get(i.productId)||0)+i.quantity);});
      const lines=[...merged].map(([productId,quantity])=>{
        const p=data.products.find(p=>p.id===productId); if(!p||p.stok<quantity)throw Error(`Stok ${p?.nama||'produk'} tidak mencukupi.`);
        return {productId,quantity,nama:p.nama,harga:p.harga,satuan:p.satuan,ownerId:p.ownerId};
      });
      lines.forEach(i=>{data.products.find(p=>p.id===i.productId).stok-=i.quantity;});
      const order={id:uid(data,'orders'),buyerId,userId:current.role==='pembeli'?current.id:null,items:lines,total:lines.reduce((s,i)=>s+i.harga*i.quantity,0),alamat:alamat.trim(),catatan,status:'pending',date:new Date().toISOString()};
      data.orders.unshift(order);log(data,`Pesanan ${order.id} ditambahkan`,'Pesanan');write(data);
      if(current.role==='pembeli')saveCart([]);
      return clone(order);
    },
    updateOrderStatus(id, status) {
      const valid=['pending','dikonfirmasi','diproses','dikirim','selesai','dibatalkan'];
      if(!valid.includes(status)) throw Error('Status tidak valid.');
      const data=load(), order=data.orders.find(o=>o.id===id), current=user();
      if(!order||!current)throw Error('Pesanan tidak ditemukan.');
      if(current.role==='pembeli'&&(order.userId!==current.id||status!=='dibatalkan'||!['pending','dikonfirmasi'].includes(order.status))) throw Error('Pesanan ini tidak dapat dibatalkan.');
      if(['selesai','dibatalkan'].includes(order.status)) throw Error('Pesanan sudah ditutup.');
      const steps=['pending','dikonfirmasi','diproses','dikirim','selesai'];
      if(status!=='dibatalkan'&&steps.indexOf(status)<steps.indexOf(order.status))throw Error('Status pesanan tidak dapat dimundurkan.');
      if(status==='dibatalkan')order.items.forEach(i=>{const p=data.products.find(p=>p.id===i.productId);if(p)p.stok+=i.quantity;});
      order.status=status;log(data,`Pesanan ${id}: ${status}`,'Pesanan');write(data);
    },
    reset() { for(const key of Object.keys(localStorage))if(key.startsWith('dlingo.'))localStorage.removeItem(key);sessionStorage.removeItem(SESSION);write(seed()); },
    storageKey: KEY
  };
  window.Demo = Store;
  window.addEventListener('storage',event=>{if(event.key?.startsWith('dlingo.'))window.dispatchEvent(new CustomEvent('dlingo:change'));});
})();
