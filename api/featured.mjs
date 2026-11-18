// Server-only: feature the member's active, publicly displayable IDX listings.
import {queryFor,normalize} from './proptx.mjs';
import {loadCoverPhotos} from './idx-media.mjs';
const ORIGIN='https://query.ampre.ca/odata/';
// Member identifier on RGJ Commercial's approved PropTx IDX agreement.
const MEMBER_ID='9557174';
export function agentFields(metadata){
 return [...metadata.matchAll(/<Property\b[^>]*>/g)].flatMap(([tag])=>{
  const name=/\bName="([^"]+)"/.exec(tag)?.[1],type=/\bType="([^"]+)"/.exec(tag)?.[1];
  return type==='Edm.String'&&/^(?:ListAgent|CoListAgent)\d*(?:Key|MlsId)\d*$/.test(name||'')?[name]:[];
 }).filter((name,i,all)=>all.indexOf(name)===i);
}
export function featuredQuery(fields){
 if(!fields.length||fields.some(f=>!/^(?:ListAgent|CoListAgent)\d*(?:Key|MlsId)\d*$/.test(f)))throw Error('Agent fields unavailable');
 const q=queryFor(new URLSearchParams(),{allTypes:true});
 q.set('$filter',q.get('$filter')+' and ('+fields.map(f=>`${f} eq '${MEMBER_ID}'`).join(' or ')+')');
 q.set('$select',q.get('$select')+','+fields.join(','));
 return q;
}
export async function handle(request,env=process.env,fetcher=fetch){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 const params=new URL(request.url).searchParams;
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if([...params.keys()].some(k=>k!=='check'||params.getAll(k).length!==1)||params.has('check')&&params.get('check')!=='1')return json({error:'Invalid request'},400);
 if(!env.PROPTX_TOKEN)return json({error:'Featured listings are temporarily unavailable.'},503);
 const options={headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error'};
 try{
  const schema=await fetcher(ORIGIN+'$metadata',{...options,headers:{...options.headers,Accept:'application/xml'},signal:AbortSignal.timeout(12000)});
  if(!schema.ok)throw Error();
  const fields=agentFields(await schema.text()).filter(f=>['ListAgentKey','CoListAgentKey'].includes(f)),q=featuredQuery(fields);
  const r=await fetcher(ORIGIN+'Property?'+q.toString().replaceAll('+','%20'),{...options,signal:AbortSignal.timeout(30000)});
  if(!r.ok){let reason='';if(params.has('check')){try{reason=(await r.json())?.error?.message||'';}catch{}}return json({error:'Featured listings are temporarily unavailable.',...(params.has('check')?{upstreamStatus:r.status,agentFields:fields,reason:String(reason).slice(0,600)}: {})},502);}
  const data=await r.json();if(!Array.isArray(data.value))throw Error();
  // Validate agent identity again before returning only approved public card fields.
  const rows=data.value.slice(0,20),own=rows.filter(x=>fields.some(f=>x[f]===MEMBER_ID));
  const listings=own.map(normalize).filter(Boolean);
  if(params.has('check'))return json({status:'connected',agentFields:fields,returned:rows.length,displayable:listings.length,allOwn:rows.every(x=>fields.some(f=>x[f]===MEMBER_ID)),allActive:rows.every(x=>x.StandardStatus==='Active'),allPublic:rows.every(x=>x.InternetEntireListingDisplayYN===true)});
  try{const covers=await loadCoverPhotos(listings.filter(x=>x.address).map(x=>x.key),env,fetcher);for(const x of listings)if(x.address)x.image=covers.get(x.key)||null;}catch{console.info('featured_cover_photos_unavailable');}
  return json({status:'connected',listings,hasMore:rows.length===20,checkedAt:new Date().toISOString()});
 }catch{return json({error:'Featured listings are temporarily unavailable.'},502);}
}
export default {fetch(request){return handle(request)}};
