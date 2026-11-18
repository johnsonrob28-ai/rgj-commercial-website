// City filter for the Market Insight snapshot. Reads the current verified quarter from market-current.json,
// so it updates automatically when the quarterly data file changes.
// Cities reported by several submarkets show a simple (unweighted) average of the published submarket
// figures, at Rob's request (Nov 18, 2026). Each card says so; unpublished values are skipped, never zero.
(function () {
  const CITIES = ['Mississauga', 'Brampton', 'Etobicoke', 'Oakville', 'Burlington', 'Vaughan', 'North York', 'Caledon', 'Milton'];
  const bar = document.getElementById('city-filter');
  const gta = document.getElementById('gta-snapshot');
  const panel = document.getElementById('city-snapshot');
  if (!bar || !gta || !panel) return;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const money = n => (typeof n === 'number') ? '$' + n.toFixed(2) : null;
  const pct = n => (typeof n === 'number') ? n.toFixed(1) + '%' : null;
  const NA = '<span class="city-na">Not published</span>';

  let data = null;
  const buttons = ['GTA', ...CITIES].map(name => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'city-btn';
    b.textContent = name;
    b.dataset.city = name === 'GTA' ? '' : name;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => select(b.dataset.city, true));
    bar.appendChild(b);
    return b;
  });

  function card(title, value, note) {
    return `<article class="snapshot-card"><h2>${title}</h2><p class="snapshot-value">${value || NA}</p><p class="snapshot-description">${note}</p></article>`;
  }

  const avg = xs => { const v = xs.filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

  function render(city) {
    const lease = data.cityMarkets.filter(x => x.city === city);
    const sales = data.areaSales.filter(x => x.area === city && typeof x.averageSalePsf === 'number');
    const many = lease.length > 1;
    const basis = n => n > 1 ? `Average of ${n} published submarkets` : 'Published figure';
    const sale = avg(sales.map(x => x.averageSalePsf));
    const rent = avg(lease.map(x => x.rent));
    const vac = avg(lease.map(x => x.vacancy));
    const avail = avg(lease.map(x => x.availability));
    const caps = (data.industrialCapRates && data.industrialCapRates.classes) || [];
    const capRows = caps.map(c => `<div class="snapshot-cap-row"><span>${esc(c.name.replace(/ industrial$/i, ''))}</span><strong>${c.low.toFixed(2)}–${c.high.toFixed(2)}%</strong></div>`).join('');
    const subs = many ? `<p class="city-intro">${esc(city)} figures average Colliers' published submarkets: ${lease.map(m => esc(m.name)).join(', ')}.</p>` : '';
    panel.innerHTML = `<div class="city-head"><div class="eyebrow">${esc(data.quarter)} · ${esc(city)}</div><h2>${esc(city)} Industrial Market</h2></div>${subs}` +
      `<div class="snapshot-grid">` +
      card('Average sale price', sale != null ? `${money(sale)}<small> / SF</small>` : null, `CAD per building square foot<br>${basis(sales.length)}`) +
      card('Average net asking rent', rent != null ? `${money(rent)}<small> / SF</small>` : null, `CAD / SF / year · additional rent is extra<br>${basis(lease.length)}`) +
      card('Vacancy rate', vac != null ? pct(vac) : null, `Vacant industrial space<br>${basis(lease.length)}`) +
      card('Availability rate', avail != null ? pct(avail) : null, `Includes marketed occupied space<br>${basis(lease.length)}`) +
      `<article class="snapshot-card snapshot-cap"><h2>Industrial cap rates</h2>${capRows || NA}<p class="snapshot-description">Toronto investment market<br>Published GTA-wide; no city figure</p></article>` +
      `</div>` +
      `<p class="snapshot-footnote">Source: <a href="${esc(data.source.url)}" target="_blank" rel="noopener">${esc(data.source.publisher)} · ${esc(data.source.title)}</a>${caps.length ? ` and <a href="${esc(data.industrialCapRates.source.url)}" target="_blank" rel="noopener">${esc(data.industrialCapRates.source.publisher)} · ${esc(data.industrialCapRates.source.title)}</a>` : ''}. ` +
      (many ? 'City figures are simple averages of the published submarket figures, not a citywide figure published by Colliers. ' : '') +
      `<a href="market-update.html#city-${slug(city)}">Full ${esc(city)} report →</a> · <a href="properties.html?city=${encodeURIComponent(city)}&type=Industrial">Search ${esc(city)} listings →</a></p>`;
  }

  function select(city, push) {
    if (city && !CITIES.includes(city)) city = '';
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.city === city)));
    if (!city || !data) {
      gta.hidden = false; panel.hidden = true;
    } else {
      render(city); gta.hidden = true; panel.hidden = false;
    }
    if (push) {
      const u = new URL(location.href);
      if (city) u.searchParams.set('city', city); else u.searchParams.delete('city');
      history.replaceState(null, '', u);
    }
  }

  fetch('market-current.json', {cache: 'no-cache'})
    .then(r => r.json())
    .then(p => fetch(p.file, {cache: 'no-cache'}))
    .then(r => r.json())
    .then(d => { data = d; select(new URLSearchParams(location.search).get('city') || '', false); })
    .catch(() => { bar.hidden = true; });
})();
