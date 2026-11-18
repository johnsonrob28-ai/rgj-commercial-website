(()=>{
 const header=document.querySelector('.site-header'),nav=header?.querySelector('nav');if(!nav)return;
 nav.id='main-navigation';const button=document.createElement('button');button.type='button';button.className='nav-toggle';button.textContent='Menu';button.setAttribute('aria-controls',nav.id);button.setAttribute('aria-expanded','false');header.insertBefore(button,nav);header.classList.add('nav-ready');
 function close(){header.classList.remove('menu-open');button.setAttribute('aria-expanded','false');}
 button.addEventListener('click',()=>{const open=header.classList.toggle('menu-open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'Close':'Menu';});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){close();button.textContent='Menu';}});header.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('menu-open')){close();button.textContent='Menu';button.focus();}});
 const mq=matchMedia('(max-width:760px)');mq.addEventListener('change',()=>{close();button.textContent='Menu';});
})();
