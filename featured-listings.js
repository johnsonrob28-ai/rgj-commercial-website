(() => {
 const section=document.getElementById('featured-listings');if(!section)return;
 const grid=document.getElementById('featured-results'),status=document.getElementById('featured-status');
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
  function card(x){
    const article=el('article',undefined,'listing-card featured-listing-card'),copy=el('div',undefined,'property-copy');
    if(x.image){const image=el('img');image.src=x.image;image.alt=x.address?'Property at '+x.address:'Property listing';image.loading='lazy';image.referrerPolicy='no-referrer';image.className='listing-photo';image.addEventListener('error',()=>image.remove(),{once:true});article.append(image);}
    copy.append(el('div',`${(x.type||'Industrial').toUpperCase()} · ${x.transactionLabel||x.transaction}`,'demo-label'),el('h3',x.address||'Address available on inquiry'),el('p',x.city));
    const meta=el('div',undefined,'property-meta');
    meta.append(el('span',x.area!==null?`${Number(x.area).toLocaleString('en-CA',{maximumFractionDigits:x.type==='Land'?4:2})} ${x.areaUnits||''}`:'Area not supplied'));
    const price=x.price===null?'Contact for asking price':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(x.price);
    meta.append(el('span',price+(x.priceUnit?' · '+x.priceUnit:'')));copy.append(meta);
    copy.append(el('p','Listed by: '+x.brokerage,'listing-brokerage'),el('p','MLS® '+x.key));
    const link=el('a','View property details →','listing-inquiry');
    link.href='property.html?'+new URLSearchParams({listing:x.key,back:location.search.slice(1)});
    copy.append(link);article.append(copy);article.classList.add('clickable-listing');
    article.addEventListener('click',e=>{if(!e.target.closest('a')&&!window.getSelection()?.toString())link.click();});return article;
  }

 let loading=false;
 async function refresh(){
  if(loading)return;loading=true;grid.setAttribute('aria-busy','true');
  try{
   const r=await fetch('/api/featured',{cache:'no-store'}),data=await r.json();
   if(!r.ok||data.status!=='connected'||!Array.isArray(data.listings))throw Error();
   grid.replaceChildren(...data.listings.map(card));
   status.textContent=data.listings.length?(data.hasMore?'Showing the latest 20 featured listings. Contact us for the full list.':data.listings.length+' current '+(data.listings.length===1?'listing':'listings')):'No featured listings are currently available in the active public feed. Contact us for current or off-market opportunities.';
   document.getElementById('featured-checked').textContent='Last checked: '+new Date(data.checkedAt).toLocaleString('en-CA',{timeZone:'America/Toronto'})+' ET';
  }catch{
   grid.replaceChildren();status.textContent='Featured listings are temporarily unavailable. Please contact RGJ Commercial for current opportunities.';
   document.getElementById('featured-checked').textContent='';
  }finally{loading=false;grid.setAttribute('aria-busy','false');}
 }
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
 setInterval(()=>{if(document.visibilityState==='visible')refresh();},15*60*1000);
 refresh();
})();
