'use strict';
if (window.AppReady) {

  document.getElementById('login-logo').innerHTML=UI.icon('leaf');
  document.getElementById('username-icon').outerHTML=UI.icon('user');
  document.getElementById('password-icon').outerHTML=UI.icon('lock');
  document.getElementById('submit-icon').outerHTML=UI.icon('login');
  document.getElementById('login-watermark').innerHTML=UI.icon('leaf');
  UI.submit(document.getElementById('login-form'),async values=>{
    const user=await Demo.login(values.username,values.password,values.remember==='on');
    const next=new URLSearchParams(location.search).get('next');
    let destination=UI.url(UI.dashboard(user.role));
    if(next){try{const parsed=new URL(next,location.href);if(parsed.origin===location.origin&&parsed.pathname.startsWith(new URL(UI.url('')).pathname))destination=parsed.href;}catch(_) {}}
    location.href=destination;
  });

}
