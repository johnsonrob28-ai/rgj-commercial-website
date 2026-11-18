// All gallery text is generated locally; MLS images load directly from their approved HTTPS URLs.
window.RGJGallery=function(photos){
 const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
 const gallery=el('section',undefined,'property-gallery');gallery.setAttribute('aria-label','Property photo gallery');
 if(!photos?.length){gallery.append(el('p','No public listing photos are available. Contact RGJ Commercial for images.','gallery-empty'));return gallery;}
 const stage=el('div',undefined,'gallery-stage'),image=el('img'),controls=el('div',undefined,'gallery-controls'),prev=el('button','← Previous'),next=el('button','Next →'),count=el('span'),expand=el('button','Enlarge photo ⤢'),thumbs=el('div',undefined,'gallery-thumbnails'),dialog=el('dialog',undefined,'gallery-dialog'),large=el('img'),close=el('button','Close ×'),largePrev=el('button','← Previous'),largeNext=el('button','Next →'),largeCount=el('span');
 let index=0;const buttons=[];image.decoding='async';large.decoding='async';image.referrerPolicy=large.referrerPolicy='no-referrer';image.addEventListener('error',()=>{image.alt='This photo is temporarily unavailable. Try another photo.';});
 function show(n){index=(n+photos.length)%photos.length;image.src=photos[index].url;image.alt='Property photo '+(index+1)+' of '+photos.length;large.alt=image.alt;if(dialog.open)large.src=image.src;count.textContent=largeCount.textContent=(index+1)+' / '+photos.length;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
 photos.forEach((photo,i)=>{const b=el('button'),img=el('img');b.type='button';b.setAttribute('aria-label','View photo '+(i+1));img.src=photo.url;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';b.append(img);b.addEventListener('click',()=>show(i));buttons.push(b);thumbs.append(b);});
 for(const b of [prev,next,expand,close,largePrev,largeNext])b.type='button';
 prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));largePrev.addEventListener('click',()=>show(index-1));largeNext.addEventListener('click',()=>show(index+1));expand.addEventListener('click',()=>{large.src=image.src;dialog.showModal();close.focus();});close.addEventListener('click',()=>{dialog.close();expand.focus();});
 gallery.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(index-1);}if(e.key==='ArrowRight'){e.preventDefault();show(index+1);}});
 stage.append(image);controls.append(prev,count,next,expand);const bar=el('div',undefined,'gallery-controls');bar.append(largePrev,largeCount,largeNext,close);dialog.append(bar,large);gallery.append(stage,controls,thumbs,dialog);show(0);return gallery;
};
