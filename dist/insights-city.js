// City filter for the Market Insight snapshot. Reads the current verified quarter from market-current.json,
// so it updates automatically when the quarterly data file changes. Shows published submarket figures only;
// never averages submarkets into an invented citywide value.
(function () {
  const CITIES = ['Mississauga', 'Brampton', 'Etobicoke', 'Oakville', 'Burlington', 'Vaughan', 'North York', 'Caledon'];
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
  const buttons = ['All GTA', ...CITIES].map(name => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'city-btn';
    b.textContent = name;
    b.dataset.city = name === 'All GTA' ? '' : name;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => select(b.dataset.city, true));
    bar.appendChild(b);
    return b;
  });

  function card(title, value, note) {
    return `<article class="snapshot-card"><h2>${title}</h2><p class="snapshot-value">${value || NA}</p><p class="snapshot-description">${note}</p></article>`;
  }

  function render(city) {
    const lease = data.cityMarkets.filter(x => x.city === city);
    const sales = data.areaSales.filter(x => x.area === city);
    const saleFor = name => (sales.find(s => s.submarket === name) || {}).averageSalePsf;
    const note = (data.marketNotes && data.marketNotes[city]) ? `<p class="city-note">${esc(data.marketNotes[city])}</p>` : '';
    let body;
    if (lease.length === 1) {
      const m = lease[0];
      const sale = saleFor(m.name) ?? (sales.length === 1 ? sales[0].averageSalePsf : undefined);
      body = `<div class="snapshot-grid city-grid">` +
        card('Average sale price', sale ? `${money(sale)}<small> / SF</small>` : null, 'Average sale price per building SF<br>CAD') +
        card('Average net asking rent', m.rent ? `${money(m.rent)}<small> / SF</small>` : null, 'CAD / SF / year<br>Additional rent is extra') +
        card('Vacancy rate', pct(m.vacancy), 'Vacant industrial space') +
        card('Availability rate', pct(m.availability), 'Includes marketed occupied space') +
        `</div>`;
    } else {
      const rows = lease.map(m => `<tr><th scope="row">${esc(m.name)}</th><td>${money(m.rent) || NA}</td><td>${pct(m.vacancy) || NA}</td><td>${pct(m.availability) || NA}</td><td>${money(saleFor(m.name)) || NA}</td></tr>`).join('');
      body = `<p class="city-intro">${esc(city)} is reported by submarket. Figures are shown as published; they are not combined into a citywide average.</p>` +
        `<div class="city-table-wrap"><table class="city-table"><thead><tr><th scope="col">Submarket</th><th scope="col">Net asking rent<br><small>CAD / SF / yr</small></th><th scope="col">Vacancy</th><th scope="col">Availability</th><th scope="col">Avg sale price<br><small>CAD / SF</small></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    panel.innerHTML = `<div class="city-head"><div class="eyebrow">${esc(data.quarter)} · ${esc(city)}</div><h2>${esc(city)} Industrial Market</h2></div>${body}${note}` +
      `<p class="snapshot-footnote">Source: <a href="${esc(data.source.url)}" target="_blank" rel="noopener">${esc(data.source.publisher)} · ${esc(data.source.title)}</a>. Cap rates are published for the Toronto market only; select All GTA to view them. ` +
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
