import test from 'node:test';
import assert from 'node:assert/strict';
import {queryFor,normalize,handle} from './api/proptx.mjs';
test('only supported filters and size bands can reach feed',()=>{
 for(const s of ['$filter=true','size=1-2','deal=Sold','page=6','city=Ottawa','city=Oakville&city=Vaughan'])assert.throws(()=>queryFor(new URLSearchParams(s)));
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
const fixture={StandardStatus:'Active',PropertySubType:'Industrial',TransactionType:'For Lease',City:'Mississauga',ListingKey:'fixture',UnparsedAddress:'Example address',InternetAddressDisplayYN:true,InternetEntireListingDisplayYN:true,ListOfficeName:'Example brokerage',BuildingAreaTotal:15000,BuildingAreaUnits:'Square Feet',ListPrice:18,ListPriceUnit:'Per Sq Ft',TaxAnnualAmount:5000,TruckLevelShippingDoors:2,PrivateRemarks:'PRIVATE',ListAgentEmail:'PRIVATE',PublicRemarks:'Public description'};
test('details preserve supplied costs and specifications, never private feed fields',()=>{const x=detail(fixture);assert.equal(x.price,18);assert.ok(x.sections.flatMap(s=>s.rows).some(r=>r.label==='Annual property taxes'&&r.value===5000));assert.ok(x.sections.flatMap(s=>s.rows).some(r=>r.label==='Truck-level doors'&&r.value===2));assert.doesNotMatch(JSON.stringify(x),/PRIVATE|ListAgentEmail/);assert.equal(detail({...fixture,InternetAddressDisplayYN:false}).remarks,'');assert.equal(detail({...fixture,StandardStatus:'Closed'}),null);});
test('detail lookup enforces active public filters, strict encoding and exact identity',async()=>{let requested='';const fetcher=async url=>{requested=url;return Response.json({value:[fixture]})};const r=await handleDetail(new Request('https://example.com/api/property?listing=fixture'),{PROPTX_TOKEN:'fixture'},fetcher);assert.equal(r.status,200);assert.doesNotMatch(requested,/\+/);assert.match(decodeURIComponent(requested),/InternetEntireListingDisplayYN eq true/);assert.match(decodeURIComponent(requested),/ListingKey eq 'fixture'/);assert.equal((await handleDetail(new Request('https://example.com/api/property?listing=other'),{PROPTX_TOKEN:'fixture'},fetcher)).status,404);});
test('detail rejects invalid keys before fetching and does not expose upstream errors',async()=>{for(const suffix of ['listing=a%27','listing=a&listing=b','$filter=true','listing=a&city=Oakville'])assert.equal((await handleDetail(new Request('https://example.com/api/property?'+suffix),{PROPTX_TOKEN:'fixture'},()=>assert.fail())).status,400);const r=await handleDetail(new Request('https://example.com/api/property?listing=fixture'),{PROPTX_TOKEN:'fixture'},async()=>new Response('PRIVATE',{status:403}));assert.equal(r.status,502);assert.doesNotMatch(await r.text(),/PRIVATE|fixture/);});
