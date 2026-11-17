(() => {
  const form=document.getElementById('live-filters');
  if(!form)return;
  const status=document.getElementById('live-status'),grid=document.getElementById('live-results'),next=document.getElementById('next-results'),prev=document.getElementById('previous-results'),pageLabel=document.getElementById('result-page');
  let page=1,controller;
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  function card(x){
    const article=el('article',undefined,'listing-card'),copy=el('div',undefined,'property-copy');
    if(x.image){const image=el('img');image.src=x.image;image.alt=x.address?'Industrial property at '+x.address:'Industrial property listing';image.loading='lazy';image.referrerPolicy='no-referrer';image.className='listing-photo';image.addEventListener('error',()=>image.remove(),{once:true});article.append(image);}
    copy.append(el('div',`INDUSTRIAL · ${x.transaction}`,'demo-label'),el('h3',x.address||'Address available on inquiry'),el('p',x.city));
    const meta=el('div',undefined,'property-meta');
    meta.append(el('span',x.area!==null?`${Number(x.area).toLocaleString('en-CA')} ${x.areaUnits||''}`:'Area not supplied'));
    const price=x.price===null?'Contact for asking price':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(x.price);
    meta.append(el('span',price+(x.priceUnit?' · '+x.priceUnit:'')));copy.append(meta);
    copy.append(el('p','Listed by: '+x.brokerage,'listing-brokerage'),el('p','MLS® '+x.key));
    const link=el('a','View property details →','listing-inquiry');
    link.href='property.html?'+new URLSearchParams({listing:x.key,back:parameters().toString()});
    copy.append(link);article.append(copy);article.classList.add('clickable-listing');
    article.addEventListener('click',e=>{if(!e.target.closest('a')&&!window.getSelection()?.toString())link.click();});return article;
  }
  function parameters(){const q=new URLSearchParams(new FormData(form));for(const [k,v] of [...q])if(!v)q.delete(k);return q;}
  async function search(){
    controller?.abort();controller=new AbortController();const activeController=controller;grid.replaceChildren();grid.setAttribute('aria-busy','true');next.disabled=true;prev.disabled=true;
    const q=parameters();history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));
    const brief=new URLSearchParams(q);brief.set('type','Industrial');document.getElementById('search-brief').href='contact.html?'+brief;
    q.set('page',String(page));status.textContent='Searching active industrial listings…';pageLabel.textContent='';
    try {
      const r=await fetch('/api/proptx?'+q,{cache:'no-store',signal:activeController.signal});const data=await r.json();
      if(!r.ok||data.status!=='connected')throw Error(data.error||'Live property search is being configured. Please contact RGJ Commercial for available properties.');
      if(controller!==activeController)return;
      grid.replaceChildren(...data.listings.map(card));
      status.textContent=data.listings.length?`${data.listings.length} listings shown. Availability and asking terms must be confirmed.`:'No active listings match these criteria. Try another city or size range.';
      pageLabel.textContent='Page '+page;prev.disabled=page===1;next.disabled=!data.hasMore;
      document.getElementById('feed-checked').textContent='Last checked: '+new Date(data.checkedAt).toLocaleString('en-CA',{timeZone:'America/Toronto'})+' ET';
    } catch(e){if(e.name!=='AbortError' && controller===activeController){status.textContent=e.message;grid.replaceChildren();pageLabel.textContent='';}}
    finally{if(controller===activeController)grid.setAttribute('aria-busy','false');}
  }
  form.addEventListener('submit',e=>{e.preventDefault();validateRange();if(!form.reportValidity())return;page=1;search();});
  function validateRange(){const a=form.elements.min,b=form.elements.max;a.setCustomValidity(Number(a.value)>100000000?'Enter a size up to 100,000,000 SF.':'');b.setCustomValidity(a.value&&b.value&&Number(a.value)>Number(b.value)?'Maximum size must be at least the minimum size.':Number(b.value)>100000000?'Enter a size up to 100,000,000 SF.':'');for(const name of ['height','truck','drive']){const f=form.elements.namedItem(name);f.setCustomValidity(f.value&&Number(f.value)>(name==='height'?1000:1000)?'Enter a value up to 1,000.':'');}}
  for(const name of ['min','max','height','truck','drive'])form.elements.namedItem(name).addEventListener('input',validateRange);
  const toggle=document.getElementById('extra-filter-toggle'),extra=document.getElementById('extra-filters');
  function updateToggle(){const count=['height','truck','drive'].filter(n=>form.elements.namedItem(n).value!=='').length;toggle.textContent='Additional filters'+(count?' ('+count+')':'')+(extra.hidden?' +':' −');toggle.setAttribute('aria-expanded',String(!extra.hidden));}
  toggle.addEventListener('click',()=>{extra.hidden=!extra.hidden;updateToggle();});extra.addEventListener('input',updateToggle);
  form.addEventListener('reset',()=>{page=1;for(const name of ['min','max','height','truck','drive'])form.elements.namedItem(name).setCustomValidity('');setTimeout(()=>{extra.hidden=true;updateToggle();search();},0);});
  next.addEventListener('click',()=>{page++;search();});prev.addEventListener('click',()=>{page=Math.max(1,page-1);search();});
  const initial=new URLSearchParams(location.search);for(const name of ['city','deal']){const field=form.elements.namedItem(name);if(initial.has(name)&&[...field.options].some(o=>o.value===initial.get(name)))field.value=initial.get(name);}
  for(const name of ['min','max','height','truck','drive'])if(/^\d+(\.\d{1,2})?$/.test(initial.get(name)||''))form.elements.namedItem(name).value=initial.get(name);
  if(initial.has('size')&&!initial.has('min')&&!initial.has('max')){const match=/^(\d+)-(\d*)$/.exec(initial.get('size'));if(match){form.elements.min.value=match[1];form.elements.max.value=match[2];}}
  if(['height','truck','drive'].some(n=>form.elements.namedItem(n).value!==''))extra.hidden=false;updateToggle();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')search();});
  setInterval(()=>{if(document.visibilityState==='visible')search();},15*60*1000);
  search();
})();
