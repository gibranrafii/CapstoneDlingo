'use strict';
if (window.AppReady) {

  const main=document.getElementById('app-main');
  const age=months=>months<12?`${months} bln`:`${Math.floor(months/12)} th${months%12?' '+months%12+' bln':''}`;
  function render(){
    const animals=Demo.list('livestock');
    main.innerHTML=UI.banner('Ternak','Kelola data ternak Anda.','leaf',UI.action('Tambah Ternak','add',null,'white'))+
      UI.stats([['🐄',animals.length,'Total Ternak'],['🐂',animals.filter(l=>l.kategori==='Sapi').length,'Sapi'],['🐐',animals.filter(l=>l.kategori==='Kambing').length,'Kambing']])+
      `<section class="section">${UI.heading('Daftar Ternak',UI.action('Tambah Ternak','add'))}`+
      UI.table(['ID','Nama','No. Ternak','Kategori','Usia','Berat','Harga','Pengurus','Aksi'],animals.map(l=>UI.row([
        UI.id(l.id),UI.strong(l.nama),UI.escape(l.nomor||l.id),UI.badge(l.kategori,l.kategori==='Kambing'?'green':''),UI.escape(age(l.usia)),UI.escape(l.berat),UI.strong(UI.money(l.harga)),UI.escape((l.staffIds||[]).map(id=>Demo.get('staff',id)?.nama).filter(Boolean).join(', ')||'—'),UI.editButtons(l.id,l.nama)
      ])))+'</section>';
  }
  Management.bind('livestock','Ternak',l=>[
    ['nama','Nama Ternak',l.nama||'',{required:true}],
    ['nomor','No. Ternak',l.nomor||''],
    ['kategori','Kategori',l.kategori||'Sapi',{type:'select',options:['Sapi','Kambing']}],
    ['usia','Usia (bulan)',l.usia??0,{type:'number',required:true,min:0,step:1}],
    ['berat','Berat (kg)',l.berat??0,{type:'number',required:true,min:0,step:'0.1'}],
    ['harga','Harga (Rp)',l.harga??0,{type:'number',required:true,min:0,step:1}]
  ],render,(values,el)=>({...values,usia:Number(values.usia),berat:Number(values.berat),harga:Number(values.harga),staffIds:[...el.querySelectorAll('[name=staffId]:checked')].map(i=>i.value)}),(el,record)=>{
    const group=document.createElement('fieldset');group.className='info-item';
    group.innerHTML='<legend>Pengurus Ternak</legend>'+Demo.list('staff').map(s=>`<label class="inline-checkbox"><input name="staffId" type="checkbox" value="${s.id}" ${(record?.staffIds||[]).includes(s.id)?'checked':''}>${UI.escape(s.nama)}</label>`).join('');
    el.querySelector('.dialog-footer').before(group);
  });

}
