# RGJ Commercial Vercel migration

Source: https://github.com/johnsonrob28-ai/rgj-commercial-website, main.

The static site is prepared with vercel.json and build-vercel.mjs. The build uses Node without dependencies, writes dist, excludes repository documentation and preserves noindex until the launch review. Existing .html page links work at the domain root. Canonical and structured site URLs are rewritten using SITE_URL or Vercel's production-host environment variable.

Use the authorized account/team. Current connector scope johnsonrob28-5642 (team_LO8P72aT8LOse5QJPzGnZKjn) returned an authorization error on November 14, 2026; the owner must grant that team's access before importing or deploying. Do not create a duplicate project before checking existing projects. Use a commercial-eligible plan; do not start a paid plan or trial without the user's spending authorization.

Import this repository with the Other/framework-null preset and the checked-in build settings. Verify the deployed home, market update filters, subscriber form, contact form, legacy city/size query prefill, consent behaviour and private submission storage. Preserve existing hosting as a rollback until verified; do not change DNS or purchase a domain without a concrete approved configuration.

The subscription and inquiry forms use public visitor permissions to the existing Wix Forms backend. The public client ID is not an admin secret. No email lists, form answers, credentials or private keys belong in a deployment or in GitHub. Submission notifications are platform-managed and the inquiry email action is configured for SITE_OWNER. Custom-domain email and quarterly campaign sending remain separate setup tasks.
