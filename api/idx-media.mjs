// Media records can contain several resolutions for one photo; Order identifies its gallery position.
export function photosFrom(rows){
 const groups=new Map();
 const rank=m=>/original|extra.?large|xlarge/i.test(m.ImageSizeDescription||'')?4:/large/i.test(m.ImageSizeDescription||'')?3:/medium/i.test(m.ImageSizeDescription||'')?2:/small|thumb/i.test(m.ImageSizeDescription||'')?1:0;
 const pixels=m=>Number(m.ImageWidth)>0&&Number(m.ImageHeight)>0?Number(m.ImageWidth)*Number(m.ImageHeight):0;
 const better=(a,b)=>pixels(a)&&pixels(b)?pixels(a)>pixels(b):rank(a)!==rank(b)?rank(a)>rank(b):pixels(a)>pixels(b);
 for(const m of rows){
  if(typeof m.MediaURL!=='string'||!/^image\//i.test(m.MediaType||''))continue;
  let url;try{url=new URL(m.MediaURL);if(url.protocol!=='https:'||url.username||url.password)continue;}catch{continue;}
  const key=Number.isInteger(m.Order)?'order:'+m.Order:m.OriginalMediaName?'original:'+m.OriginalMediaName:m.MediaObjectID?'object:'+m.MediaObjectID:'url:'+url.href;
  const old=groups.get(key);if(!old||better(m,old.media))groups.set(key,{media:m,url:url.href});
 }
 const seen=new Set();return [...groups.values()].sort((a,b)=>(Number(a.media.Order)||0)-(Number(b.media.Order)||0)).flatMap(x=>{if(seen.has(x.url))return [];seen.add(x.url);return [{url:x.url}];});
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
export async function loadCoverPhotos(keys,env,fetcher=fetch){
 if(!keys.length)return new Map();
 const q=new URLSearchParams({'$filter':"ResourceName eq 'Property' and MediaType eq 'image/jpeg' and Order le 1 and ("+keys.map(k=>"ResourceRecordKey eq '"+k.replaceAll("'","''")+"'").join(' or ')+')','$select':'ResourceRecordKey,MediaURL,MediaType,Order,ImageWidth,ImageHeight,ImageSizeDescription','$top':'1000'});
 const r=await fetcher('https://query.ampre.ca/odata/Media?'+q.toString().replaceAll('+','%20'),{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Cover photos unavailable');const data=await r.json();if(!Array.isArray(data.value))throw Error('Invalid media response');const result=new Map();for(const key of keys){const photos=photosFrom(data.value.filter(m=>m.ResourceRecordKey===key));if(photos.length)result.set(key,photos[0].url);}return result;
}
