(() => {
  const form=document.getElementById('live-filters');
  if(!form)return;
  const status=document.getElementById('live-status'),grid=document.getElementById('live-results'),next=document.getElementById('next-results'),prev=document.getElementById('previous-results'),pageLabel=document.getElementById('result-page');
  let page=1,controller;
  const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  function card(x){
    const article=el('article',undefined,'listing-card'),copy=el('div',undefined,'property-copy');
    if(x.image){const image=el('img');image.src=x.image;image.alt=x.address?'Property at '+x.address:'Property listing';image.loading='lazy';image.referrerPolicy='no-referrer';image.className='listing-photo';image.addEventListener('error',()=>image.remove(),{once:true});article.append(image);}
    copy.append(el('div',`${(x.type||'Industrial').toUpperCase()} · ${x.transactionLabel||x.transaction}`,'demo-label'),el('h3',x.address||'Address available on inquiry'),el('p',x.city));
    const meta=el('div',undefined,'property-meta');
    meta.append(el('span',x.area!==null?`${Number(x.area).toLocaleString('en-CA',{maximumFractionDigits:x.type==='Land'?4:2})} ${x.areaUnits||''}`:'Area not supplied'));
    const price=x.price===null?'Contact for asking price':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(x.price);
    meta.append(el('span',price+(x.priceUnit?' · '+x.priceUnit:'')));copy.append(meta);
    copy.append(el('p','Listed by: '+x.brokerage,'listing-brokerage'),el('p','MLS® '+x.key));
    const link=el('a','View property details →','listing-inquiry');
    link.href='property.html?'+new URLSearchParams({listing:x.key,back:parameters().toString()});
    copy.append(link);article.append(copy);article.classList.add('clickable-listing');
    article.addEventListener('click',e=>{if(!e.target.closest('a')&&!window.getSelection()?.toString())link.click();});return article;
  }
  const sizeNumber=v=>Number(v.replaceAll(',',''));
  function formatSize(field){const old=field.value,caret=field.selectionStart??old.length,before=old.slice(0,caret).replace(/[^0-9.]/g,'').length,parts=old.replace(/[^0-9.]/g,'').split('.');field.value=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+(parts.length>1?'.'+parts.slice(1).join('').slice(0,form.elements.type.value==='Land'?4:2):'');let pos=0,count=0;while(pos<field.value.length&&count<before){if(/[0-9.]/.test(field.value[pos]))count++;pos++;}field.setSelectionRange(pos,pos);}
  for(const name of ['min','max']){const field=form.elements.namedItem(name);field.addEventListener('input',()=>formatSize(field));}
  function updateOffMarket(){const q=parameters(),land=q.get('type')==='Land',lines=['Hi Rob,','',"I would like to inquire about off-market properties matching these requirements:",'','Type: '+(q.get('type')||'Industrial'),'Cities: '+(q.getAll('city').join(', ')||'GTA and surrounding areas'),'Transaction: '+(q.get('deal')==='Sale'?'Purchase':q.get('deal')==='Lease'?'Lease (including sublease)':'Purchase or lease')];if(q.get('min')||q.get('max'))lines.push((land?'Land area: ':'Building size: ')+(q.get('min')?Number(q.get('min')).toLocaleString('en-CA',{maximumFractionDigits:land?4:2}):'Any minimum')+' to '+(q.get('max')?Number(q.get('max')).toLocaleString('en-CA',{maximumFractionDigits:land?4:2}):'Any maximum')+(land?' acres':' SF'));if(q.get('building'))lines.push('Building type: '+(q.get('building')==='freestanding'?'Free standing':'Multi-tenant'));for(const [name,label] of [['height','Minimum clear height (feet)'],['truck','Minimum truck-level doors'],['drive','Minimum drive-in doors']])if(q.get(name))lines.push(label+': '+q.get(name));lines.push('','Please contact me to discuss available opportunities.','');document.getElementById('off-market-inquiry').href='mailto:rjohnson@lennard.com?subject='+encodeURIComponent('Off-market property inquiry | RGJ Commercial')+'&body='+encodeURIComponent(lines.join('\n'));}
  document.getElementById('off-market-inquiry').addEventListener('click',updateOffMarket);
  form.addEventListener('input',updateOffMarket);form.addEventListener('change',updateOffMarket);
  function parameters(){const q=new URLSearchParams(new FormData(form));for(const name of ['min','max'])if(q.has(name))q.set(name,q.get(name).replaceAll(',',''));for(const [k,v] of [...q])if(!v)q.delete(k);return q;}
  async function search(){
    controller?.abort();controller=new AbortController();const activeController=controller;grid.replaceChildren();grid.setAttribute('aria-busy','true');next.disabled=true;prev.disabled=true;
    const q=parameters();updateOffMarket();const sort=q.get('sort')||'';document.getElementById('sort-note').textContent=sort.startsWith('size-')?(q.get('type')==='Land'?'Size sorting includes listings with land area reported in acres.':'Size sorting includes listings with building area reported in square feet.'):sort.startsWith('price-')?'Prices are sorted by the listed asking amount. Sale prices and lease rates use different bases; choose a transaction to compare similar terms.':'';history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));
    const brief=new URLSearchParams(q);brief.set('type',form.elements.type.value);document.getElementById('search-brief').href='contact.html?'+brief;
    q.set('page',String(page));status.textContent='Searching active property listings…';pageLabel.textContent='';
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
  form.elements.sort.addEventListener('change',()=>{validateRange();if(!form.reportValidity())return;page=1;search();});
  form.addEventListener('submit',e=>{e.preventDefault();validateRange();if(!form.reportValidity())return;page=1;search();});
  function validateRange(){const a=form.elements.min,b=form.elements.max;a.setCustomValidity(sizeNumber(a.value)>100000000?'Enter a size up to 100,000,000.':'');b.setCustomValidity(a.value&&b.value&&sizeNumber(a.value)>sizeNumber(b.value)?'Maximum size must be at least the minimum size.':sizeNumber(b.value)>100000000?'Enter a size up to 100,000,000.':'');for(const name of ['height','truck','drive']){const f=form.elements.namedItem(name);f.setCustomValidity(f.value&&Number(f.value)>(name==='height'?1000:1000)?'Enter a value up to 1,000.':'');}}
  for(const name of ['min','max','height','truck','drive'])form.elements.namedItem(name).addEventListener('input',validateRange);
  const toggle=document.getElementById('extra-filter-toggle'),extra=document.getElementById('extra-filters');
  function updateToggle(){const count=['building','height','truck','drive'].filter(n=>!form.elements.namedItem(n).disabled&&form.elements.namedItem(n).value!=='').length;toggle.textContent='Additional filters'+(count?' ('+count+')':'')+(extra.hidden?' +':' −');toggle.setAttribute('aria-expanded',String(!extra.hidden));}
  toggle.addEventListener('click',()=>{extra.hidden=!extra.hidden;updateToggle();});extra.addEventListener('input',updateToggle);
  form.addEventListener('reset',()=>{page=1;for(const name of ['min','max','height','truck','drive'])form.elements.namedItem(name).setCustomValidity('');setTimeout(()=>{extra.hidden=true;updateToggle();window.RGJCityPicker?.reset();updateSizeMode();search();},0);});
  next.addEventListener('click',()=>{page++;search();});prev.addEventListener('click',()=>{page=Math.max(1,page-1);search();});
  let sizeMode='';
  function updateSizeMode(clearOnChange=false){const land=form.elements.type.value==='Land',mode=land?'acres':'sf';if(clearOnChange&&sizeMode&&sizeMode!==mode){form.elements.min.value='';form.elements.max.value='';form.elements.min.setCustomValidity('');form.elements.max.setCustomValidity('');}sizeMode=mode;for(const name of ['building','height','truck','drive'])form.elements.namedItem(name).disabled=land;toggle.disabled=land;if(land)extra.hidden=true;updateToggle();document.getElementById('size-range-title').textContent=land?'Acres':'Building size (SF)';document.getElementById('size-min-label').textContent=land?'Minimum acres':'Minimum SF';document.getElementById('size-max-label').textContent=land?'Maximum acres':'Maximum SF';for(const name of ['min','max'])form.elements.namedItem(name).pattern=land?'[0-9,]+([.][0-9]{1,4})?':'[0-9,]+([.][0-9]{1,2})?';}
  form.elements.type.addEventListener('change',()=>updateSizeMode(true));
  const initial=new URLSearchParams(location.search);for(const name of ['deal','type','building','sort']){const field=form.elements.namedItem(name);if(initial.has(name)&&[...field.options].some(o=>o.value===initial.get(name)))field.value=initial.get(name);}
  for(const name of ['min','max','height','truck','drive'])if(/^\d+(\.\d{1,4})?$/.test(initial.get(name)||''))form.elements.namedItem(name).value=initial.get(name);
  if(initial.has('size')&&!initial.has('min')&&!initial.has('max')){const match=/^(\d+)-(\d*)$/.exec(initial.get('size'));if(match){form.elements.min.value=match[1];form.elements.max.value=match[2];}}
  updateSizeMode();
  for(const name of ['min','max'])formatSize(form.elements.namedItem(name));
  if(form.elements.type.value!=='Land'&&['building','height','truck','drive'].some(n=>form.elements.namedItem(n).value!==''))extra.hidden=false;updateToggle();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')search();});
  setInterval(()=>{if(document.visibilityState==='visible')search();},15*60*1000);
  search();
})();
