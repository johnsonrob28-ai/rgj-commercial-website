# Direct PropTx IDX integration

Agreement: 1890001. Domain: https://rgjcommercial.com. Subscriber: Robert Johnson; brokerage: Lennard Commercial Realty. Vendor: Robert Johnson. User supplied accepted agreement on 2026-11-17.

## Runtime

Vercel reads PROPTX_TOKEN as a production Secret. Never copy it into source, browser code, logs or documentation. The server in api/proptx.mjs is the only code calling the authenticated feed. No IDX Broker subscription is used.

Only active industrial sale/lease listings, participating display permissions, selected GTA/surrounding cities and explicitly selected public fields are queried. Building size uses BuildingAreaTotal/BuildingAreaUnits, not land area. Results are limited to 20 per page and at most 100 per search. Responses are no-store, so each request rechecks the feed; an error does not show stale or fictional listings. Listing brokerages appear inside each card. Address display permissions are respected.

A check=1 query returns validation counts and booleans without listing content, suitable for verification without importing MLS records into AI. Arbitrary upstream filters, URL targets, resource paths and field lists are not accepted.

The interface is properties.html + live-search.js + live-search.css. Existing city links pass city/deal/size via query strings. General lead capture remains on the existing contact page. All existing noindex settings remain until the user requests launch.

Vercel logs record pseudonymous daily viewer hashes and filter selections for the agreement's access audit requirement. Review log retention and monitoring before broad marketing. No token, listing content or consumer contact details are logged.

## Maintenance

Run node --test tests/proptx.test.mjs and node build-vercel.mjs. Use the approved current agreement to maintain attribution, refresh, removal, security, privacy and display requirements. A brokerage change requires a new agreement and new Broker of Record approval. Do not send MLS listing records or derived content to an AI system without PropTx's written authorization. Tokens remain private in the user's Vercel account.
