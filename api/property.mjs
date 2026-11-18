import {queryFor,normalize} from './proptx.mjs';
import {loadPhotos} from './idx-media.mjs';
// Explicit public field allowlist: never pass raw MLS records or private remarks to the browser.
const GROUPS={
 'Building & space':[['PropertySubType','Property type'],['TransactionType','Transaction'],['BuildingAreaTotal','Listed building / space area','BuildingAreaUnits'],['IndustrialArea','Industrial area','IndustrialAreaCode'],['OfficeApartmentArea','Office / apartment area','OfficeApartmentAreaUnit'],['RetailArea','Retail area','RetailAreaCode'],['ClearHeight','Clear height'],['ClearHeightFeet','Clear height (feet)'],['ClearHeightInches','Clear height (inches)'],['CeilingHeight','Ceiling height'],['TruckLevelShippingDoors','Truck-level doors'],['TruckLevelShippingDoorsWidth','Truck-level door width'],['TruckLevelShippingDoorsHeight','Truck-level door height'],['DriveInLevelShippingDoors','Drive-in doors'],['DriveInLevelShippingDoorsWidth','Drive-in door width'],['DriveInLevelShippingDoorsHeight','Drive-in door height'],['DoubleManShippingDoors','Double-man doors'],['GradeLevelShippingDoors','Grade-level doors'],['Rail','Rail access'],['Amps','Electrical service (amps)'],['Volts','Electrical service (volts)'],['HeatType','Heating'],['Cooling','Cooling'],['Sprinklers','Sprinklers'],['ElevatorType','Elevator'],['YearBuilt','Year built'],['PropertyUse','Property use'],['BusinessType','Business type'],['PropertyFeatures','Features']],
 'Land, parking & location':[['LotSizeArea','Lot area','LotSizeAreaUnits'],['LotSizeAcres','Lot area (acres)'],['LotFrontage','Lot frontage','LotSizeUnits'],['LotDepth','Lot depth','LotSizeUnits'],['Zoning','Zoning'],['ParkingSpaces','Parking spaces'],['ParkingTotal','Total parking'],['ParkingType','Parking type'],['OutsideStorageYN','Outside storage'],['Sewers','Sewers'],['Water','Water service'],['CrossStreet','Cross streets'],['CityRegion','Community']],
 'Costs & terms':[['ListPrice','Asking price / rate','ListPriceUnit','money'],['LeaseAmount','Lease amount',null,'money'],['LeaseAmountFrequency','Lease amount frequency'],['LeaseType','Lease type'],['LeaseTerm','Lease term'],['TaxAnnualAmount','Annual property taxes',null,'money'],['TaxYear','Tax year'],['TaxType','Tax basis'],['Taxes','Taxes (as supplied)',null,'money'],['TaxLegalDescription','Tax description'],['AdditionalRent','Additional rent (as supplied)',null,'money'],['TMI','TMI (as supplied)',null,'money'],['CommercialCondoFee','Commercial condo fee (as supplied)',null,'money'],['AssociationFee','Association fee',null,'money'],['AssociationFeeFrequency','Association fee frequency'],['AssociationFeeIncludes','Association fee includes'],['HSTApplicableYN','HST applicable'],['CommercialCondoFeeFrequency','Condo fee frequency'],['MinimumRentalTerm','Minimum rental term'],['MaximumRentalTerm','Maximum rental term'],['PossessionType','Possession'],['PossessionDate','Possession date'],['PossessionDetails','Possession details']]
};
export function detail(x){
 const base=normalize(x);if(!base)return null;
 const clean=v=>typeof v==='boolean'?(v?'Yes':'No'):typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'?v.slice(0,4000):Array.isArray(v)?v.filter(a=>typeof a==='string').join(', ').slice(0,4000):null;
 const sections=Object.entries(GROUPS).map(([title,fields])=>({title,rows:fields.flatMap(([field,label,unit,format])=>{if(x.InternetAddressDisplayYN!==true&&['CrossStreet','TaxLegalDescription','PossessionDetails'].includes(field))return [];const value=clean(x[field]);return value===null||value===''?[]:[{label,value,unit:unit?clean(x[unit])||'':'',format:format||''}];})}));
 // Public remarks may contain an address; honour the address-display flag conservatively.
 return {...base,sections,remarks:x.InternetAddressDisplayYN===true&&typeof x.PublicRemarks==='string'?x.PublicRemarks.slice(0,15000):'',updatedAt:typeof x.ModificationTimestamp==='string'?x.ModificationTimestamp:null};
}
export async function handle(request,env=process.env,fetcher=fetch){
 const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(request.method!=='GET')return json({error:'Method not allowed'},405);
 const p=new URL(request.url).searchParams,key=p.get('listing');
 if(!key||!/^[A-Za-z0-9_-]{1,80}$/.test(key)||[...p.keys()].some(k=>!['listing','check'].includes(k)||p.getAll(k).length!==1))return json({error:'Choose a valid listing.'},400);
 if(!env.PROPTX_TOKEN)return json({error:'Property details are not connected yet. Please contact RGJ Commercial.'},503);
 try{
  const q=queryFor(new URLSearchParams(),{allTypes:true});q.set('$top','1');q.delete('$skip');q.delete('$select');q.delete('$orderby');q.delete('$expand');q.set('$filter',q.get('$filter')+` and (ListingKey eq '${key}')`);
  const r=await fetcher('https://query.ampre.ca/odata/Property?'+q.toString().replaceAll('+','%20'),{headers:{Authorization:'Bearer '+env.PROPTX_TOKEN,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!r.ok)return json({error:'Property details are temporarily unavailable. Please try again or contact RGJ Commercial.'},502);
  const data=await r.json();if(!Array.isArray(data.value))throw Error();
  const listing=data.value[0]?.ListingKey===key?detail(data.value[0]):null;
  if(!listing)return json({error:'This listing is no longer available in the active public feed. Contact RGJ Commercial for current options.'},404);
  listing.photos=[];listing.photoStatus='available';
  if(data.value[0].InternetAddressDisplayYN===true){try{listing.photos=await loadPhotos(key,env,fetcher);}catch{listing.photoStatus='unavailable';}}
  if(p.get('check')==='1')return json({status:'connected',photoCount:listing.photos.length,photoStatus:listing.photoStatus,hasSpecifications:listing.sections.some(s=>s.rows.length>0),sectionCounts:listing.sections.map(s=>s.rows.length),hasPrice:listing.price!==null,hasBrokerage:!!listing.brokerage,addressHidden:!listing.address});
  return json({status:'connected',listing,checkedAt:new Date().toISOString()});
 }catch{return json({error:'Property details are temporarily unavailable. Please contact RGJ Commercial.'},502)}
}
export default {fetch(request){return handle(request)}};
