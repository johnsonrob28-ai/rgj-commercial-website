import test from 'node:test';
import assert from 'node:assert/strict';
import {queryFor,normalize,handle} from './api/proptx.mjs';
test('only supported filters and size bands can reach feed',()=>{
 for(const s of ['$filter=true','size=1-2','deal=Sold','page=6','city=Ottawa'])assert.throws(()=>queryFor(new URLSearchParams(s)));
 const q=queryFor(new URLSearchParams('size=10000-20000&deal=Lease&city=Mississauga'));
 assert.match(q.get('$filter'),/BuildingAreaTotal ge 10000/);assert.match(q.get('$filter'),/BuildingAreaTotal lt 20000/);assert.doesNotMatch(q.get('$filter'),/LotSize/);
});
test('private address, extra fields and non-active listings never leave server',()=>{
 const x={StandardStatus:'Active',PropertySubType:'Industrial',TransactionType:'For Lease',City:'Mississauga',ListingKey:'fixture',UnparsedAddress:'PRIVATE',InternetAddressDisplayYN:false,InternetEntireListingDisplayYN:true,ListOfficeName:'Fixture brokerage',BuildingAreaTotal:15000,BuildingAreaUnits:'Square Feet',PrivateRemarks:'PRIVATE'};
 const y=normalize(x);assert.equal(y.address,'');assert.doesNotMatch(JSON.stringify(y),/PRIVATE/);assert.equal(normalize({...x,StandardStatus:'Closed'}),null);assert.equal(normalize({...x,InternetEntireListingDisplayYN:false}),null);
});
test('a missing token fails closed and makes no network calls',async()=>{const r=await handle(new Request('https://example.com/api/proptx'),{},()=>assert.fail());assert.equal(r.status,503)});
test('invalid query rejected before feed fetch',async()=>{const r=await handle(new Request('https://example.com/api/proptx?$top=5000'),{PROPTX_TOKEN:'fixture'},()=>assert.fail());assert.equal(r.status,400)});
test('upstream failures do not reveal upstream response or token',async()=>{const r=await handle(new Request('https://example.com/api/proptx'),{PROPTX_TOKEN:'fixture'},async()=>new Response('SECRET',{status:401}));assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/SECRET|fixture/)});
test('query five cannot return more than 100 results across pages',()=>{const q=queryFor(new URLSearchParams('page=5'));assert.equal(q.get('$top'),'20');assert.equal(q.get('$skip'),'80')});
import {detail,handle as handleDetail} from './api/property.mjs';
test('custom ranges support open ends and inclusive limits without query injection',()=>{
 for(const s of ['min=10000&max=20000','min=10000','max=20000','min=0&max=0'])assert.ok(queryFor(new URLSearchParams(s)));
 const q=queryFor(new URLSearchParams('min=10000&max=20000'));assert.match(q.get('$filter'),/BuildingAreaTotal le 20000/);assert.match(q.get('$filter'),/BuildingAreaUnits eq 'Square Feet'/);
 for(const s of ['min=20000&max=10000','min=-1','max=NaN','min=1e5','max=100000001','min=0 or true','min=10&min=20','size=10000-20000&max=30000'])assert.throws(()=>queryFor(new URLSearchParams(s)));
});
const fixture={PropertyType:'Commercial',StandardStatus:'Active',PropertySubType:'Industrial',TransactionType:'For Lease',City:'Mississauga',ListingKey:'fixture',UnparsedAddress:'Example address',InternetAddressDisplayYN:true,InternetEntireListingDisplayYN:true,ListOfficeName:'Example brokerage',BuildingAreaTotal:15000,BuildingAreaUnits:'Square Feet',ListPrice:18,ListPriceUnit:'Per Sq Ft',TaxAnnualAmount:5000,TruckLevelShippingDoors:2,PrivateRemarks:'PRIVATE',ListAgentEmail:'PRIVATE',PublicRemarks:'Public description'};
test('details preserve supplied costs and specifications, never private feed fields',()=>{const x=detail(fixture);assert.equal(x.price,18);assert.ok(x.sections.flatMap(s=>s.rows).some(r=>r.label==='Annual property taxes'&&r.value===5000));assert.ok(x.sections.flatMap(s=>s.rows).some(r=>r.label==='Truck-level doors'&&r.value===2));assert.doesNotMatch(JSON.stringify(x),/PRIVATE|ListAgentEmail/);assert.equal(detail({...fixture,InternetAddressDisplayYN:false}).remarks,'');assert.equal(detail({...fixture,StandardStatus:'Closed'}),null);});
test('detail lookup enforces active public filters, strict encoding and exact identity',async()=>{let requested='';const fetcher=async url=>{if(url.includes('/Property?')){requested=url;return Response.json({value:[fixture]})}return Response.json({value:[]})};const r=await handleDetail(new Request('https://example.com/api/property?listing=fixture'),{PROPTX_TOKEN:'fixture'},fetcher);assert.equal(r.status,200);assert.doesNotMatch(requested,/\+/);assert.match(decodeURIComponent(requested),/InternetEntireListingDisplayYN eq true/);assert.match(decodeURIComponent(requested),/ListingKey eq 'fixture'/);assert.equal((await handleDetail(new Request('https://example.com/api/property?listing=other'),{PROPTX_TOKEN:'fixture'},fetcher)).status,404);});
test('detail rejects invalid keys before fetching and does not expose upstream errors',async()=>{for(const suffix of ['listing=a%27','listing=a&listing=b','$filter=true','listing=a&city=Oakville'])assert.equal((await handleDetail(new Request('https://example.com/api/property?'+suffix),{PROPTX_TOKEN:'fixture'},()=>assert.fail())).status,400);const r=await handleDetail(new Request('https://example.com/api/property?listing=fixture'),{PROPTX_TOKEN:'fixture'},async()=>new Response('PRIVATE',{status:403}));assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/PRIVATE|fixture/);});
import {photosFrom,loadPhotos} from './api/idx-media.mjs';
test('industrial minimums query verified numeric MLS fields, including fractional clear height',()=>{
 const q=queryFor(new URLSearchParams('height=24.5&truck=2&drive=1'));const f=q.get('$filter');assert.match(f,/ClearHeightFeet gt 24/);assert.match(f,/ClearHeightInches ge 6/);assert.match(f,/TruckLevelShippingDoors ge 2/);assert.match(f,/DriveInLevelShippingDoors ge 1/);
 assert.match(queryFor(new URLSearchParams('height=24')).get('$filter'),/ClearHeightFeet ge 24/);
 for(const p of ['height=-1','height=NaN','truck=1.5','drive=1001','truck=1 or true','height=12&height=24'])assert.throws(()=>queryFor(new URLSearchParams(p)));
});
test('gallery retains every unique HTTPS image in listing order and omits unsafe media',()=>{
 const photos=photosFrom([{MediaType:'image/jpeg',MediaURL:'https://example.com/2.jpg',Order:2},{MediaType:'image/jpeg',MediaURL:'https://example.com/1.jpg',Order:1},{MediaType:'image/jpeg',MediaURL:'https://example.com/1.jpg',Order:1},{MediaType:'application/pdf',MediaURL:'https://example.com/private.pdf'},{MediaType:'image/jpeg',MediaURL:'javascript:alert(1)'},{MediaType:'image/png',MediaURL:'https://user:pass@example.com/x.png'}]);assert.deepEqual(photos,[{url:'https://example.com/1.jpg'},{url:'https://example.com/2.jpg'}]);
});
test('all gallery pages are read without forwarding credentials to foreign continuation URLs',async()=>{
 let calls=0;const env={PROPTX_TOKEN:'fixture'};const photos=await loadPhotos('fixture',env,async(url,options)=>{calls++;assert.equal(options.redirect,'error');assert.doesNotMatch(url,/\+/);return Response.json({value:[{MediaType:'image/jpeg',MediaURL:'https://example.com/'+calls+'.jpg',Order:calls}],...(calls===1?{'@odata.nextLink':'https://query.ampre.ca/odata/Media?$skip=1000'}:{})})});assert.equal(photos.length,2);assert.equal(calls,2);
 await assert.rejects(loadPhotos('fixture',env,async()=>Response.json({value:[],'@odata.nextLink':'https://other.example/steal'})));
});

test('multi-city queries OR cities together while keeping other restrictions ANDed',()=>{
 const q=queryFor(new URLSearchParams('city=Mississauga&city=Brampton&city=Oakville&min=10000&max=50000&deal=Lease'));const f=q.get('$filter');assert.match(f,/City eq 'Mississauga' or City eq 'Brampton' or City eq 'Oakville'/);assert.match(f,/BuildingAreaTotal ge 10000/);assert.match(f,/TransactionType eq 'For Lease'/);assert.match(f,/StandardStatus eq 'Active'/);
 for(const s of ['city=Oakville&city=Oakville','city=Oakville&city=Ottawa','city=Oakville&deal=Lease&deal=Sale','city=Toronto%27%20or%20true'])assert.throws(()=>queryFor(new URLSearchParams(s)));
 assert.match(queryFor(new URLSearchParams('city=Toronto&city=Etobicoke')).get('$filter'),/Toronto W06/);
});

test('all supported property categories and subleases reach search and detail views',()=>{
 for(const type of ['Industrial','Land','Investment']){assert.match(queryFor(new URLSearchParams({type})).get('$filter'),new RegExp("PropertySubType eq '"+type+"'"));assert.equal(normalize({...fixture,PropertySubType:type,TransactionType:'For Sub-Lease'}).type,type);assert.equal(detail({...fixture,PropertySubType:type,TransactionType:'For Sub-Lease'}).transactionLabel,'For sublease');}
 assert.equal(normalize({...fixture,PropertySubType:'Office'}),null);assert.throws(()=>queryFor(new URLSearchParams('type=Office')));assert.throws(()=>queryFor(new URLSearchParams('type=Industrial&type=Land')));
 const lease=queryFor(new URLSearchParams('deal=Lease')).get('$filter');assert.match(lease,/TransactionType eq 'For Lease' or TransactionType eq 'For Sub-Lease'/);
 assert.ok(queryFor(new URLSearchParams(),{allTypes:true}).get('$filter').includes("PropertySubType eq 'Industrial' or PropertySubType eq 'Land' or (PropertyType eq 'Commercial'"));
});

test('Investment includes case-insensitive public description matches across commercial subtypes',()=>{
 const office={...fixture,PropertyType:'Commercial',PropertySubType:'Office',PublicRemarks:'An INVESTMENT opportunity with existing income.'};
 assert.ok(normalize(office));assert.ok(detail(office));assert.equal(normalize(office).type,'Office');
 assert.equal(normalize({...office,PropertyType:'Residential Freehold'}),null);assert.equal(normalize({...office,PublicRemarks:'Office suite available.'}),null);assert.equal(normalize({...office,PublicRemarks:null,PrivateRemarks:'INVESTMENT'}),null);assert.equal(normalize({...office,StandardStatus:'Closed'}),null);assert.equal(normalize({...office,InternetEntireListingDisplayYN:false}),null);
 const hidden=normalize({...office,InternetAddressDisplayYN:false,UnparsedAddress:'PRIVATE ADDRESS'});assert.equal(hidden.address,'');assert.doesNotMatch(JSON.stringify(hidden),/PRIVATE ADDRESS|existing income/);
 const filter=queryFor(new URLSearchParams('type=Investment&city=Mississauga&deal=Sale')).get('$filter');assert.ok(filter.includes("PropertyType eq 'Commercial' and (PropertySubType eq 'Investment' or contains(tolower(PublicRemarks),'investment'))"));assert.ok(filter.includes("City eq 'Mississauga'"));assert.ok(filter.includes("TransactionType eq 'For Sale'"));
});
