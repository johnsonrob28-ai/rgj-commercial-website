/* Public display configuration only. Never put MLS credentials here. */
(async () => {
  const slot = document.getElementById('approved-mls-search');
  const status = document.getElementById('mls-status');
  if (!slot || !status) return;
  try {
    const response = await fetch('idx-search-config.json', {cache: 'no-store'});
    if (!response.ok) return;
    const config = await response.json();
    if (config.enabled !== true || config.brokerageApproved !== true ||
        config.commercialCoverageConfirmed !== true || config.productionHostApproved !== true) return;
    const url = new URL(config.approvedSearchUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return;
    const link = document.createElement('a');
    link.href = url.href;
    link.className = 'cta';
    link.textContent = 'Open Toronto MLS Industrial Search';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    slot.appendChild(link);
    if (config.allowEmbedding === true) {
      const frame = document.createElement('iframe');
      frame.src = url.href;
      frame.title = 'Toronto MLS industrial properties for sale and lease';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.style.cssText = 'display:block;width:100%;min-height:850px;border:0;margin-top:24px';
      slot.appendChild(frame);
    }
    slot.hidden = false;
    status.textContent = 'Search active industrial listings using our approved listing provider. If the embedded search does not load, use the search link.';
    document.getElementById('mls-integration-slot').dataset.status = 'connected';
    document.querySelectorAll('[data-demo-search]').forEach(el => el.hidden = true);
  } catch {
    // Keep the clearly labelled demo available if configuration cannot be loaded.
  }
})();
