# Quarterly GTA industrial data workflow

Current dashboard: market-update.html. Entry point: Insights. Renderer: render-market.py (Python 3, no packages).

1. Find the latest published quarterly Colliers Toronto Industrial report. Read the original report, not search snippets alone. Keep CBRE as a separately labelled cross-check, not a replacement series.
2. Verify period, CAD units, tracked geography, asking versus achieved rents, vacancy versus availability, sale ownership type and SF measures. Do not infer exact values from chart positions.
3. Create a new market-data-YYYY-qN.json, retaining earlier files. Record source URL, publication, period-end and actual verification dates. Update market-current.json only after verification. Unknown values must remain unavailable, never zero or an old quarter's data under a new label.
4. Update any period-specific commentary, comparisons and selected local-market caveats. Run python render-market.py. The resulting page includes numbers in HTML so it does not depend on a browser fetch for indexing.
5. Keep source summaries brief; link original reports. Do not reproduce entire proprietary reports or charts. No affiliation with the research publisher is implied.
6. Verify numeric units and source values, table completeness, responsive display, links and generator output. Commit the JSON, generator and generated HTML. Vercel deploys main to rgjcommercial.com.
7. Notify Rob with source links and changes. If publication access or new reports are unavailable, leave the prior verified quarter and date unchanged and report the blocker.

## Average sale prices by area

Use areaSales objects with area, submarket and averageSalePsf, drawn from the source report’s average-sale-price PSF column. Keep Mississauga, Brampton and Etobicoke reporting subdivisions as published. Do not average submarket averages to invent citywide values. Missing source values stay unavailable. Display CAD/SF, source/quarter and transaction-mix caveats; do not call these average total building prices or asking prices. Keep all size-band sale tables removed unless Rob explicitly requests them again.

## Hosting and SEO

Launched November 18, 2026 on Vercel at https://rgjcommercial.com (deploys from main). Pages are indexable; canonicals point to rgjcommercial.com; sitemap.xml lists public pages (regenerate when pages are added). property.html stays noindex as a listing template. Quarterly tasks do not bypass publication/access permissions or automatically approve commercial data licensing.

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

## Expanded coverage and contact inquiries (November 14, 2026)
- marketGroups is the complete coverage registry: all 25 GTA municipalities plus Toronto district views and selected surrounding markets. Keep groups, cityMarkets, surroundingMarkets and reportCities consistent.
- Surrounding-city CBRE figures are separate from Colliers. askingSalePsf is ASKING, never a closed-sale average. Hamilton's figures are explicitly Greater Hamilton Area. Unverified municipal statistics remain unavailable, never inferred from a neighbour or region.
- market-locations.js filters the crawlable server-generated city sections. Keep the print view complete.
- Contact form: 7f41cd89-d316-4ce8-a651-9919b20b9810. Contact-inquiry.js renders the live schema and submits to private Wix Forms. It replaces the old download-only requirement brief; existing query links prefill city, transaction and size.
- Notification automation 81366d74-d5ef-4dc0-92c3-144de096862b is platform-created, ACTIVE, typed recipient SITE_OWNER. Delivery to a specific inbox has not been independently confirmed.
- Do not add contact inquirers to marketing without separate consent. Do not export PII into the repository.


## Industrial investment cap rates — Insights
- Added Q3 2026 Toronto-market Colliers industrial ranges, page 5: Class A 5.25–6.00%; Class B 5.50–6.25%.
- Source: https://www.collierscanada.com/en-ca/research/canada-cap-rate-report-q3-2026
- Original PDF: https://www.collierscanada.com/-/media/files/canada/research/2026/national/q3-cap-rate-report-2026-en-v2.ashx?sc_lang=en-ca
- Published 2026-10-22; verified 2026-11-14.
- Calculated range midpoints: 5.63% and 5.88% (half-up rounding). These are NOT actual-sale averages. No verified transaction average or municipal cap-rate series is supplied. Do not relabel midpoints as average sale cap rates.
- Stored under industrialCapRates in market-data-2026-q3.json; displayed in insights.html with insights.css.
- Future quarterly refreshes must verify the same publisher/geography/class definitions, update both the structured data and Insights section, and preserve archives. Do not relabel older cap-rate data when updating a newer leasing quarter.
