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
  ['/login','guest'],['/admin/login','guest'],['/forgot-password','guest'],['/register','guest'],['/','guest'],['/products/1','guest'],
  ['/admin','petani'],['/admin/products','petani'],['/admin/buyers','petani'],
  ['/admin/stock','petani'],['/admin/orders','petani'],['/admin/profile','petani'],
  ['/admin/livestock','petani'],['/admin/caretakers','petani'],
  ['/cart','pembeli'],['/orders','pembeli'],['/dashboard/pembeli','pembeli'],
  ['/admin','admin'],['/admin/users','admin']
];
(async () => {
  let server, browser, currentPage;
  const errors = [], contexts = {};
  let checks = 0;
  const ok = message => console.log(`PASS ${++checks}: ${message}`);
  const go = (page, route) => { currentPage = page; return page.goto(base + route); };
  const token = page => page.locator('meta[name=csrf-token]').getAttribute('content');
  async function fresh() {
    const context = await browser.newContext({viewport:{width:1584,height:900}});
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if(message.type()==='error' && /content.security.policy|refused to (execute|apply|load|connect)/i.test(message.text()))errors.push(message.text());});
    page.on('response', response => {if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});
    return {context,page};
  }
  async function submit(page, button) {
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),button.click()]);
  }
  async function login(page, username, password='demo12345') {
    await go(page,['admin','superadmin','browserstaff'].includes(username)?'/admin/login':'/login');
    await page.locator('[name=username]').fill(username);
    await page.locator('[name=password]').fill(password);
    await submit(page,page.getByRole('button',{name:'Masuk',exact:true}));
    await page.waitForURL(url=>['/admin','/dashboard/pembeli'].includes(url.pathname));
  }
  const dialog = page => page.locator('dialog[open]');
  const save = async (page, label='Simpan') => { const current=dialog(page).locator('[name=current_password]');if(await current.count())await current.fill('demo12345');return submit(page,dialog(page).getByRole('button',{name:label,exact:true})); };
  try {
    let config = await fs.readFile(path.join(root,'.env.testing'),'utf8');
    assert.match(config,/^DB_DATABASE=dlingo_jamur_test\s*$/m,'Configure .env.testing for the isolated test database');
    const values = {APP_ENV:'browser',APP_DEBUG:'false',APP_URL:base,DB_DATABASE:'dlingo_jamur_test',DB_URL:'',SESSION_DRIVER:'database',CACHE_STORE:'database'};
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
      env:{...process.env,APP_ENV:'browser',DB_DATABASE:'dlingo_jamur_test',DB_URL:'',SESSION_DRIVER:'database',CACHE_STORE:'database',APP_DEBUG:'false'}
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
      if(process.env.BROWSER_SCREENSHOTS==='1')await page.screenshot({path:path.join(artifacts,slug+'-desktop.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route}: mobile body overflow`);
      if(process.env.BROWSER_SCREENSHOTS==='1')await page.screenshot({path:path.join(artifacts,slug+'-mobile.png'),fullPage:true});
      await page.setViewportSize({width:1584,height:900});
    }
    ok('All application and account pages render on desktop and mobile without overflow');
    // Check the responsive shells themselves, not only absence of body overflow.
    for(const role of ['petani','admin','pembeli','guest']) {
      const page=contexts[role].page;
      const route={petani:'/admin/stock',admin:'/admin/users',pembeli:'/dashboard/pembeli',guest:'/'}[role];
      for(const width of [320,768,1024]) {
        await page.setViewportSize({width,height:844});await go(page,route);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${role}: overflow at ${width}px`);
        const mobile=width<1024;
        assert.equal(await page.locator('.bottom-nav').isVisible(),mobile);
        if(role==='petani'||role==='admin') {
          assert.equal(await page.locator('.sidebar').isVisible(),!mobile);
          if(mobile) {
            const more=page.locator('.bottom-nav [data-open=staff-more]');
            await more.click();
            assert.equal(await page.locator('#staff-more').evaluate(d=>d.open),true);
            assert.equal(await page.locator('#staff-more').getByRole('link',{name:'Kelola Pengguna',exact:true}).count(),role==='admin'?1:0);
            await page.keyboard.press('Escape');
            assert.equal(await more.evaluate(el=>el===document.activeElement),true);
            await more.click();await page.locator('#staff-more [data-open=bank]').click();
            assert.equal(await page.locator('dialog[open]').count(),1);
            assert.equal(await page.locator('#bank').evaluate(d=>d.open),true);
            for(let tab=0;tab<3;tab++) {
              await page.keyboard.press('Tab');
              assert.equal(await page.locator('#bank').evaluate(d=>d.contains(document.activeElement)),true,'Dialog traps keyboard focus');
            }
            if(role==='admin') {
              const saveBank=page.locator('#bank button[type=submit]');
              await saveBank.scrollIntoViewIfNeeded();
              const target=await saveBank.boundingBox();
              assert.ok(target.y>=0&&target.y+target.height<=844,'Long dialog submit remains reachable');
            }

            await page.keyboard.press('Escape');
            assert.equal(await more.evaluate(el=>el===document.activeElement),true);
          }
        }
        if(mobile) {
          const targets=await page.locator('.bottom-nav .nav-link').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
          assert.ok(targets.every(r=>r.w>=44&&r.h>=44),'Bottom navigation touch targets');
        }
      }
      await page.setViewportSize({width:1584,height:900});
    }
    const guest=contexts.guest.page;
    await go(guest,'/?q=NoMatchingProduct987');assert.match(await guest.locator('main').innerText(),/Produk tidak ditemukan/);
    await go(contexts.pembeli.page,'/orders');assert.match(await contexts.pembeli.page.locator('main').innerText(),/Belum Ada Pesanan/);
    await go(contexts.pembeli.page,'/cart');assert.match(await contexts.pembeli.page.locator('main').innerText(),/Keranjang Anda Kosong/);
    ok('Responsive navigation, role menus, Escape/focus restoration, and empty states');

    const {page:staff,context:staffContext}=contexts.petani;
    const {page:buyer}=contexts.pembeli;
    const {page:admin}=contexts.admin;
    const csrfFailure=await staffContext.request.post(base+'/admin/products',{form:{nama_produk:'CSRF blocked'},maxRedirects:0});
    assert.equal(csrfFailure.status(),419);
    ok('Real HTTP middleware rejects missing CSRF tokens');

    await go(staff,'/admin/products');await staff.locator('[data-open=product-new]').first().click();
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
    const photoUrl=await image.getAttribute('src');
    await staff.route(photoUrl,route=>route.fulfill({status:200,contentType:'image/png',body:'invalid-image'}));
    await staff.reload();
    await staff.locator('.detail-layout .photo-placeholder:not([hidden])').waitFor();
    assert.equal(await staff.locator('.detail-layout img').isVisible(),false);
    await staff.unroute(photoUrl);
    await go(staff,'/admin/products');await staff.getByRole('button',{name:'Hapus Browser Mushroom',exact:true}).click();await save(staff,'Hapus');
    assert.equal(await staff.locator('tbody tr').count(),3);
    ok('Product create/edit/delete, uploaded image serving, and reload persistence');
    const longName='Browser product '+('NamaProdukPanjang'.repeat(10));
    await staff.locator('[data-open=product-new]').click();
    await dialog(staff).locator('[name=nama_produk]').fill(longName);
    await dialog(staff).locator('[name=harga]').fill('1000');
    await dialog(staff).locator('[name=stok]').fill('1');await save(staff);
    await go(contexts.pembeli.page,'/?q=Browser');
    await contexts.pembeli.page.setViewportSize({width:320,height:844});
    assert.ok(await contexts.pembeli.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Long product names fit mobile cards');
    await contexts.pembeli.page.getByRole('button',{name:'Tambah ke keranjang',exact:true}).click();
    await go(staff,'/admin/products');await staff.getByRole('button',{name:'Edit '+longName,exact:true}).click();
    await dialog(staff).locator('[name=stok]').fill('0');await save(staff);
    const stockBuyer=contexts.pembeli.page;
    await go(stockBuyer,'/cart');assert.match(await stockBuyer.locator('main').innerText(),/Stok tersedia: 0/);
    await stockBuyer.locator('[name=alamat_kirim]').fill('Dlingo');
    await submit(stockBuyer,stockBuyer.getByRole('button',{name:'Buat Pesanan',exact:true}));
    assert.equal(new URL(stockBuyer.url()).pathname,'/cart');
    assert.match(await stockBuyer.locator('.cart-item').innerText(),new RegExp('Browser product'));
    await submit(stockBuyer,stockBuyer.getByRole('button',{name:'Hapus '+longName,exact:true}));
    await go(stockBuyer,'/?q=Browser');assert.equal(await stockBuyer.getByRole('button',{name:'Stok habis',exact:true}).isDisabled(),true);
    await stockBuyer.getByRole('link',{name:'Detail',exact:true}).click();
    assert.equal(await stockBuyer.getByRole('button',{name:'Stok Habis',exact:true}).isDisabled(),true);
    await go(staff,'/admin/products');await staff.getByRole('button',{name:'Hapus '+longName,exact:true}).click();await save(staff,'Hapus');
    await stockBuyer.setViewportSize({width:1584,height:900});
    ok('Missing photo fallback, long names, sold-out products, and stale-stock checkout');


    await go(staff,'/admin/buyers');await staff.locator('[data-open=buyer-new]').first().click();await dialog(staff).locator('[name=nama_pembeli]').fill('Browser Customer');await save(staff);
    await staff.getByRole('button',{name:'Hapus Browser Customer',exact:true}).click();await save(staff,'Hapus');
    await go(staff,'/admin/caretakers');await staff.locator('[data-open=caretaker-new]').first().click();await dialog(staff).locator('[name=nama_pengurus]').fill('Browser Caretaker');await save(staff);
    await go(staff,'/admin/livestock');await staff.getByRole('button',{name:'Edit Sapi Brahman',exact:true}).click();await dialog(staff).getByLabel('Browser Caretaker',{exact:true}).check();await save(staff);await staff.reload();
    assert.match(await staff.locator('tbody tr').filter({hasText:'Sapi Brahman'}).innerText(),/Browser Caretaker/);
    await go(staff,'/admin/caretakers');await staff.getByRole('button',{name:'Hapus Browser Caretaker',exact:true}).click();await save(staff,'Hapus');
    await go(staff,'/admin/livestock');assert.doesNotMatch(await staff.locator('tbody tr').filter({hasText:'Sapi Brahman'}).innerText(),/Browser Caretaker/);
    ok('Buyer contacts and livestock caretaker assignment/archive');

    for(const width of [320,390]) {
      await buyer.setViewportSize({width,height:844});await go(buyer,'/products/1');
      const bar=buyer.locator('.purchase-bar');const nav=buyer.locator('.bottom-nav');
      for(const scroll of [0,10000]) {
        await buyer.evaluate(y=>scrollTo(0,y),scroll);
        const action=await bar.boundingBox(), bottom=await nav.boundingBox();
        assert.ok(action.y>=0&&action.y+action.height<=bottom.y+1,'Product action above mobile navigation');
        assert.ok(await buyer.getByRole('button',{name:'Tambah ke Keranjang',exact:true}).isVisible());
      }
    }
    await buyer.setViewportSize({width:1584,height:900});
    await go(buyer,'/products/1');await buyer.locator('[name=quantity]').fill('2');await submit(buyer,buyer.getByRole('button',{name:'Tambah ke Keranjang',exact:true}));
    await go(buyer,'/cart');assert.match(await buyer.locator('.summary-line.total').innerText(),/30.000/);
    await Promise.all([buyer.waitForNavigation(),buyer.getByRole('button',{name:'Tambah Jamur Tiram',exact:true}).click()]);
    assert.match(await buyer.locator('.summary-line.total').innerText(),/45.000/);
    for(const width of [320,390,768]) {
      await buyer.setViewportSize({width,height:844});
      const action=await buyer.locator('.purchase-bar').boundingBox(), nav=await buyer.locator('.bottom-nav').boundingBox();
      assert.ok(action.y>=0&&action.y+action.height<=nav.y+1,'Checkout above mobile navigation');
      assert.equal(await buyer.locator('main table').count(),0,'Mobile cart uses cards');
      await buyer.locator('[name=catatan]').focus();
      await buyer.locator('[name=catatan]').fill('Browser delivery note');
      await buyer.locator('[name=catatan]').scrollIntoViewIfNeeded();
      const field=await buyer.locator('[name=catatan]').boundingBox();
      assert.ok(field.y+field.height<=action.y,'Focused checkout field remains above fixed controls');
      await buyer.evaluate(()=>scrollTo(0,document.body.scrollHeight));
      const last=await buyer.locator('main').evaluate(el=>el.getBoundingClientRect().bottom);
      assert.ok(last<=action.y+1,'Final checkout content clears fixed controls');
    }
    await buyer.setViewportSize({width:1584,height:900});
    await buyer.locator('[name=alamat_kirim]').fill('Browser delivery address');
    await submit(buyer,buyer.getByRole('button',{name:'Buat Pesanan',exact:true}));
    await buyer.waitForURL('**/orders?order=*');await buyer.locator('#order-detail[open]').waitFor();
    assert.match(await dialog(buyer).innerText(),/45.000/);assert.match(await dialog(buyer).innerText(),/Browser delivery address/);
    const ownOrder=new URL(buyer.url()).searchParams.get('order');await dialog(buyer).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    await buyer.getByRole('button',{name:'Batalkan',exact:true}).click();await save(buyer,'Batalkan Pesanan');
    assert.match(await buyer.locator('.order-card').innerText(),/Dibatalkan/);
    await go(buyer,'/cart');assert.match(await buyer.locator('main h2').textContent(),/Kosong/);
    ok('Cart quantity changes, checkout, private detail, payment info and cancellation');

    await go(staff,'/admin/orders');await staff.locator('[data-open=order-new]').first().click();await dialog(staff).locator('[name="items[1]"]').fill('1');await save(staff,'Buat Pesanan');
    const orderRow=staff.locator('tbody tr').first();const orderHref=await orderRow.locator('[data-order]').getAttribute('href');const orderId=orderHref.split('/').pop();
    for(const status of ['dikonfirmasi','diproses','dikirim','selesai']) {
      await staff.locator(`[data-open="status-${orderId}"]`).click();await dialog(staff).locator('[name=status]').selectOption(status);await save(staff);
    }
    await go(buyer,'/orders');assert.match(await buyer.locator('.order-card').first().innerText(),/Selesai/);
    await go(staff,'/admin');assert.match(await staff.locator('.stat').filter({hasText:'Pemasukan'}).innerText(),/15.000/);
    await staff.locator('main').getByRole('button',{name:'Rekening',exact:true}).click();assert.equal(await dialog(staff).locator('input').count(),0);await dialog(staff).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    await staff.locator('main').getByRole('button',{name:'Upload File',exact:true}).click();await dialog(staff).locator('input[type=file]').setInputFiles({name:'preview.png',mimeType:'image/png',buffer:png});await dialog(staff).locator('.file-preview').waitFor();await dialog(staff).getByRole('button',{name:'Tutup dialog',exact:true}).click();
    ok('Staff orders progress through all statuses and completed revenue updates');

    await go(admin,'/admin/users');await admin.locator('[data-open=user-new]').first().click();
    for(const [name,value] of Object.entries({nama:'Browser Staff',username:'browserstaff',email:'browserstaff@example.test',password:'password12345'}))await dialog(admin).locator(`[name=${name}]`).fill(value);
    await save(admin);
    const extra=await fresh();await login(extra.page,'browserstaff','password12345');
    assert.equal((await extra.context.request.get(base+'/admin/users')).status(),403);
    await admin.getByRole('button',{name:'Hapus Browser Staff (nonaktifkan akun)',exact:true}).click();await save(admin,'Hapus');
    await go(extra.page,'/admin/profile');assert.equal(new URL(extra.page.url()).pathname,'/admin/login');await extra.context.close();
    await go(admin,'/admin/profile');await admin.locator('main').getByRole('button',{name:'Rekening',exact:true}).click();await dialog(admin).locator('[name=no_rekening]').fill('9876543210');await save(admin);
    await go(buyer,'/products/1');assert.match(await buyer.locator('main').innerText(),/9876543210/);
    ok('Admin-only accounts, deactivation invalidates sessions, and bank settings are shared');

    const stranger=await fresh();await go(stranger.page,'/register');
    for(const [name,value] of Object.entries({nama:'Browser Buyer',username:'browserbuyer',email:'browserbuyer@example.test',password:'password12345',password_confirmation:'password12345'}))await stranger.page.locator(`[name=${name}]`).fill(value);
    await submit(stranger.page,stranger.page.getByRole('button',{name:'Daftar',exact:true}));await stranger.page.waitForURL('**/dashboard/pembeli');
    await go(stranger.page,'/email/verify');
    await stranger.page.setViewportSize({width:320,height:844});
    assert.ok(await stranger.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Verification page fits small phones');
    assert.match(await stranger.page.locator('main h1').innerText(),/Verifikasi Email/);
    const verificationLink=execFileSync('php',['-r',
      "require 'tests/bootstrap-database.php'; Illuminate\\Support\\Facades\\URL::forceRootUrl($argv[1]); $u=App\\Models\\User::whereUsername('browserbuyer')->firstOrFail(); echo Illuminate\\Support\\Facades\\URL::temporarySignedRoute('verification.verify',now()->addMinutes(60),['id'=>$u->id_user,'hash'=>sha1($u->email)]);",base],{cwd:root,encoding:'utf8'});
    await stranger.page.goto(verificationLink);await stranger.page.waitForURL('**/dashboard/pembeli');
    await stranger.page.setViewportSize({width:1584,height:900});
    assert.equal((await stranger.context.request.get(base+'/orders/'+ownOrder)).status(),403);
    assert.equal((await stranger.context.request.get(base+'/admin/products')).status(),403);
    await go(stranger.page,'/orders');assert.equal(await stranger.page.locator('.order-card').count(),0);
    await go(stranger.page,'/profile');await stranger.page.locator('[name=nama]').fill('Browser Buyer Updated');await submit(stranger.page,stranger.page.getByRole('button',{name:'Simpan Perubahan',exact:true}));
    assert.equal(await stranger.page.locator('[name=nama]').inputValue(),'Browser Buyer Updated');
    await submit(stranger.page,stranger.page.getByRole('button',{name:'Keluar',exact:true}));await stranger.page.waitForURL('**/login');
    const resetToken=execFileSync('php',['-r',"require 'tests/bootstrap-database.php'; echo Illuminate\\Support\\Facades\\Password::createToken(App\\Models\\User::whereUsername('browserbuyer')->firstOrFail());"],{cwd:root,encoding:'utf8'});
    await go(stranger.page,`/reset-password/${resetToken}?email=browserbuyer@example.test`);
    await stranger.page.locator('[name=password]').fill('browser-new-password123');
    await stranger.page.locator('[name=password_confirmation]').fill('browser-new-password123');
    await submit(stranger.page,stranger.page.getByRole('button',{name:'Simpan Kata Sandi',exact:true}));
    await stranger.page.waitForURL('**/login');
    await login(stranger.page,'browserbuyer','browser-new-password123');
    await stranger.context.close();
    ok('Buyer registration, cross-account privacy, profile persistence and logout');
    assert.deepEqual(errors,[],'Unexpected browser errors');
    ok('No JavaScript errors or failed page resources');
    await fs.unlink(path.join(artifacts,'failure.png')).catch(()=>{});
  } catch(error) {
    if(currentPage && !currentPage.isClosed()) {
      await currentPage.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});
    }
    throw error;
  } finally {
    if(browser)await browser.close();
    if(server?.pid){try{process.kill(-server.pid,'SIGTERM');}catch{}}
    await fs.unlink(path.join(root,'.env.browser')).catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
