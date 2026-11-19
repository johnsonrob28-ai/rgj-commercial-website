// Address autocomplete for the contact form's location field.
// Suggestions come from Photon (OpenStreetMap data, no API key), biased to the GTA and limited to Ontario,
// with the Government of Canada geolocator as a fallback. Typing a manual address always works:
// a lookup failure never blocks the form.
const BBOX = '-80.9,42.8,-78.2,44.6'; // Greater Golden Horseshoe
const MIN_CHARS = 3;

function label(p) {
  const street = [p.housenumber, p.street || (p.type === 'street' ? p.name : '')].filter(Boolean).join(' ');
  const place = p.type !== 'street' && p.type !== 'house' && p.name && p.name !== p.street ? p.name : '';
  const city = p.city || p.town || p.village || p.district || p.county || '';
  const parts = [place, street, city, p.state === 'Ontario' ? 'ON' : p.state, p.postcode].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

async function photon(query, signal) {
  const url = new URL('https://photon.komoot.io/api/');
  url.search = new URLSearchParams({ q: query, limit: '8', lang: 'en', lat: '43.65', lon: '-79.55', bbox: BBOX });
  const res = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error('photon ' + res.status);
  const data = await res.json();
  return (data.features || [])
    .map(f => f.properties || {})
    .filter(p => p.countrycode === 'CA' && (!p.state || p.state === 'Ontario'))
    .filter(p => ['house', 'street', 'building', 'other'].includes(p.type) || p.housenumber || p.street)
    .map(label)
    .filter(Boolean);
}

async function geoCa(query, signal) {
  const url = new URL('https://geolocator.api.geo.ca/');
  url.search = new URLSearchParams({ q: query, lang: 'en', keys: 'locate' });
  const res = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!res.ok) return [];
  const results = await res.json();
  return Array.isArray(results)
    ? results.filter(i => i.province === 'Ontario' && typeof i.name === 'string').map(i => i.name)
    : [];
}

export function enableAddressSuggestions(form) {
  let timer, controller, seq = 0, items = [], active = -1, choosing = false;
  const cache = new Map();
  const field = () => form.querySelector('input[name="location"]');

  // Drop the old native datalist so browsers don't show two lists.
  const prepare = input => {
    if (!input || input.dataset.ac) return;
    input.dataset.ac = '1';
    input.removeAttribute('list');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', 'address-listbox');
    input.setAttribute('autocomplete', 'off');
    form.querySelector('#address-suggestions')?.remove();
  };

  const listbox = input => {
    let box = form.querySelector('#address-listbox');
    if (!box) {
      box = document.createElement('ul');
      box.id = 'address-listbox';
      box.className = 'address-listbox';
      box.setAttribute('role', 'listbox');
      box.hidden = true;
      box.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the input
      box.addEventListener('click', e => {
        const li = e.target.closest('[role="option"]');
        if (li) choose(Number(li.dataset.i));
      });
    }
    const wrap = input.parentElement;
    if (box.parentElement !== wrap) {
      wrap.classList.add('address-wrap');
      input.insertAdjacentElement('afterend', box);
    }
    return box;
  };

  const close = () => {
    const input = field(), box = form.querySelector('#address-listbox');
    if (box) box.hidden = true;
    if (input) { input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    active = -1;
  };

  const show = names => {
    const input = field();
    if (!input) return;
    items = names.slice(0, 6);
    const box = listbox(input);
    if (!items.length) { close(); return; }
    box.replaceChildren(
      ...items.map((name, i) => {
        const li = document.createElement('li');
        li.id = 'address-opt-' + i;
        li.setAttribute('role', 'option');
        li.dataset.i = i;
        li.textContent = name;
        return li;
      }),
      Object.assign(document.createElement('li'), { className: 'address-credit', textContent: '© OpenStreetMap contributors' })
    );
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    highlight(-1);
  };

  const highlight = i => {
    const box = form.querySelector('#address-listbox'), input = field();
    if (!box || !input) return;
    active = i;
    box.querySelectorAll('[role="option"]').forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
    if (i >= 0) { input.setAttribute('aria-activedescendant', 'address-opt-' + i); box.querySelector('#address-opt-' + i)?.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  };

  const choose = i => {
    const input = field();
    if (!input || !items[i]) return;
    choosing = true;
    input.value = items[i];
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    choosing = false;
    close();
    input.focus();
  };

  form.addEventListener('focusin', e => { if (e.target.name === 'location') prepare(e.target); });

  form.addEventListener('input', e => {
    if (e.target.name !== 'location' || choosing) return;
    prepare(e.target);
    clearTimeout(timer); controller?.abort();
    const current = ++seq, query = e.target.value.trim();
    if (query.length < MIN_CHARS) { close(); return; }
    if (cache.has(query)) { show(cache.get(query)); return; }
    timer = setTimeout(async () => {
      controller = new AbortController();
      const stop = setTimeout(() => controller.abort(), 6000);
      let names = [];
      try { names = await photon(query, controller.signal); }
      catch { try { names = await geoCa(query, controller.signal); } catch { /* manual entry still works */ } }
      finally { clearTimeout(stop); }
      names = [...new Set(names)];
      if (current !== seq) return;
      cache.set(query, names);
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      show(names);
    }, 250);
  });

  form.addEventListener('keydown', e => {
    if (e.target.name !== 'location') return;
    const box = form.querySelector('#address-listbox');
    if (!box || box.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, -1)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });

  form.addEventListener('focusout', e => { if (e.target.name === 'location') setTimeout(close, 120); });
}
