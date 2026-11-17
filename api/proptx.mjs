// Server-only PropTx IDX connector. Credentials are read only at runtime.
import { createHash } from 'node:crypto';
const BASE='https://query.ampre.ca/odata/Property';
export const CITIES=['Mississauga','Brampton','Oakville','Burlington','Vaughan','Etobicoke','Toronto','Ajax','Aurora','Bradford West Gwillimbury','Caledon','Cambridge','Clarington','East Gwillimbury','Georgina','Guelph','Halton Hills','Hamilton','King','Kitchener','Markham','Milton','New Tecumseth','Newmarket','Orangeville','Oshawa','Pickering','Richmond Hill','Scugog','Uxbridge','Waterloo','Whitby','Whitchurch-Stouffville'];
const BANDS=['10000-20000','20000-30000','30000-50000','50000-70000','70000-100000','100000-120000','120000-150000','150000-'];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const cityFilter=city=>city==='Etobicoke'?"(City eq 'Etobicoke' or City eq 'Toronto W06' or City eq 'Toronto W07' or City eq 'Toronto W08' or City eq 'Toronto W09' or City eq 'Toronto W10' or (City eq 'Toronto' and CityRegion eq 'Etobicoke'))":city==='Toronto'?"(City eq 'Toronto' or startswith(City,'Toronto '))":`City eq ${quote(city)}`;
export function queryFor(p){
 for(const key of p.keys())if(!['city','deal','size','page','check'].includes(key)||p.getAll(key).length!==1)throw Error('Invalid filter');
 const city=p.get('city')||'',deal=p.get('deal')||'',size=p.get('size')||'',page=Number(p.get('page')||1);
 if(city&&!CITIES.includes(city)||deal&&!['Sale','Lease'].includes(deal)||size&&!BANDS.includes(size)||!Number.isInteger(page)||page<1||page>5)throw Error('Invalid filter');
 const filters=["StandardStatus eq 'Active'","PropertySubType eq 'Industrial'","InternetEntireListingDisplayYN eq true","(TransactionType eq 'For Sale' or TransactionType eq 'For Lease')",'('+CITIES.map(cityFilter).join(' or ')+')'];
 if(city)filters.push(cityFilter(city));if(deal)filters.push(`TransactionType eq '${deal==='Sale'?'For Sale':'For Lease'}'`);
 if(size){const [min,max]=size.split('-');filters.push("BuildingAreaUnits eq 'Square Feet'",`BuildingAreaTotal ge ${min}`);if(max)filters.push(`BuildingAreaTotal lt ${max}`);}
 return new URLSearchParams({'$filter':filters.map(s=>'('+s+')').join(' and '),'$top':'20','$skip':String((page-1)*20),'$select':'ListingKey,UnparsedAddress,City,TransactionType,BuildingAreaTotal,BuildingAreaUnits,ListPrice,ListPriceUnit,ListOfficeName,ModificationTimestamp,InternetAddressDisplayYN,InternetEntireListingDisplayYN,StandardStatus,PropertySubType','$orderby':'ModificationTimestamp desc,ListingKey desc','$expand':"Media($select=MediaURL,MediaType;$filter=MediaType eq 'image/jpeg';$top=1)"});
}
export function normalize(x){
 if(x.StandardStatus!=='Active'||x.PropertySubType!=='Industrial'||x.InternetEntireListingDisplayYN!==true||!['For Sale','For Lease'].includes(x.TransactionType)||!x.ListOfficeName)return null;
 const city=x.City||'';if(!CITIES.includes(city)&&!city.startsWith('Toronto '))return null;
 const photo=(Array.isArray(x.Media)?x.Media:[]).find(m=>m.MediaType==='image/jpeg'&&typeof m.MediaURL==='string'&&m.MediaURL.startsWith('https://'));
 const text=v=>typeof v==='string'?v.slice(0,500):'';
 return {image:photo?photo.MediaURL:null,key:text(x.ListingKey),address:x.InternetAddressDisplayYN===true?text(x.UnparsedAddress):'',city:text(city),transaction:text(x.TransactionType),area:Number.isFinite(x.BuildingAreaTotal)?x.BuildingAreaTotal:null,areaUnits:text(x.BuildingAreaUnits),price:Number.isFinite(x.ListPrice)?x.ListPrice:null,priceUnit:text(x.ListPriceUnit),brokerage:text(x.ListOfficeName)};
}
export async function handle(request,env=process.env,fetcher=fetch){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const json=(body,status=200)=>Response.json(body,{status,headers});
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 if(!env.PROPTX_TOKEN)return json({status:'not-configured',error:'Live search is not connected yet. Please contact RGJ Commercial.'},503);
 const params=new URL(request.url).searchParams;
 let query;try{query=queryFor(params)}catch{return json({error:'Choose a supported city, transaction, size range and page.'},400)}
 try{
  let r=await fetcher(BASE+'?'+query.toString().replaceAll('+','%20'),{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(r.status===400){query.delete('$expand');r=await fetcher(BASE+'?'+query.toString().replaceAll('+','%20'),{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});}
  if(!r.ok){console.error('proptx_upstream_status',r.status);return json({error:'Property search is temporarily unavailable. Please contact RGJ Commercial.',...(params.get('check')==='1'?{upstreamStatus:r.status}:{} )},502)}
  const data=await r.json();if(!Array.isArray(data.value))throw Error('Unexpected response');
  const rows=data.value.slice(0,20),listings=rows.map(normalize).filter(Boolean);
  const page=Number(params.get('page')||1);
  // Pseudonymous access trail, with no token, listing content or consumer contact data.
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
  const viewer=createHash('sha256').update(new Date().toISOString().slice(0,10)+ip).digest('hex').slice(0,16);
  console.info(JSON.stringify({event:'idx_search',viewer,page,city:params.get('city')||'',deal:params.get('deal')||'',size:params.get('size')||'',returned:listings.length}));
  if(params.get('check')==='1')return json({status:'connected',returned:rows.length,displayable:listings.length,withPhotos:listings.filter(x=>x.image).length,allActive:rows.every(x=>x.StandardStatus==='Active'),allIndustrial:rows.every(x=>x.PropertySubType==='Industrial'),allBrokerage:rows.every(x=>!!x.ListOfficeName),sizeUnits:rows.every(x=>x.BuildingAreaUnits==='Square Feet'),withinSize:rows.every(x=>{if(!params.get('size'))return true;const[a,b]=params.get('size').split('-').map(Number);return x.BuildingAreaTotal>=a&&(!b||x.BuildingAreaTotal<b)}),hasMore:rows.length===20&&page<5});
  return json({status:'connected',listings,hasMore:rows.length===20&&page<5,checkedAt:new Date().toISOString()});
 }catch{console.error('proptx_request_failed');return json({error:'Property search is temporarily unavailable. Please contact RGJ Commercial.'},502)}
}
export default {fetch(request){return handle(request)}};
