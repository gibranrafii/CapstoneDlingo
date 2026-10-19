/* Shared CRUD binding for the management pages. */
(() => {
  'use strict';
  window.Management = {
    bind(entity, label, fields, render, normalize=values=>values, extra) {
      const edit = record => {
        const list = fields(record || {});
        const el=UI.form(`${record?'Edit':'Tambah'} ${label}`,list,async(values,dialog)=>{
          const value=normalize(values,dialog);
          Demo.save(entity,{...(record||{}),...value});
          UI.toast(`${label} berhasil ${record?'diperbarui':'ditambahkan'}.`);
        });
        if(extra)extra(el,record);
      };
      UI.on('add',()=>edit(null));
      UI.on('edit',button=>edit(Demo.get(entity,button.dataset.id)));
      UI.on('delete',button=>{
        const record=Demo.get(entity,button.dataset.id);
        UI.confirm(`Hapus ${label}`,`Hapus ${record.nama}?`,()=>{Demo.remove(entity,record.id);UI.toast(`${label} berhasil dihapus.`);});
      });
      window.addEventListener('dlingo:change',render);
      render();
      if(location.hash==='#add')edit(null);
    }
  };
})();
