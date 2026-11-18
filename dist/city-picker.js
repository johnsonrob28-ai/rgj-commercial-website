(()=>{
 const picker=document.getElementById('city-picker');if(!picker)return;
 const cityBoxes=[...picker.querySelectorAll('input[name="city"]')],regionBoxes=[...picker.querySelectorAll('[data-region]')],summary=document.getElementById('city-summary-text');
 function update(){const selected=cityBoxes.filter(c=>c.checked);summary.textContent=selected.length===0?'All covered areas':selected.length===1?selected[0].value:selected.length+' cities selected';regionBoxes.forEach(region=>{const members=cityBoxes.filter(c=>c.dataset.cityRegion===region.dataset.region),count=members.filter(c=>c.checked).length;region.checked=count===members.length;region.indeterminate=count>0&&count<members.length;});}
 const initial=new URLSearchParams(location.search).getAll('city');cityBoxes.forEach(c=>{c.checked=initial.includes(c.value);});
 picker.addEventListener('change',e=>{if(e.target.matches('[data-region]'))cityBoxes.filter(c=>c.dataset.cityRegion===e.target.dataset.region).forEach(c=>{c.checked=e.target.checked;});update();});
 document.getElementById('clear-cities').addEventListener('click',()=>{cityBoxes.forEach(c=>{c.checked=false;});update();});
 document.getElementById('cities-done').addEventListener('click',()=>{picker.open=false;picker.querySelector('summary').focus();});
 document.addEventListener('click',e=>{if(!picker.contains(e.target))picker.open=false;});picker.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();picker.open=false;picker.querySelector('summary').focus();}});
 window.RGJCityPicker={reset(){cityBoxes.forEach(c=>{c.checked=false;});picker.open=false;update();}};update();
})();
