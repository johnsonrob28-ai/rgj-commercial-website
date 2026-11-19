"""Generate crawlable market HTML from verified quarterly data. Python standard library only."""
from pathlib import Path
from html import escape as e
import json,re
from datetime import date
root=Path(__file__).resolve().parent
pointer=json.loads((root/'market-current.json').read_text())
d=json.loads((root/pointer['file']).read_text()); m=d['metrics']; prev=d['previous']
assert re.fullmatch(r'Q[1-4] 20\d\d',d['quarter'])
for key in ['availability','vacancy']: assert 0<=m[key]<=100
assert m['vacancy']<=m['availability']
assert m['askingNetRent']>0 and d['source']['url'].startswith('https://')
end_date=date.fromisoformat(d['periodEnd'])
period_label=f'{end_date.strftime("%B")} {end_date.day}, {end_date.year}'
base=(root/'index.html').read_text()
header=base[base.index('<header'):base.index('</header>')+9]
header=re.sub(r'\s+(?:class="active"|aria-current="page")', "", header)
header=header.replace('<a href="insights.html">', '<a href="insights.html" class="active" aria-current="page">')
footer=base[base.index('<footer'):base.index('</footer>')+9]
source=f'<a href="{e(d["source"]["url"],quote=True)}" target="_blank" rel="noopener">Colliers · {e(d["quarter"])} · pages 1 &amp; 3 ↗</a>'
def card(label,value,unit,note):
 return f'<article class="metric"><h2>{label}</h2><strong>{value}</strong><span>{unit}</span><p>{note}</p></article>'
cards=''.join([
 card('Asking net rent',f'${m["askingNetRent"]:.2f}','CAD / SF / year',f'{prev["quarter"]}: ${prev["askingNetRent"]:.2f} · change {(m["askingNetRent"]-prev["askingNetRent"]):+.2f} CAD/SF'),
 card('Availability',f'{m["availability"]:.1f}%','of tracked inventory',f'{prev["quarter"]}: {prev["availability"]:.1f}% · change {(m["availability"]-prev["availability"])*100:+.0f} bps'),
 card('Vacancy',f'{m["vacancy"]:.1f}%','of tracked inventory','Vacancy and availability measure different things.'),
 card('Net absorption',f'{m["netAbsorption"]/1e6:.2f}M','SF · quarter','Change in occupied inventory during the quarter.')])
def table(rows):
 return '<div class="table-wrap"><table><thead><tr><th scope="col">Market</th><th scope="col">Net asking rent<br>CAD / SF / year</th><th scope="col">Availability</th><th scope="col">Vacancy</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{e(r["name"])}</th><td>${r["rent"]:.2f}</td><td>{r["availability"]:.1f}%</td><td>{r["vacancy"]:.1f}%</td></tr>' for r in rows)+'</tbody></table></div>'
area_rows=''.join(f'<tr><th scope="row">{e(x["area"])}</th><td>{e(x["submarket"])}</td><td>${x["averageSalePsf"]:,.2f}</td></tr>' for x in d['areaSales'])
bars=''.join(f'<div class="bar-row"><span>{e(r["name"])}</span><div class="bar-track"><div class="bar" style="width:{r["availability"]/10*100}%"></div></div><b>{r["availability"]:.1f}%</b></div>' for r in d['regions'])
city_sections=[]
city_notes={
 'Mississauga':'Mississauga is reported as seven submarkets. Compare the relevant district rather than treating these figures as a citywide average.',
 'Brampton':'East and West Brampton have distinct availability profiles. Check the location and building specification when comparing options.',
 'Oakville':'Winston Park is a separate reporting area. Its sale-price figure is unavailable this quarter and is not replaced with another area’s value.',
 'Etobicoke':'Etobicoke is a Toronto district, presented here as a local search market. North and South are kept separate as published.',
 'Burlington':'Burlington is included in this publisher’s GTA West coverage. These indicators apply to the tracked industrial inventory.',
 'Vaughan':'Use the Vaughan benchmark alongside evidence for the building’s clear height, shipping, power and condition.',
 'Milton':'Availability can include occupied marketed space. Compare availability and vacancy separately when assessing near-term options.',
 'Caledon':'Municipal averages can reflect a changing mix of transactions. A sale-price benchmark is a starting point for a property comparison.'}
def slug(value):
 return re.sub(r'[^a-z0-9]+','-',value.lower()).strip('-')
city_sections=[]
for city in d.get('reportCities',[]):
 group=next((g for g,cities in d.get('marketGroups',{}).items() if city in cities),'Other')
 rows=[x for x in d['cityMarkets'] if x['city']==city]
 sales=[x for x in d['areaSales'] if x['area']==city]
 outer=[x for x in d.get('surroundingMarkets',[]) if x['city']==city]
 note=d.get('marketNotes',{}).get(city,city_notes.get(city,''))
 body=f'<p>{e(note)}</p>' if note else ''
 src=d['source']
 if outer:
  rows=outer;src=d['surroundingSource']
 if rows:
  body+=table(rows)
  if outer:
   body+='<p><strong>Average asking sale price: $'+format(outer[0]['askingSalePsf'],',.2f')+' / SF</strong></p><p class="small">An advertised asking-price measure from CBRE, not an achieved or closed-sale average. No verified closed-sale average is supplied here.</p>'
  elif sales:
   body+='<div class="table-wrap"><table><thead><tr><th scope="col">Reporting area</th><th scope="col">Average sale price · CAD / SF</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{e(x["submarket"])}</th><td>${x["averageSalePsf"]:,.2f}</td></tr>' for x in sales)+'</tbody></table></div>'
  else:
   body+='<p class="small">Average industrial sale price: not published for this reporting area in the verified source.</p>'
  body+=f'<p class="small">Source: <a href="{e(src["url"])}">{e(src["publisher"])} · {e(d["quarter"])} · page 3 ↗</a>. Net asking rents are CAD/SF/year; additional rent is extra. Follow the publisher’s inventory and geographic definitions.</p>'
  status='Published statistics'
 else:
  status='Municipal figures unverified'
  body+='<p>Location included in report coverage. Separate quarterly municipal rent, availability, vacancy and sale-price figures have not been verified in the sources reviewed for this edition.</p><p class="small">No neighbouring city or regional average is presented as this municipality’s own data. Request a property-specific comparison while verified local statistics are being sourced.</p>'
 body+='<a class="text-link" href="contact.html?city='+city.replace(' ','%20')+'">Discuss '+e(city)+' requirements →</a>'
 city_sections.append(f'<details class="city-report" id="city-{slug(city)}" data-market="{e(city.lower())}" data-region="{e(group)}"><summary><span>{e(city)}</span><small>{e(status)}</small></summary><div class="city-report-body">{body}</div></details>')
groups=d.get('marketGroups',{'Markets':d.get('reportCities',[])})
city_index='<nav class="market-groups" aria-label="Market coverage regions">'+''.join(f'<a href="#region-{slug(g)}">{e(g)}</a>' for g in groups)+'</nav>'
city_index+='<div class="market-filter"><label for="market-search">Find a city or town</label><input id="market-search" type="search" placeholder="Search all markets…"><label for="market-region">Region</label><select id="market-region"><option value="">All regions</option>'+''.join(f'<option>{e(g)}</option>' for g in groups)+'</select><p id="market-result-count" role="status">'+str(len(d.get('reportCities',[])))+' places covered</p></div>'
grouped_sections=''
for group,cities in groups.items():
 grouped_sections+=f'<section class="market-region-group" id="region-{slug(group)}" data-group="{e(group)}"><h3>{e(group)}</h3>'+''.join(html for html in city_sections if f'data-region="{e(group)}"' in html)+'</section>'
schema={'@context':'https://schema.org','@type':'Article','headline':'GTA Industrial Market Update — '+d['quarter'],'datePublished':d['verifiedOn'],'dateModified':d['verifiedOn'],'author':{'@type':'Organization','name':'RGJ Commercial'},'isBasedOn':d['source']['url'],'inLanguage':'en-CA'}
html=f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GTA Industrial Market Update {e(d['quarter'])} | RGJ Commercial</title><meta name="description" content="{e(d['quarter'])} GTA industrial market data: net asking rents, availability, vacancy, sales benchmarks, absorption and construction. Sources and methodology included."><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://johnsonrob28-ai.github.io/rgj-commercial-website/market-update.html"><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="market-update.css"><script type="application/ld+json">{json.dumps(schema)}</script></head><body>{header}<main>
<section class="market-hero"><div class="market-top"><span class="eyebrow">RGJ COMMERCIAL · MARKET INTELLIGENCE</span><span class="quarter">{e(d['quarter'])}</span></div><h1>GTA Industrial<br>Market Update</h1><p>Real numbers. Clear context.<br>Industrial leasing, ownership and supply across Greater Toronto and nearby markets.</p><div class="market-meta">Quarter ended {period_label} · Verified {e(d['verifiedOn'])} · All prices in CAD</div><nav class="market-jump" aria-label="Market report sections"><a href="#snapshot">Snapshot</a><a href="#regions">Regional data</a><a href="#sales">Sale prices</a><a href="#cities">City reports</a><a href="subscribe.html">Subscribe</a><a href="#methodology">Sources &amp; methodology</a></nav></section>
<section class="market-body" id="snapshot"><div class="section-heading"><div><div class="eyebrow">THE QUARTER AT A GLANCE</div><h2>Industrial market snapshot</h2></div><p class="source-line">{source}</p></div><div class="metrics">{cards}</div>
<div class="market-context"><h2>What these numbers mean</h2><p>Lower asking rents and positive absorption can occur together. A headline average does not price an individual building: clear height, shipping, power, location and lease terms still matter. Use these indicators to frame a property-specific comparison.</p></div>
<div class="supply-grid"><div><span>New supply</span><strong>{m['newSupply']/1e6:.2f}M SF</strong></div><div><span>Under construction</span><strong>{m['underConstruction']/1e6:.2f}M SF</strong></div><div><span>Available space</span><strong>{m['availableSpace']/1e6:.2f}M SF</strong></div><div><span>Sublease availability</span><strong>{m['subleaseAvailable']/1e6:.2f}M SF</strong></div></div><p class="small">Quarter-end supply metrics from Colliers, page 3. Construction is a pipeline measure, not a forecast of vacant deliveries.</p>
<section id="regions"><div class="eyebrow">LOCATION CHANGES THE PICTURE</div><h2>GTA regional comparison</h2>{table(d['regions'])}<div class="chart-panel"><h3>Availability by region</h3><p class="small">Share of tracked industrial inventory · zero-based scale, 0–10%</p>{bars}</div><h3>Selected local markets</h3>{table(d['selectedMarkets'])}<p class="small">These are the publisher’s reporting boundaries. Oakville Winston Park is separate. Mississauga, Brampton and Etobicoke are divided into multiple submarkets; no citywide average is inferred here. GTA West includes Burlington under this report’s definition.</p></section>
<section id="sales"><div class="eyebrow">OWNERSHIP &amp; TRANSACTION EVIDENCE</div><h2>Industrial sale-price benchmarks</h2><div class="sale-benchmarks"><div><span>Freehold · 15,000+ SF</span><strong>${m['freeholdSalePsf']:,}<small> / SF</small></strong></div><div><span>Condo / strata</span><strong>${m['condoSalePsf']:,}<small> / SF</small></strong></div></div><p>Published GTA benchmarks from Colliers, page 1. Ownership types are separate. These are not average total purchase prices or valuations for a particular size range.</p><h3>Average industrial sale price by area</h3><p>Published average sale prices per square foot for GTA areas and submarkets. These figures describe reported sales, not asking prices or average total building prices.</p><div class="table-wrap"><table><thead><tr><th scope="col">Area</th><th scope="col">Reporting submarket</th><th scope="col">Average sale price<br>CAD / SF</th></tr></thead><tbody>{area_rows}</tbody></table></div><p class="small">Source: Colliers, {e(d['quarter'])}, page 3. Mississauga, Brampton and Etobicoke are split as published; a citywide average cannot be calculated from submarket averages without sales weights. Oakville Winston Park has no published sale-price value for this quarter. Transaction counts are not disclosed in this table. Differences may reflect the mix of properties sold; figures are not adjusted for building size, ownership type or condition.</p></section>
<section id="cities"><div class="eyebrow">LOCAL MARKET REPORTS</div><h2>Industrial markets across the GTA &amp; beyond</h2><p>All 25 GTA municipalities, Toronto district views and selected surrounding industrial markets. Open a location for source-labelled figures or its current data-coverage status.</p>{city_index}{grouped_sections}</section>\n<section id="methodology"><div class="eyebrow">TRANSPARENT BY DESIGN</div><h2>Sources, definitions &amp; quarterly updates</h2><details open><summary>How this dashboard is sourced</summary><p>Primary series: {source}. Research publication: {e(d['source']['published'])}. Coverage expanded {e(d.get("coverageVerifiedOn",d["verifiedOn"]))}. Surrounding-city statistics from <a href="{e(d["surroundingSource"]["url"])}">CBRE’s {e(d["quarter"])} Waterloo Region report</a> remain a separate series; CBRE sale prices are asking prices. Selected published statistics are summarized here; the full report remains with its publisher. RGJ Commercial’s explanatory text is separate from the source data.</p><p>Cross-check: <a href="{e(d['crosscheck']['url'])}">CBRE’s {e(d['quarter'])} report</a> reports {d['crosscheck']['availability']:.1f}% availability. That is a separate series with different coverage and methodology—not a replacement value or a blended average.</p></details>
<details><summary>Asking rent, availability and vacancy</summary><p>Net asking rent is the advertised base rent before additional rent, taxes and operating costs; it is not an achieved lease rate. Availability includes marketed space that can still be occupied. Vacancy measures space recorded as vacant. Follow each publisher’s full definitions when comparing reports.</p></details>
<details><summary>How to read sale prices by area</summary><p>Sale prices are shown in CAD per building square foot using the publisher’s average-sale-price column. They are not average total purchase prices. Mississauga, Brampton and Etobicoke retain the publisher’s reporting subdivisions. Submarket averages are not combined into municipal averages without transaction weights.</p><p>A quarter with a different mix of condos, freehold buildings, investment properties or building sizes can produce a different average even when comparable property values have not moved. Compare the same geography and methodology over time, and use property-specific evidence for pricing decisions. A missing published value is unavailable, not zero.</p></details>
<details><summary>Quarterly refresh policy</summary><p>Check for new reports after each quarter closes. Keep the last verified quarter visible until a newer source is verified; never relabel old numbers. Archive each quarter’s data and record its source, publication and verification dates. No live MLS feed is required for these public-report summaries.</p></details></section>
<section class="market-cta"><h2>Receive the next quarterly report.</h2><p>Get the GTA overview and city-by-city industrial market update in your inbox.</p><a class="cta" href="subscribe.html">Subscribe to quarterly updates →</a><div class="report-actions"><button class="cta" onclick="window.print()">Print / save report as PDF</button><a href="market-report-{d['quarter'].split()[1]}-{d['quarter'].split()[0].lower()}.html">View this quarter’s archived report →</a></div><h2>Put the market in context for your building.</h2><p>Compare your location, building size and operational requirements with relevant property evidence.</p><a class="cta" href="contact.html">Discuss your property requirements →</a><p class="small">Submit your property requirements through the contact form, or call or email Robert directly.</p></section></section></main>{footer}<script src="market-locations.js?v=20261114-1" defer></script></body></html>'''

# --- Sources live in one collapsed drawer at the bottom (Rob's request, Nov 18, 2026). ---
import re as _re
def tuck_sources(page):
  page=_re.sub(r'<p class="source-line">.*?</p>','',page,flags=_re.S)
  page=_re.sub(r'Source: (?:<a [^>]*>.*?</a>|[^.<]*?page \d+)\.\s*','',page)
  page=_re.sub(r'\s+from (?:Colliers|CBRE)(?:, page \d+)?(?=[.,])','',page)
  page=page.replace('Open a location for source-labelled figures or its current data-coverage status.','Open a location for its figures or current data-coverage status.')
  page=page.replace('<p class="small"></p>','').replace(' in the verified source.','.')
  page=_re.sub(r'<a [^>]*href="#methodology"[^>]*>[^<]*</a>','',page)
  m=_re.search(r'<section id="methodology">.*?</section>\n',page,_re.S)
  if m:
    block=m.group(0).replace('<details open>','<details>')
    block=block.replace('<section id="methodology">','<details class="sources-drawer" id="methodology"><summary>Sources &amp; methodology</summary><section>').replace('</section>\n','</section></details>')
    page=page.replace(m.group(0),'')
    page=page.replace('</section></section></main>','</section>'+block+'</section></main>',1)
  style='<style>.sources-drawer{max-width:1180px;margin:40px auto 10px;border-top:1px solid #ded8d1;border-bottom:1px solid #ded8d1;padding:14px 0}.sources-drawer>summary{cursor:pointer;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#575D64;list-style:none}.sources-drawer>summary::-webkit-details-marker{display:none}.sources-drawer>summary::before{content:"\\25B8";display:inline-block;margin-right:8px;transition:transform .2s}.sources-drawer[open]>summary::before{transform:rotate(90deg)}.sources-drawer section{padding:18px 0 0;font-size:13px}.sources-drawer h2{font-size:20px}</style>'
  page=page.replace('</head>',style+'</head>',1)
  return page
html=tuck_sources(html)
(root/'market-update.html').write_text(html)
archive='market-report-'+d['quarter'].split()[1]+'-'+d['quarter'].split()[0].lower()+'.html'
(root/archive).write_text(html.replace('/market-update.html','/'+archive))
print('Generated market-update.html and', archive, 'from',pointer['file'])
