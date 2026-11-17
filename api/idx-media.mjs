export function photosFrom(rows){
 const seen=new Set();return [...rows].filter(m=>typeof m.MediaURL==='string'&&/^image\//i.test(m.MediaType||'')).sort((a,b)=>(Number(a.Order)||0)-(Number(b.Order)||0)).flatMap(m=>{try{const url=new URL(m.MediaURL);if(url.protocol!=='https:'||url.username||url.password||seen.has(url.href))return [];seen.add(url.href);return [{url:url.href}];}catch{return [];}});
}
export async function loadPhotos(key,env,fetcher=fetch){
 const q=new URLSearchParams({'$filter':`ResourceRecordKey eq '${key}' and ResourceName eq 'Property'`,'$top':'1000'});
 let url='https://query.ampre.ca/odata/Media?'+q.toString().replaceAll('+','%20'),rows=[];const visited=new Set();
 while(url){
  if(visited.has(url)||visited.size>=10)throw Error('Incomplete media feed');visited.add(url);
  const r=await fetcher(url,{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Media unavailable');const data=await r.json();if(!Array.isArray(data.value))throw Error('Invalid media response');rows.push(...data.value);
  url='';if(data['@odata.nextLink']){const next=new URL(data['@odata.nextLink'],'https://query.ampre.ca/odata/Media');if(next.origin!=='https://query.ampre.ca'||next.pathname!=='/odata/Media')throw Error('Invalid media continuation');url=next.href.replaceAll('+','%20');}
 }
 return photosFrom(rows);
}
