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

## Quarterly report and subscriptions
- The renderer creates the latest `market-update.html` and `market-report-YYYY-qN.html` archive. Preserve previous archives.
- Include local city sections from cityMarkets and reportCities. Verify every city record against the source, preserve submarket boundaries and unavailable values.
- Branding inherits styles.css variables: charcoal #202328, copper #B17B56, ivory #F4F1ED, Orbitron monogram and Georgia/Playfair editorial headings.
- subscribe.html renders the Wix schema through newsletter.js and official Wix form-store. No subscriber details or admin keys belong in GitHub.
- Wix site c4cf1d64-759d-4e9e-870c-b9701bc61dec, form 1c47d67d-e82a-45f3-9b03-a451d0e5eefe. Four inputs including required, unchecked express email consent.
- Admin submissions: https://manage.wix.com/dashboard/c4cf1d64-759d-4e9e-870c-b9701bc61dec/wix-forms/form/1c47d67d-e82a-45f3-9b03-a451d0e5eefe/submissions
- Current verified sender: Robert Johnson, Sales Representative, Lennard Commercial Realty, Brokerage; rjohnson@lennard.com; 209-1 Yorkdale Road, Toronto ON M6A 3A1. Source: https://www.lennard.com/people/robert-johnson and https://www.lennard.com/contact (checked Nov 14 2026).
- Email distribution is NOT configured. Prepare a campaign draft only. Before any campaign, configure/verify sender and sending platform, include functional unsubscribe and sender address, exclude suppressed contacts, process withdrawal requests and obtain explicit send authorization. Do not invent account capability or send via unrelated third parties.
- Consent is specific to quarterly reports. Brokerage changes require reviewing sender identification, data permissions and consent scope; do not silently transfer records.
