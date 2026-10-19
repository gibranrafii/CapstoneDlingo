/* Integration checks run against an isolated local static server and fresh browser contexts. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { existsSync } = require('node:fs');
const { chromium } = require('playwright');
const { createFrontendServer } = require('../scripts/serve.cjs');

const pages = [
  ['login.html','guest'],['register.html','guest'],['index.html','guest'],
  ['dashboard/petani.html','petani'],['pages/products-manage.html','petani'],
  ['pages/buyers-manage.html','petani'],['pages/stock.html','petani'],
  ['pages/orders-manage.html','petani'],['pages/profile.html','petani'],
  ['pages/livestock.html','petani'],['pages/caretakers.html','petani'],
  ['pages/product-detail.html?id=PRD-001','guest'],['pages/cart.html','pembeli'],
  ['pages/my-orders.html','pembeli'],['dashboard/pembeli.html','pembeli'],
  ['dashboard/admin.html','admin'],['pages/users-manage.html','admin']
];
const ids = {petani:'USR-002',pembeli:'USR-003',admin:'USR-001'};
const artifacts = path.resolve(__dirname,'../test-results');

(async () => {
  const server = createFrontendServer();
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  let browser;
  const errors = [], apiRequests = [], links = new Set();
  let checks = 0;
  const ok = label => { checks++; console.log(`PASS ${label}`); };
  try {
    browser = await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
    await fs.mkdir(artifacts,{recursive:true});
    const attach = page => {
      page.on('pageerror',error=>errors.push(`${page.url()}: ${error.message}`));
      page.on('request',request=>{if(request.url().includes('/api/'))apiRequests.push(request.url());});
      page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    };
    for (const [route,role] of pages) {
      const context=await browser.newContext({viewport:{width:1584,height:900}});
      if(role!=='guest')await context.addInitScript(id=>sessionStorage.setItem('dlingo.session',JSON.stringify({userId:id})),ids[role]);
      const page=await context.newPage();attach(page);
      await page.goto(new URL(route,base).href);
      assert.equal(await page.locator('h1').count(),1,`${route}: one visible page heading`);
      assert.ok(await page.locator('h1').isVisible());
      assert.equal(new URL(page.url()).pathname,new URL(route,base).pathname);
      for(const href of await page.locator('a[href]').evaluateAll(elements=>elements.map(e=>e.href))){const u=new URL(href);if(u.origin===new URL(base).origin)links.add(u.pathname);}
      const slug=route.replace(/[^a-z0-9-]/gi,'-');
      await page.screenshot({path:path.join(artifacts,`${slug}-desktop.png`),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route}: mobile body overflow`);
      await page.screenshot({path:path.join(artifacts,`${slug}-mobile.png`),fullPage:true});
      await context.close();ok(`${route}: desktop, mobile, no overflow`);
    }
    for(const pathname of links){const response=await fetch(new URL(pathname,base));assert.equal(response.status,200,`Broken link: ${pathname}`);}
    ok(`${links.size} internal navigation targets resolve`);

    async function fresh() {const context=await browser.newContext();const page=await context.newPage();attach(page);return {context,page};}
    async function go(page,route){await page.goto(new URL(route,base).href);}
    async function login(page,username,password='demo12345'){
      await go(page,'login.html');await page.locator('[name=username]').fill(username);await page.locator('[name=password]').fill(password);
      await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.waitForURL('**/dashboard/*.html');
    }
    async function saveDialog(page,label='Simpan'){const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:label,exact:true}).click();await dialog.waitFor({state:'hidden'});}

    {
      const {context,page}=await fresh();
      await go(page,'pages/products-manage.html');await page.waitForURL('**/login.html?next=*');
      await page.locator('[name=username]').fill('admin');await page.locator('[name=password]').fill('wrong');await page.getByRole('button',{name:'Masuk',exact:true}).click();
      await page.locator('[role=alert]:visible').waitFor();assert.match(await page.locator('[role=alert]').innerText(),/salah/);
      await login(page,'admin');
      await go(page,'pages/products-manage.html');
      await page.getByRole('button',{name:'Tambah Produk',exact:true}).first().click();
      let dialog=page.getByRole('dialog');await dialog.locator('[name=nama]').fill('Jamur Lingzhi Uji');await dialog.locator('[name=harga]').fill('40000');await dialog.locator('[name=stok]').fill('7');await saveDialog(page);
      assert.equal(await page.locator('tbody tr').count(),4);
      await page.getByRole('button',{name:'Edit Jamur Lingzhi Uji',exact:true}).click();dialog=page.getByRole('dialog');await dialog.locator('[name=stok]').fill('12');await saveDialog(page);await page.reload();
      assert.match(await page.locator('tr').filter({hasText:'Jamur Lingzhi Uji'}).innerText(),/12/);
      await page.getByRole('button',{name:'Hapus Jamur Lingzhi Uji',exact:true}).click();await saveDialog(page,'Hapus');assert.equal(await page.locator('tbody tr').count(),3);
      ok('Product creation, editing, deletion, and reload persistence');

      await go(page,'pages/buyers-manage.html');await page.getByRole('button',{name:'Tambah Pembeli',exact:true}).first().click();
      await page.getByRole('dialog').locator('[name=nama]').fill('Pembeli Uji');await saveDialog(page);assert.equal(await page.locator('tbody tr').count(),3);
      await page.getByRole('button',{name:'Hapus Pembeli Uji',exact:true}).click();await saveDialog(page,'Hapus');
      ok('Buyer management');

      await go(page,'pages/caretakers.html');await page.getByRole('button',{name:'Tambah Pengurus',exact:true}).first().click();
      await page.getByRole('dialog').locator('[name=nama]').fill('Pengurus Uji');await saveDialog(page);
      await go(page,'pages/livestock.html');await page.getByRole('button',{name:'Edit Sapi Brahman',exact:true}).click();
      await page.getByRole('dialog').getByLabel('Pengurus Uji',{exact:true}).check();await saveDialog(page);await page.reload();
      assert.match(await page.locator('tr').filter({hasText:'Sapi Brahman'}).innerText(),/Pengurus Uji/);
      await go(page,'pages/caretakers.html');await page.getByRole('button',{name:'Hapus Pengurus Uji',exact:true}).click();await saveDialog(page,'Hapus');
      await go(page,'pages/livestock.html');assert.doesNotMatch(await page.locator('tbody').innerText(),/Pengurus Uji/);
      ok('Caretaker CRUD and livestock assignment cleanup');

      await go(page,'pages/orders-manage.html');await page.getByRole('button',{name:'Tambah Pesanan',exact:true}).first().click();
      await page.getByRole('dialog').locator('[name="qty-PRD-001"]').fill('2');await saveDialog(page,'Buat Pesanan');
      assert.equal(await page.evaluate(()=>Demo.get('products','PRD-001').stok),23);
      await page.getByRole('button',{name:'Ubah status PSN-001',exact:true}).click();await page.getByRole('dialog').locator('[name=status]').selectOption('dikonfirmasi');await saveDialog(page);
      assert.match(await page.locator('tbody').innerText(),/Dikonfirmasi/);
      await page.getByRole('button',{name:'Ubah status PSN-001',exact:true}).click();await page.getByRole('dialog').locator('[name=status]').selectOption('dibatalkan');await saveDialog(page);
      assert.equal(await page.evaluate(()=>Demo.get('products','PRD-001').stok),25);
      ok('Farmer order creation, status update, and stock restoration');

      await go(page,'pages/profile.html');await page.locator('[name=password]').fill('password123');await page.locator('[name=confirm]').fill('different123');await page.getByRole('button',{name:'Simpan Perubahan',exact:true}).click();
      await page.locator('[role=alert]:visible').waitFor();assert.match(await page.locator('[role=alert]').innerText(),/tidak cocok/);
      await page.locator('[name=password]').fill('');await page.locator('[name=confirm]').fill('');await page.locator('[name=nama]').fill('Budi Uji');await page.getByRole('button',{name:'Simpan Perubahan',exact:true}).click();
      await page.reload();assert.equal(await page.locator('[name=nama]').inputValue(),'Budi Uji');
      await page.getByRole('button',{name:'Rekening',exact:true}).click();await page.getByRole('dialog').locator('[name=nama_bank]').fill('BNI');await page.getByRole('dialog').locator('[name=no_rekening]').fill('555555');await saveDialog(page);
      assert.equal(await page.evaluate(()=>Demo.user().nama_bank),'BNI');
      await go(page,'dashboard/petani.html');await page.getByRole('button',{name:'Upload File',exact:true}).click();
      await page.getByRole('dialog').locator('input[type=file]').setInputFiles({name:'catatan.txt',mimeType:'text/plain',buffer:Buffer.from('Catatan pengujian')});
      assert.match(await page.locator('#upload-preview').innerText(),/catatan.txt/);await page.getByRole('button',{name:'Tutup dialog'}).click();
      ok('Profile validation, persisted edits, bank editing, and local file preview');
      await page.evaluate(()=>Demo.reset());await page.waitForURL('**/login.html');
      assert.equal(await page.evaluate(()=>Demo.list('orders').length),0);assert.equal(await page.evaluate(()=>Demo.user()),null);
      ok('Reset restores reference data and ends session');await context.close();
    }
    {
      const {context,page}=await fresh();await login(page,'pembeli');
      await go(page,'pages/product-detail.html?id=PRD-001');await page.locator('[name=quantity]').fill('2');await page.getByRole('button',{name:'Tambah ke Keranjang',exact:true}).click();
      await go(page,'pages/cart.html');await page.getByRole('button',{name:'Tambah Jamur Tiram',exact:true}).click();assert.equal(await page.locator('[data-product-id]').inputValue(),'3');
      await page.locator('[data-product-id]').fill('999');await page.locator('[name=alamat]').focus();assert.equal(await page.locator('[data-product-id]').inputValue(),'3');
      await page.getByRole('button',{name:'Kurangi Jamur Tiram',exact:true}).click();
      await page.locator('[name=alamat]').fill('Desa Dlingo RT 01');await page.locator('[name=catatan]').fill('Pesanan uji');await page.getByRole('button',{name:'Buat Pesanan',exact:true}).click();
      await page.waitForURL('**/my-orders.html?order=*');await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/BRI.*1234567890/);
      await page.getByRole('button',{name:'Tutup dialog'}).click();
      assert.equal(await page.evaluate(()=>Demo.cart().length),0);assert.equal(await page.evaluate(()=>Demo.get('products','PRD-001').stok),23);
      await page.getByRole('button',{name:'Batalkan',exact:true}).click();await saveDialog(page,'Batalkan Pesanan');
      assert.match(await page.locator('#order-list').innerText(),/Dibatalkan/);assert.equal(await page.evaluate(()=>Demo.get('products','PRD-001').stok),25);
      await go(page,'pages/users-manage.html');await page.waitForURL('**/dashboard/pembeli.html');
      ok('Buyer cart limits, checkout, payment details, cancellation, and role redirect');await context.close();
    }
    {
      const {context,page}=await fresh();await login(page,'superadmin');await go(page,'pages/users-manage.html');
      await page.getByRole('button',{name:'Tambah Pengguna',exact:true}).first().click();const dialog=page.getByRole('dialog');
      await dialog.locator('[name=nama]').fill('Akun Uji');await dialog.locator('[name=username]').fill('akun-uji');await dialog.locator('[name=email]').fill('uji@example.test');await dialog.locator('[name=password]').fill('password123');await saveDialog(page);
      assert.equal(await page.locator('tbody tr').count(),4);await page.getByRole('button',{name:'Hapus Akun Uji',exact:true}).click();await saveDialog(page,'Hapus');
      await page.getByRole('button',{name:'Hapus Administrator',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Hapus',exact:true}).click();
      await page.getByRole('dialog').locator('[role=alert]:visible').waitFor();assert.match(await page.getByRole('dialog').locator('[role=alert]').innerText(),/sendiri/);
      await page.getByRole('button',{name:'Tutup dialog'}).click();ok('Administrator user management and self-deletion guard');await context.close();
    }
    {
      const {context,page}=await fresh();await go(page,'register.html');
      await page.locator('[name=nama]').fill('Pembeli Baru');await page.locator('[name=username]').fill('baru');await page.locator('[name=email]').fill('baru@example.test');await page.locator('[name=password]').fill('password123');await page.locator('[name=confirm]').fill('password123');
      await page.getByRole('button',{name:'Daftar',exact:true}).click();await page.waitForURL('**/dashboard/pembeli.html');
      assert.equal(await page.evaluate(()=>Demo.user().username),'baru');
      await go(page,'pages/profile.html');await page.getByRole('button',{name:'Keluar',exact:true}).click();await page.waitForURL('**/login.html');
      await login(page,'baru','password123');ok('Registration, automatic demo session, logout, and subsequent login');await context.close();
    }
    assert.deepEqual(errors,[],'Browser or resource errors');assert.deepEqual(apiRequests,[],'Prototype must work without backend requests');
    ok('No browser errors, missing assets, or backend requests');
    console.log(`\n${checks} checks passed. Screenshots: ${artifacts}`);
  } finally {
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
