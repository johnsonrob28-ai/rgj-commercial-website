const BASE = 'https://query.ampre.ca/odata/';
export async function schema(fetcher=fetch, token=process.env.PROPTX_TOKEN) {
  const r = await fetcher(BASE+'$metadata',{headers:{Authorization:'Bearer '+token,Accept:'application/xml'},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!r.ok) throw Error('Metadata access '+r.status);
  const xml=await r.text();
  const entity=xml.match(/<EntityType\b[^>]*Name="Property"[\s\S]*?<\/EntityType>/)?.[0] || '';
  const fields=[...entity.matchAll(/<Property\b([^>]+)>?/g)].map(x=>({name:x[1].match(/Name="([^"]+)"/)?.[1],type:x[1].match(/Type="([^"]+)"/)?.[1]}));
  const enums=[...xml.matchAll(/<EnumType\b[^>]*Name="([^"]+)"[^>]*>([\s\S]*?)<\/EnumType>/g)].filter(x=>/Status|Property|Business|Area|Transaction|Sale|Lease/i.test(x[1])).map(x=>({name:x[1],values:[...x[2].matchAll(/<Member\b[^>]*Name="([^"]+)"/g)].map(y=>y[1])}));
  return {fields:fields.filter(x=>/Status|Property|Business|Area|Transaction|Sale|Lease|City|Address|ListPrice|ListOffice|Modification|ListingKey|Originating|Internet|Media|Unit/i.test(x.name||'')),enums};
}
export default {async fetch(request){
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(request.method!=='GET') return Response.json({error:'Method not allowed'},{status:405,headers});
  if(!process.env.PROPTX_TOKEN) return Response.json({status:'not-configured'},{status:503,headers});
  try {return Response.json({status:'metadata-connected',...await schema()},{headers});}
  catch(e){return Response.json({status:'unavailable',error:String(e.message).startsWith('Metadata access')?e.message:'Feed connection unavailable'},{status:502,headers});}
}};
