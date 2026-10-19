const openDialog = dialog => { if (!dialog || dialog.open) return; dialog.returnFocus=document.activeElement;dialog.showModal(); };
const urls = new Map();
document.addEventListener('click', event => {
  const open=event.target.closest('[data-open]');if(open){event.preventDefault();openDialog(document.getElementById(open.dataset.open));}
  const close=event.target.closest('[data-close]');if(close)close.closest('dialog')?.close();
  const remove=event.target.closest('[data-delete]');if(remove){const dialog=document.getElementById('delete-record');document.getElementById('delete-form').action=remove.dataset.delete;document.getElementById('delete-message').textContent=`Hapus ${remove.dataset.name}?`;openDialog(dialog);}
  const step=event.target.closest('[data-step]');if(step){const form=step.closest('form'),input=form.querySelector('[name=quantity]');const next=Number(input.value)+Number(step.dataset.step);if(next>=Number(input.min)&&next<=Number(input.max)){input.value=next;form.requestSubmit();}}
});
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{dialog.returnFocus?.isConnected&&dialog.returnFocus.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
document.querySelectorAll('[data-preview]').forEach(input=>input.addEventListener('change',()=>{
  const preview=document.getElementById(input.dataset.preview),file=input.files[0];preview.replaceChildren();if(urls.has(input))URL.revokeObjectURL(urls.get(input));if(!file)return;
  const info=document.createElement('div');info.className='upload-meta';info.textContent=`${file.name} · ${(file.size/1024).toFixed(1)} KB`;preview.append(info);
  if(file.type.startsWith('image/')){const url=URL.createObjectURL(file);urls.set(input,url);const img=document.createElement('img');img.className='file-preview';img.src=url;img.alt=file.name;preview.append(img);}
}));
document.addEventListener('submit',event=>{if(event.target.checkValidity()){event.target.querySelectorAll('button[type=submit]').forEach(button=>button.disabled=true);}});
window.addEventListener('pageshow',()=>document.querySelectorAll('button[type=submit]').forEach(button=>button.disabled=false));
if(document.body.dataset.reopen)openDialog(document.getElementById(document.body.dataset.reopen));
setTimeout(()=>document.querySelector('.toast-region')?.remove(),5000);
