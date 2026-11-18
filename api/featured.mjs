// Server-only IDX highlights, curated from the member's public Lennard listing page.
import {queryFor,normalize} from './proptx.mjs';
import {loadCoverPhotos} from './idx-media.mjs';
// https://www.lennard.com/people/robert-johnson — verified 2026-11-18.
// IDX omits agent identity fields; never substitute all brokerage listings.
const TARGETS=[
 {address:'18 Hedgedale',match:/\b18\s+hedgedale\b/i},
 {address:'7429 Ninth',match:/\b7429\s+ninth\s+line\b/i}
];
export const isFeatured=x=>typeof x.UnparsedAddress==='string'&&typeof x.ListOfficeName==='string'&&/\blennard\b/i.test(x.ListOfficeName)&&TARGETS.some(t=>t.match.test(x.UnparsedAddress));
export function featuredQuery(){
 const q=queryFor(new URLSearchParams(),{allTypes:true});
 q.set('$filter',"StandardStatus eq 'Active' and InternetEntireListingDisplayYN eq true and contains(ListOfficeName,'Lennard') and ("+TARGETS.map(t=>"contains(UnparsedAddress,'"+t.address+"')").join(' or ')+')');
 return q;
}
export async function handle(request,env=process.env,fetcher=fetch){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':status===200&&Array.isArray(body.listings)?'public, max-age=0, s-maxage=300, stale-while-revalidate=60':'no-store','X-Content-Type-Options':'nosniff'}});
 const params=new URL(request.url).searchParams;
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if([...params.keys()].some(k=>k!=='check'||params.getAll(k).length!==1)||params.has('check')&&params.get('check')!=='1')return json({error:'Invalid request'},400);
 if(!env.PROPTX_TOKEN)return json({error:'Featured listings are temporarily unavailable.'},503);
 try{
  const r=await fetcher('https://query.ampre.ca/odata/Property?'+featuredQuery().toString().replaceAll('+','%20'),{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!r.ok)return json({error:'Featured listings are temporarily unavailable.',...(params.has('check')?{upstreamStatus:r.status}: {})},502);
  const data=await r.json();if(!Array.isArray(data.value))throw Error();
  const rows=data.value.slice(0,20),listings=rows.filter(isFeatured).map(normalize).filter(Boolean);
  if(params.has('check'))return json({status:'connected',returned:rows.length,displayable:listings.length,allCurated:rows.every(isFeatured),allActive:rows.every(x=>x.StandardStatus==='Active'),allPublic:rows.every(x=>x.InternetEntireListingDisplayYN===true)});
  try{const covers=await loadCoverPhotos(listings.filter(x=>x.address).map(x=>x.key),env,fetcher);for(const x of listings)if(x.address)x.image=covers.get(x.key)||null;}catch{console.info('featured_cover_photos_unavailable');}
  return json({status:'connected',listings,hasMore:rows.length===20,checkedAt:new Date().toISOString()});
 }catch{return json({error:'Featured listings are temporarily unavailable.'},502);}
}
export default {fetch(request){return handle(request)}};
