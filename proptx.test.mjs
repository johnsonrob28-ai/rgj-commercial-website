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
