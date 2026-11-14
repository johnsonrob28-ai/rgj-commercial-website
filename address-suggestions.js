// Optional Canadian address suggestions; manual input always remains available.
export function enableAddressSuggestions(form) {
  let timer, controller, sequence = 0;
  const cache = new Map();
  const clear = () => { const list = form.querySelector('#address-suggestions'); if (list) list.replaceChildren(); };
  const render = names => {
    const list = form.querySelector('#address-suggestions');
    if (!list) return;
    list.replaceChildren(...names.map(name => { const option = document.createElement('option'); option.value = name; return option; }));
  };
  form.addEventListener('input', event => {
    if (event.target.name !== 'location') return;
    clearTimeout(timer); controller?.abort();
    const current = ++sequence;
    const query = event.target.value.trim();
    clear();
    if (query.length < 5) return;
    if (cache.has(query)) { render(cache.get(query)); return; }
    timer = setTimeout(async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const url = new URL('https://geolocator.api.geo.ca/');
        url.search = new URLSearchParams({q: query, lang: 'en', keys: 'locate'});
        const response = await fetch(url, {signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'});
        if (!response.ok) return;
        const results = await response.json();
        if (current !== sequence || !Array.isArray(results)) return;
        const names = [...new Set(results.filter(item => item.province === 'Ontario' && ['Street', 'Intersection', 'City', 'Town', 'Village'].includes(item.category) && typeof item.name === 'string').map(item => item.name))].slice(0, 6);
        cache.set(query, names);
        if (cache.size > 25) cache.delete(cache.keys().next().value);
        render(names);
      } catch { /* A lookup outage never blocks contact submission. */ }
      finally { clearTimeout(timeout); }
    }, 650);
  });
}
