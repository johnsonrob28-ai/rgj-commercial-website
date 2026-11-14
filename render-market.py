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
header=header.replace('class="active"','').replace('<a href="insights.html">Insights</a>','<a href="market-update.html" aria-current="page">Market Update</a>')
footer=base[base.index('<footer'):base.index('</footer>')+9]
source=f'<a href="{e(d["source"]["url"],quote=True)}" target="_blank" rel="noopener">Colliers · {e(d["quarter"])} · pages 1 &amp; 3 ↗</a>'
def card(label,value,unit,note):
 return f'<article class="metric"><h2>{label}</h2><strong>{value}</strong><span>{unit}</span><p>{note}</p></article>'
cards=''.join([
 card('Asking net rent',f'${m["askingNetRent"]:.2f}','CAD / SF / year',f'{prev["quarter"]}: ${prev["askingNetRent"]:.2f} · change −${prev["askingNetRent"]-m["askingNetRent"]:.2f}'),
 card('Availability',f'{m["availability"]:.1f}%','of tracked inventory',f'{prev["quarter"]}: {prev["availability"]:.1f}% · change {(m["availability"]-prev["availability"])*100:+.0f} bps'),
 card('Vacancy',f'{m["vacancy"]:.1f}%','of tracked inventory','Vacancy and availability measure different things.'),
 card('Net absorption',f'{m["netAbsorption"]/1e6:.2f}M','SF · quarter','Change in occupied inventory during the quarter.')])
def table(rows):
 return '<div class="table-wrap"><table><thead><tr><th scope="col">Market</th><th scope="col">Net asking rent<br>CAD / SF / year</th><th scope="col">Availability</th><th scope="col">Vacancy</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{e(r["name"])}</th><td>${r["rent"]:.2f}</td><td>{r["availability"]:.1f}%</td><td>{r["vacancy"]:.1f}%</td></tr>' for r in rows)+'</tbody></table></div>'
sales=d.get('sizeBandSales')
band_rows=[]
for lo,hi in d['sizeBands']:
 label=f'{lo:,}–{hi:,} SF' if hi else f'{lo:,}+ SF'
 entry=next((x for x in (sales or []) if x['minSf']==lo and x['maxSf']==hi),None)
 if entry and entry['count']>=5:
  cells=f"<td>${entry['averageSalePrice']:,.0f}</td><td>${entry['weightedPsf']:,.2f}</td><td>{entry['count']}</td>"
 elif entry:
  cells=f"<td>Insufficient sample</td><td>Insufficient sample</td><td>{entry['count']}</td>"
 else:
  cells='<td>Not available</td><td>Not available</td><td>Not available</td>'
 band_rows.append(f'<tr><th scope="row">{label}</th>{cells}</tr>')
bands=''.join(band_rows)
bars=''.join(f'<div class="bar-row"><span>{e(r["name"])}</span><div class="bar-track"><div class="bar" style="width:{r["availability"]/10*100}%"></div></div><b>{r["availability"]:.1f}%</b></div>' for r in d['regions'])
schema={'@context':'https://schema.org','@type':'Article','headline':'GTA Industrial Market Update — '+d['quarter'],'datePublished':d['verifiedOn'],'dateModified':d['verifiedOn'],'author':{'@type':'Organization','name':'RGJ Commercial'},'isBasedOn':d['source']['url'],'inLanguage':'en-CA'}
html=f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GTA Industrial Market Update {e(d['quarter'])} | RGJ Commercial</title><meta name="description" content="{e(d['quarter'])} GTA industrial market data: net asking rents, availability, vacancy, sales benchmarks, absorption and construction. Sources and methodology included."><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://johnsonrob28-ai.github.io/rgj-commercial-website/market-update.html"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="market-update.css"><script type="application/ld+json">{json.dumps(schema)}</script></head><body>{header}<main>
<section class="market-hero"><div class="market-top"><span class="eyebrow">RGJ COMMERCIAL · MARKET INTELLIGENCE</span><span class="quarter">{e(d['quarter'])}</span></div><h1>GTA Industrial<br>Market Update</h1><p>Real numbers. Clear context.<br>Industrial leasing, ownership and supply across Greater Toronto.</p><div class="market-meta">Quarter ended {period_label} · Verified {e(d['verifiedOn'])} · All prices in CAD</div><nav class="market-jump" aria-label="Market report sections"><a href="#snapshot">Snapshot</a><a href="#regions">Regional data</a><a href="#sales">Sale prices</a><a href="#methodology">Sources &amp; methodology</a></nav></section>
<section class="market-body" id="snapshot"><div class="section-heading"><div><div class="eyebrow">THE QUARTER AT A GLANCE</div><h2>Industrial market snapshot</h2></div><p class="source-line">{source}</p></div><div class="metrics">{cards}</div>
<div class="market-context"><h2>What these numbers mean</h2><p>Lower asking rents and positive absorption can occur together. A headline average does not price an individual building: clear height, shipping, power, location and lease terms still matter. Use these indicators to frame a property-specific comparison.</p></div>
<div class="supply-grid"><div><span>New supply</span><strong>{m['newSupply']/1e6:.2f}M SF</strong></div><div><span>Under construction</span><strong>{m['underConstruction']/1e6:.2f}M SF</strong></div><div><span>Available space</span><strong>{m['availableSpace']/1e6:.2f}M SF</strong></div><div><span>Sublease availability</span><strong>{m['subleaseAvailable']/1e6:.2f}M SF</strong></div></div><p class="small">Quarter-end supply metrics from Colliers, page 3. Construction is a pipeline measure, not a forecast of vacant deliveries.</p>
<section id="regions"><div class="eyebrow">LOCATION CHANGES THE PICTURE</div><h2>GTA regional comparison</h2>{table(d['regions'])}<div class="chart-panel"><h3>Availability by region</h3><p class="small">Share of tracked industrial inventory · zero-based scale, 0–10%</p>{bars}</div><h3>Selected local markets</h3>{table(d['selectedMarkets'])}<p class="small">These are the publisher’s reporting boundaries. Oakville Winston Park is separate. Mississauga, Brampton and Etobicoke are divided into multiple submarkets; no citywide average is inferred here. GTA West includes Burlington under this report’s definition.</p></section>
<section id="sales"><div class="eyebrow">OWNERSHIP &amp; TRANSACTION EVIDENCE</div><h2>Industrial sale-price benchmarks</h2><div class="sale-benchmarks"><div><span>Freehold · 15,000+ SF</span><strong>${m['freeholdSalePsf']:,}<small> / SF</small></strong></div><div><span>Condo / strata</span><strong>${m['condoSalePsf']:,}<small> / SF</small></strong></div></div><p>Published GTA benchmarks from Colliers, page 1. Ownership types are separate. These are not average total purchase prices or valuations for a particular size range.</p><h3>Sale prices by building size</h3><p>The report does not publish these exact size bands. A verified closed-sale dataset is required before values can be calculated.</p><div class="table-wrap"><table><thead><tr><th scope="col">Building size</th><th scope="col">Average sale price</th><th scope="col">Weighted sale $ / SF</th><th scope="col">Verified sales</th></tr></thead><tbody>{bands}</tbody></table></div><p class="small">“Not available” does not mean zero sales. Never apply the GTA-wide benchmark to each band and present the result as an observed average.</p></section>
<section id="methodology"><div class="eyebrow">TRANSPARENT BY DESIGN</div><h2>Sources, definitions &amp; quarterly updates</h2><details open><summary>How this dashboard is sourced</summary><p>Primary series: {source}. Research publication: {e(d['source']['published'])}. Selected published statistics are summarized here; the full report remains with its publisher. RGJ Commercial’s explanatory text is separate from the source data.</p><p>Cross-check: <a href="{e(d['crosscheck']['url'])}">CBRE’s {e(d['quarter'])} report</a> reports {d['crosscheck']['availability']:.1f}% availability. That is a separate series with different coverage and methodology—not a replacement value or a blended average.</p></details>
<details><summary>Asking rent, availability and vacancy</summary><p>Net asking rent is the advertised base rent before additional rent, taxes and operating costs; it is not an achieved lease rate. Availability includes marketed space that can still be occupied. Vacancy measures space recorded as vacant. Follow each publisher’s full definitions when comparing reports.</p></details>
<details><summary>How size-band sales will be calculated</summary><p>Use closed industrial building sales within a documented GTA boundary and reporting quarter, with verified prices and building areas. Separate freehold from condo/strata, remove duplicates and flag portfolios, partial interests, land and sale-leasebacks. Show sample counts and exclude records with missing or unreliable pricing or area.</p><p>Average sale price = total consideration ÷ valid sale count. Weighted sale $/SF = total consideration ÷ total building SF. These answer different questions. Use lower-inclusive, upper-exclusive bands (20,000 SF goes in 20,000–30,000 SF). Suppress small samples below five verified sales, or clearly label them insufficient. Public IDX access alone is not assumed to include sold-data or analytical publication rights.</p></details>
<details><summary>Quarterly refresh policy</summary><p>Check for new reports after each quarter closes. Keep the last verified quarter visible until a newer source is verified; never relabel old numbers. Archive each quarter’s data and record its source, publication and verification dates. No live MLS feed is required for these public-report summaries.</p></details></section>
<section class="market-cta"><h2>Put the market in context for your building.</h2><p>Compare your location, building size and operational requirements with relevant property evidence.</p><a class="cta" href="contact.html">Prepare a property requirement →</a><p class="small">The current contact page creates a local requirement brief; it does not submit an inquiry.</p></section></section></main>{footer}</body></html>'''
(root/'market-update.html').write_text(html)
print('Generated market-update.html from',pointer['file'])
