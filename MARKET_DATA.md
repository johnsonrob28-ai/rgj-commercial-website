# Quarterly GTA industrial data workflow

Current dashboard: market-update.html. Entry point: Insights. Renderer: render-market.py (Python 3, no packages).

1. Find the latest published quarterly Colliers Toronto Industrial report. Read the original report, not search snippets alone. Keep CBRE as a separately labelled cross-check, not a replacement series.
2. Verify period, CAD units, tracked geography, asking versus achieved rents, vacancy versus availability, sale ownership type and SF measures. Do not infer exact values from chart positions.
3. Create a new market-data-YYYY-qN.json, retaining earlier files. Record source URL, publication, period-end and actual verification dates. Update market-current.json only after verification. Unknown values must remain unavailable, never zero or an old quarter's data under a new label.
4. Update any period-specific commentary, comparisons and selected local-market caveats. Run python render-market.py. The resulting page includes numbers in HTML so it does not depend on a browser fetch for indexing.
5. Keep source summaries brief; link original reports. Do not reproduce entire proprietary reports or charts. No affiliation with the research publisher is implied.
6. Verify numeric units and source values, table completeness, responsive display, links and generator output. Commit the JSON, generator and generated HTML. The repository's current Pages deployment follows main.
7. Notify Rob with source links and changes. If publication access or new reports are unavailable, leave the prior verified quarter and date unchanged and report the blocker.

## Average sale prices by area

Use areaSales objects with area, submarket and averageSalePsf, drawn from the source report’s average-sale-price PSF column. Keep Mississauga, Brampton and Etobicoke reporting subdivisions as published. Do not average submarket averages to invent citywide values. Missing source values stay unavailable. Display CAD/SF, source/quarter and transaction-mix caveats; do not call these average total building prices or asking prices. Keep all size-band sale tables removed unless Rob explicitly requests them again.

## Hosting and SEO

The site remains a pre-launch GitHub Pages preview, noindex. Final domain, production host, correct canonical URLs across all pages, live lead routing and launch review remain outstanding. Quarterly tasks do not bypass publication/access permissions or automatically approve commercial data licensing.
