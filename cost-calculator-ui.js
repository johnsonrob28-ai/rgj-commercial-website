import { compareOptions } from './cost-calculator.js?v=20261119-1';

const FIELDS = [
  ['name', 'Option name', 'text', 'e.g. Current building (renewal)', ''],
  ['size', 'Size', 'decimal', 'e.g. 30,000', 'SF'],
  ['rent', 'Net rent, year 1', 'decimal', 'e.g. 16.00', '$/SF/yr'],
  ['escalation', 'Annual rent increase', 'decimal', 'e.g. 3', null],
  ['tmi', 'Additional rent (TMI)', 'decimal', 'e.g. 4.75', '$/SF/yr'],
  ['term', 'Lease term', 'decimal', 'e.g. 5', 'years'],
  ['freeMonths', 'Free net rent', 'decimal', 'e.g. 3', 'months'],
  ['allowance', 'Landlord allowance', 'decimal', 'e.g. 2.00', '$/SF'],
  ['fitOut', 'Your fit-out cost', 'decimal', 'e.g. 50,000', '$'],
  ['moving', 'Moving & one-time costs', 'decimal', 'e.g. 75,000', '$'],
];
const KEYS = [...FIELDS.map(f => f[0]), 'escalationType'];
const LETTERS = ['A', 'B', 'C'];
const EXAMPLE = [
  { name: 'Current building (renewal)', size: '30,000', rent: '15.50', escalation: '3', escalationType: 'pct', tmi: '4.75', term: '5', freeMonths: '0', allowance: '0', fitOut: '0', moving: '0' },
  { name: 'Building B (relocation)', size: '30,000', rent: '16.25', escalation: '3', escalationType: 'pct', tmi: '4.25', term: '5', freeMonths: '4', allowance: '2.00', fitOut: '60,000', moving: '75,000' },
  { name: '', escalationType: 'pct' },
];

const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
const psf = n => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function card(i, values) {
  const L = LETTERS[i];
  const rows = FIELDS.map(([k, label, type, ph, unit]) => {
    const id = `opt${L}-${k}`, v = esc(values[k] ?? '');
    if (k === 'escalation') {
      const pct = values.escalationType !== 'dollar';
      return `<label for="${id}">${label}</label><div class="calc-input calc-split"><input id="${id}" data-i="${i}" data-k="${k}" inputmode="decimal" placeholder="${ph}" value="${v}"><select aria-label="Increase type, option ${L}" data-i="${i}" data-k="escalationType"><option value="pct"${pct ? ' selected' : ''}>%</option><option value="dollar"${pct ? '' : ' selected'}>$/SF</option></select></div>`;
    }
    const attrs = type === 'text' ? 'type="text"' : 'inputmode="decimal"';
    return `<label for="${id}">${label}</label><div class="calc-input"><input id="${id}" ${attrs} data-i="${i}" data-k="${k}" placeholder="${ph}" value="${v}">${unit ? `<span>${unit}</span>` : ''}</div>`;
  }).join('');
  return `<fieldset class="calc-card"><legend>Option ${L}</legend>${rows}</fieldset>`;
}

function readState() {
  return LETTERS.map((_, i) => {
    const o = {};
    document.querySelectorAll(`[data-i="${i}"]`).forEach(el => { o[el.dataset.k] = el.value; });
    return o;
  });
}

function render() {
  const state = readState();
  const results = compareOptions(state);
  const cols = results.map((r, i) => r && { r, label: esc(state[i].name.trim() || `Option ${LETTERS[i]}`) }).filter(Boolean);
  const out = $('#calc-results');
  if (!cols.length) { out.innerHTML = '<p class="calc-empty">Enter at least a size, net rent and lease term for one option to see results.</p>'; return save(state); }
  const best = Math.min(...cols.map(c => c.r.total));
  const row = (label, fn, cls = '') => `<tr class="${cls}"><th scope="row">${label}</th>${cols.map(c => `<td>${fn(c.r)}</td>`).join('')}</tr>`;
  out.innerHTML = `<div class="calc-table-wrap"><table class="calc-table"><thead><tr><th scope="col">Results</th>${cols.map(c => `<th scope="col">${c.label}${c.r.lowestAllIn ? '<span class="calc-badge">Lowest cost</span>' : ''}</th>`).join('')}</tr></thead><tbody>` +
    row('Total occupancy cost over the term', r => money(r.total), 'calc-key') +
    row('All-in cost per SF per year', r => psf(r.allInPsf), 'calc-key') +
    (cols.length > 1 ? row('Difference vs. lowest total', r => r.total - best < 0.5 ? '—' : '+' + money(r.total - best)) : '') +
    row('Average monthly cost', r => money(r.averageMonthly)) +
    row('Year 1 monthly rent + TMI (before free rent)', r => money(r.monthlyYear1)) +
    row('Net effective rent ($/SF/yr)', r => psf(r.netEffectiveRent)) +
    row('Total net rent', r => money(r.totalNet)) +
    row('Total additional rent (TMI)', r => money(r.totalTmi)) +
    row('Fit-out, moving & one-time costs', r => money(r.oneTime)) +
    row('Less landlord allowance', r => r.allowance ? '−' + money(r.allowance) : money(0)) +
    `</tbody></table></div>`;
  save(state);
}

function save(state) {
  const p = new URLSearchParams();
  state.forEach((o, i) => KEYS.forEach(k => { if (o[k] && !(k === 'escalationType' && o[k] === 'pct')) p.set(LETTERS[i].toLowerCase() + '_' + k, o[k]); }));
  history.replaceState(null, '', p.toString() ? '#' + p : location.pathname);
}

function load() {
  if (!location.hash.slice(1)) return EXAMPLE;
  const p = new URLSearchParams(location.hash.slice(1));
  return LETTERS.map((L, i) => Object.fromEntries(KEYS.map(k => [k, p.get(L.toLowerCase() + '_' + k) ?? (k === 'escalationType' ? 'pct' : '')])));
}

function build(values) {
  $('#calc-options').innerHTML = values.map((v, i) => card(i, v)).join('');
  render();
}

build(load());
$('#calc-options').addEventListener('input', render);
$('#calc-options').addEventListener('change', render);
$('#calc-reset').addEventListener('click', () => { history.replaceState(null, '', location.pathname); build(EXAMPLE); });
$('#calc-clear').addEventListener('click', () => build(LETTERS.map(() => ({ escalationType: 'pct' }))));
$('#calc-print').addEventListener('click', () => window.print());
$('#calc-copy').addEventListener('click', async e => {
  try { await navigator.clipboard.writeText(location.href); e.target.textContent = 'Link copied'; }
  catch { e.target.textContent = 'Copy the address bar link'; }
  setTimeout(() => { e.target.textContent = 'Copy link to this comparison'; }, 2500);
});
