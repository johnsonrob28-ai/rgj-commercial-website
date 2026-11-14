# RGJ Commercial: Toronto MLS activation

Status: prepared, not connected. No provider subscription or data agreement has been purchased or signed.

## Provider verification before purchase

IDX Broker lists PropTx coverage: https://www.idxbroker.com/canada/proptx-proptx
Ask the provider to confirm in writing:

- Active TRREB/PropTx commercial industrial sale and lease listings, restricted to the approved Toronto feed scope (not a CREA-wide subscription).
- Mississauga, Brampton, Oakville, Etobicoke, Burlington and Vaughan coverage.
- Building area in square feet, with ranges 10–20k, 20–30k, 30–50k, 50–70k, 70–100k, 100–120k, 120–150k and 150k+, using the building-area field, not lot area.
- Provider-hosted HTTPS search link and whether iframe embedding is supported on the final domain. Do not invent filter URL parameters.
- Map/mobile search, lead routing, privacy/consent controls, accessible results, attribution and required brokerage disclosures.
- Total initial, recurring, board/data and cancellation costs.

## Approval and activation

1. Confirm current employing brokerage and Broker of Record authorization.
2. Complete the applicable PropTx IDX data agreement with the provider designated. Source: https://webapp.proptx.ca/oas/common/IDX_Data_Feed.jsp
3. Register/approve the final production domain and hosting. GitHub Pages remains a preview; move production hosting before enabling the integration. Cloudflare Pages is a candidate with a free static tier; account connection and final domain setup remain pending.
4. Obtain the provider-issued search URL and confirmed supported filters. Do not put API keys or login credentials in this public repository.
5. In idx-search-config.json set approvedSearchUrl and the approval flags only after the respective approvals are complete. Set allowEmbedding only with provider permission. Set enabled last.
6. Test provider results, filters, mobile display, fallback link, attribution, lead notifications and withdrawn listing handling. The local demo filters do not control the provider search; configure the provider search separately.

The legacy TRREB IDX Frame page says the service will be discontinued: https://webapp.proptx.ca/oas/common/IDX_Frame.jsp

## Remaining launch work

- Confirm active email, brokerage details and privacy content.
- Replace Wix canonical/structured-data URLs with final production URLs across all pages.
- Keep noindex until launch checks pass, then generate the production sitemap and submit it to search engines.
- Hosted iframe content does not become crawlable listing content on the parent page automatically. Retain useful city and advisory content.
