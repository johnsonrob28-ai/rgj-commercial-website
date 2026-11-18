(()=>{
 const root=document.getElementById('property-detail'),status=document.getElementById('detail-status'),p=new URLSearchParams(location.search);
 const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
 const back=new URLSearchParams(p.get('back')||'');for(const k of [...back.keys()])if(!['city','deal','min','max','size','height','truck','drive','type'].includes(k))back.delete(k);
 document.getElementById('back-results').href='properties.html'+(back.size?'?'+back:'');
 const money=v=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(v);
 async function load(){
 root.setAttribute('aria-busy','true');status.textContent='Loading property details…';
 try{
 const key=p.get('listing');if(!key)throw Error('Choose a listing from Search Properties to view its details.');
 const r=await fetch('/api/property?'+new URLSearchParams({listing:key}),{cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load this property.');const x=data.listing;
 document.getElementById('property-title').textContent=x.address||'Commercial property — address on inquiry';document.title=(x.address||'Commercial property')+' | RGJ Commercial';
 document.getElementById('property-location').textContent=x.city+' · '+(x.type||'Industrial')+' · '+(x.transactionLabel||x.transaction)+' · MLS® '+x.key;
 const overview=el('div',undefined,'detail-overview');overview.append(el('p',x.price!==null?money(x.price)+(x.priceUnit?' · '+x.priceUnit:''):'Asking price available on inquiry','detail-price'),el('p',x.area!==null?Number(x.area).toLocaleString('en-CA',{maximumFractionDigits:x.type==='Land'?4:2})+' '+x.areaUnits:'Area available on inquiry'),el('p','Listed by: '+x.brokerage,'listing-brokerage'));const gallery=window.RGJGallery(x.photos||[]);if(x.photoStatus==='unavailable')gallery.replaceChildren(el('p','Listing photos are temporarily unavailable. Please reload or contact RGJ Commercial.','gallery-empty'));const content=[gallery,overview];
 if(x.remarks){const section=el('section',undefined,'detail-section');section.append(el('h2','Property overview'),el('p',x.remarks,'detail-remarks'));content.push(section);}
 x.sections.forEach(s=>{const section=el('section',undefined,'detail-section');section.append(el('h2',s.title));if(s.rows.length){const dl=el('dl',undefined,'spec-grid');s.rows.forEach(row=>{const pair=el('div');pair.append(el('dt',row.label),el('dd',(typeof row.value==='number'?(row.format==='money'?money(row.value):row.value.toLocaleString('en-CA')):row.value)+(row.unit?' · '+row.unit:'')));dl.append(pair);});section.append(dl);}else section.append(el('p','These specifications were not supplied in the public listing. Contact RGJ Commercial to confirm.'));content.push(section);});
 content.push(el('p','Figures describe the listed building or available space and may not represent the whole property. Costs are in CAD and shown on the basis supplied by the listing brokerage. Taxes, TMI, additional rent, utilities and HST may be extra. No total occupancy cost is assumed. Confirm all measurements, costs and availability before relying on them.','detail-note'));
 root.replaceChildren(...content);status.textContent='Last checked: '+new Date(data.checkedAt).toLocaleString('en-CA',{timeZone:'America/Toronto'})+' ET';
 const subject='Property inquiry — MLS® '+x.key+(x.address?' — '+x.address:'');const emailHref='mailto:rjohnson@lennard.com?'+new URLSearchParams({subject,body:'Hi Rob,\n\nI would like more information about this property:\n'+location.origin+location.pathname+'?'+new URLSearchParams({listing:x.key})+'\n\n'});
 document.querySelectorAll('.property-email').forEach(link=>{link.href=emailHref;});
 document.getElementById('detail-inquiry').href='contact.html?'+new URLSearchParams({address:x.address,city:x.city,deal:x.transaction==='For Sale'?'Sale':'Lease',message:subject});
 }catch(e){root.replaceChildren();status.textContent=e.message;}finally{root.setAttribute('aria-busy','false');}
 }
 load();setInterval(()=>{if(document.visibilityState==='visible')load();},15*60*1000);
})();
