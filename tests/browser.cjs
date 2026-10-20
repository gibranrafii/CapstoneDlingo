/* Real Laravel HTTP requests, CSRF, database sessions and isolated MariaDB fixtures. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {execFileSync, spawn} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.BROWSER_PORT || 8123);
const base = `http://127.0.0.1:${port}`;
const artifacts = path.join(root, 'test-results');
const pages = [
  ['/login','guest'],['/register','guest'],['/','guest'],['/products/1','guest'],
  ['/dashboard/petani','petani'],['/manage/products','petani'],['/manage/buyers','petani'],
  ['/manage/stock','petani'],['/manage/orders','petani'],['/profile','petani'],
  ['/manage/livestock','petani'],['/manage/caretakers','petani'],
  ['/cart','pembeli'],['/orders','pembeli'],['/dashboard/pembeli','pembeli'],
  ['/dashboard/admin','admin'],['/admin/users','admin']
];
(async () => {
  let server, browser;
  const errors = [], contexts = {};
  let checks = 0;
  const ok = message => console.log(`PASS ${++checks}: ${message}`);
  const go = (page, route) => page.goto(base + route);
  const token = page => page.locator('meta[name=csrf-token]').getAttribute('content');
  async function fresh() {
    const context = await browser.newContext({viewport:{width:1584,height:900}});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
    return {context,page};
  }
  async function submit(page, button) {
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),button.click()]);
  }
  async function login(page, username, password='demo12345') {
    await go(page,'/login');
    await page.locator('[name=username]').fill(username);
    await page.locator('[name=password]').fill(password);
    await submit(page,page.getByRole('button',{name:'Masuk',exact:true}));
    await page.waitForURL('**/dashboard/**');
  }
  const dialog = page => page.locator('dialog[open]');
  const save = (page, label='Simpan') => submit(page,dialog(page).getByRole('button',{name:label,exact:true}));
  try {
    let config = await fs.readFile(path.join(root,'.env.testing'),'utf8');
    assert.match(config,/^DB_DATABASE=dlingo_jamur_test\s*$/m,'Configure .env.testing for the isolated test database');
    const values = {APP_ENV:'browser',APP_DEBUG:'false',APP_URL:base,DB_DATABASE:'dlingo_jamur_test',DB_URL:'',SESSION_DRIVER:'database',CACHE_STORE:'file'};
    for(const [key,value] of Object.entries(values)) {
      config = config.replace(new RegExp(`^${key}=.*$`,'mg'),'');
      config += `\n${key}=${value}\n`;
    }
    await fs.writeFile(path.join(root,'.env.browser'),config,{mode:0o600});
    execFileSync('php',['tests/prepare-database.php'],{cwd:root,stdio:'pipe'});
    await fs.mkdir(artifacts,{recursive:true});
    const log = await fs.open(path.join(artifacts,'http-server.log'),'w');
    server = spawn('php',['artisan','serve','--host=127.0.0.1',`--port=${port}`,'--no-reload','--env=browser'],{
      cwd:root,detached:true,stdio:['ignore',log.fd,log.fd],
      env:{...process.env,APP_ENV:'browser',DB_DATABASE:'dlingo_jamur_test',DB_URL:'',SESSION_DRIVER:'database',CACHE_STORE:'file',APP_DEBUG:'false'}
    });
    await log.close();
    for(let attempt=0;;attempt++) {
      if(server.exitCode!==null)throw Error('Laravel test server exited; inspect test-results/http-server.log');
      try {if((await fetch(base+'/up')).ok)break;}catch{}
      if(attempt>60)throw Error('Laravel test server did not start');
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
    for(const [role,username] of Object.entries({guest:null,petani:'admin',pembeli:'pembeli',admin:'superadmin'})) {
      contexts[role] = await fresh();
      if(username)await login(contexts[role].page,username);
    }
    for(const [route,role] of pages) {
      const page=contexts[role].page;
      await go(page,route);
      assert.equal(new URL(page.url()).pathname,route,`${role}: ${route} resolves`);
      assert.equal(await page.locator('h1').count(),1);
      const slug=route.replace(/[^a-z0-9]/gi,'-')||'store';
      await page.screenshot({path:path.join(artifacts,slug+'-desktop.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route}: mobile body overflow`);
      await page.screenshot({path:path.join(artifacts,slug+'-mobile.png'),fullPage:true});
      await page.setViewportSize({width:1584,height:900});
    }
    ok('All 17 pages render on desktop and mobile without overflow');
    const {page:staff,context:staffContext}=contexts.petani;
    const {page:buyer}=contexts.pembeli;
    const {page:admin}=contexts.admin;
    const csrfFailure=await staffContext.request.post(base+'/manage/products',{form:{nama_produk:'CSRF blocked'},maxRedirects:0});
    assert.equal(csrfFailure.status(),419);
    ok('Real HTTP middleware rejects missing CSRF tokens');

    await go(staff,'/manage/products');await staff.locator('[data-open=product-new]').first().click();
    await dialog(staff).locator('[name=nama_produk]').fill('Browser Mushroom');
    await dialog(staff).locator('[name=harga]').fill('40000');await dialog(staff).locator('[name=stok]').fill('7');
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64');
    await dialog(staff).locator('[name=gambar]').setInputFiles({name:'mushroom.png',mimeType:'image/png',buffer:png});
    await dialog(staff).locator('img.file-preview').waitFor();await save(staff);
    let row=staff.locator('tbody tr').filter({hasText:'Browser Mushroom'});await row.waitFor();
    await row.getByRole('button',{name:'Edit Browser Mushroom',exact:true}).click();await dialog(staff).locator('[name=stok]').fill('12');await save(staff);
    await staff.reload();assert.match(await staff.locator('tbody tr').filter({hasText:'Browser Mushroom'}).innerText(),/12/);
    await go(staff,'/?q=Browser');await staff.getByRole('link',{name:'Detail',exact:true}).click();
    const image=staff.locator('.detail-layout img');await image.waitFor();assert.equal(await image.evaluate(img=>img.complete&&img.naturalWidth>0),true);
    await go(staff,'/manage/products');await staff.getByRole('button',{name:'Hapus Browser Mushroom',exact:true}).click();await save(staff,'Hapus');
    assert.equal(await staff.locator('tbody tr').count(),3);
    ok('Product create/edit/delete, uploaded image serving, and reload persistence');

    await go(staff,'/manage/buyers');await staff.locator('[data-open=buyer-new]').first().click();await dialog(staff).locator('[name=nama_pembeli]').fill('Browser Customer');await save(staff);
    await staff.getByRole('button',{name:'Hapus Browser Customer',exact:true}).click();await save(staff,'Hapus');
    await go(staff,'/manage/caretakers');await staff.locator('[data-open=caretaker-new]').first().click();await dialog(staff).locator('[name=nama_pengurus]').fill('Browser Caretaker');await save(staff);
    await go(staff,'/manage/livestock');await staff.getByRole('button',{name:'Edit Sapi Brahman',exact:true}).click();await dialog(staff).getByLabel('Browser Caretaker',{exact:true}).check();await save(staff);await staff.reload();
    assert.match(await staff.locator('tbody tr').filter({hasText:'Sapi Brahman'}).innerText(),/Browser Caretaker/);
    await go(staff,'/manage/caretakers');await staff.getByRole('button',{name:'Hapus Browser Caretaker',exact:true}).click();await save(staff,'Hapus');
    await go(staff,'/manage/livestock');assert.doesNotMatch(await staff.locator('tbody tr').filter({hasText:'Sapi Brahman'}).innerText(),/Browser Caretaker/);
    ok('Buyer contacts and livestock caretaker assignment/archive');

    await go(buyer,'/products/1');await buyer.locator('[name=quantity]').fill('2');await submit(buyer,buyer.getByRole('button',{name:'Tambah ke Keranjang',exact:true}));
    await go(buyer,'/cart');assert.match(await buyer.locator('.summary-line.total').innerText(),/30.000/);
    await Promise.all([buyer.waitForNavigation(),buyer.getByRole('button',{name:'Tambah Jamur Tiram',exact:true}).click()]);
    assert.match(await buyer.locator('.summary-line.total').innerText(),/45.000/);
    await buyer.locator('[name=alamat_kirim]').fill('Browser delivery address');
    await submit(buyer,buyer.getByRole('button',{name:'Buat Pesanan',exact:true}));
    await buyer.waitForURL('**/orders?order=*');await buyer.locator('#order-detail[open]').waitFor();
    assert.match(await dialog(buyer).innerText(),/45.000/);assert.match(await dialog(buyer).innerText(),/Browser delivery address/);
    const ownOrder=new URL(buyer.url()).searchParams.get('order');await dialog(buyer).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    await buyer.getByRole('button',{name:'Batalkan',exact:true}).click();await save(buyer,'Batalkan Pesanan');
    assert.match(await buyer.locator('.order-card').innerText(),/Dibatalkan/);
    await go(buyer,'/cart');assert.match(await buyer.locator('main h2').textContent(),/Kosong/);
    ok('Cart quantity changes, checkout, private detail, payment info and cancellation');

    await go(staff,'/manage/orders');await staff.locator('[data-open=order-new]').first().click();await dialog(staff).locator('[name="items[1]"]').fill('1');await save(staff,'Buat Pesanan');
    const orderRow=staff.locator('tbody tr').first();const orderHref=await orderRow.locator('[data-order]').getAttribute('href');const orderId=orderHref.split('/').pop();
    for(const status of ['dikonfirmasi','diproses','dikirim','selesai']) {
      await staff.locator(`[data-open="status-${orderId}"]`).click();await dialog(staff).locator('[name=status]').selectOption(status);await save(staff);
    }
    await go(buyer,'/orders');assert.match(await buyer.locator('.order-card').first().innerText(),/Selesai/);
    await go(staff,'/dashboard/petani');assert.match(await staff.locator('.stat').filter({hasText:'Pemasukan'}).innerText(),/15.000/);
    await staff.getByRole('button',{name:'Rekening',exact:true}).click();assert.equal(await dialog(staff).locator('input').count(),0);await dialog(staff).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    await staff.getByRole('button',{name:'Upload File',exact:true}).click();await dialog(staff).locator('input[type=file]').setInputFiles({name:'preview.png',mimeType:'image/png',buffer:png});await dialog(staff).locator('.file-preview').waitFor();await dialog(staff).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    ok('Staff orders progress through all statuses and completed revenue updates');

    await go(admin,'/admin/users');await admin.locator('[data-open=user-new]').first().click();
    for(const [name,value] of Object.entries({nama:'Browser Staff',username:'browserstaff',email:'browserstaff@example.test',password:'password123'}))await dialog(admin).locator(`[name=${name}]`).fill(value);
    await save(admin);
    const extra=await fresh();await login(extra.page,'browserstaff','password123');
    assert.equal((await extra.context.request.get(base+'/admin/users')).status(),403);
    await admin.getByRole('button',{name:'Hapus Browser Staff (nonaktifkan akun)',exact:true}).click();await save(admin,'Hapus');
    await go(extra.page,'/profile');assert.equal(new URL(extra.page.url()).pathname,'/login');await extra.context.close();
    await go(admin,'/profile');await admin.getByRole('button',{name:'Rekening',exact:true}).click();await dialog(admin).locator('[name=no_rekening]').fill('9876543210');await save(admin);
    await go(buyer,'/products/1');assert.match(await buyer.locator('main').innerText(),/9876543210/);
    ok('Admin-only accounts, deactivation invalidates sessions, and bank settings are shared');

    const stranger=await fresh();await go(stranger.page,'/register');
    for(const [name,value] of Object.entries({nama:'Browser Buyer',username:'browserbuyer',email:'browserbuyer@example.test',password:'password123',password_confirmation:'password123'}))await stranger.page.locator(`[name=${name}]`).fill(value);
    await submit(stranger.page,stranger.page.getByRole('button',{name:'Daftar',exact:true}));await stranger.page.waitForURL('**/dashboard/pembeli');
    assert.equal((await stranger.context.request.get(base+'/orders/'+ownOrder)).status(),403);
    assert.equal((await stranger.context.request.get(base+'/manage/products')).status(),403);
    await go(stranger.page,'/orders');assert.equal(await stranger.page.locator('.order-card').count(),0);
    await go(stranger.page,'/profile');await stranger.page.locator('[name=nama]').fill('Browser Buyer Updated');await submit(stranger.page,stranger.page.getByRole('button',{name:'Simpan Perubahan',exact:true}));
    assert.equal(await stranger.page.locator('[name=nama]').inputValue(),'Browser Buyer Updated');
    await submit(stranger.page,stranger.page.getByRole('button',{name:'Keluar',exact:true}));await stranger.page.waitForURL('**/login');await stranger.context.close();
    ok('Buyer registration, cross-account privacy, profile persistence and logout');
    assert.deepEqual(errors,[],'Unexpected browser errors');
    ok('No JavaScript errors or failed page resources');
  } finally {
    if(browser)await browser.close();
    if(server?.pid){try{process.kill(-server.pid,'SIGTERM');}catch{}}
    await fs.unlink(path.join(root,'.env.browser')).catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
