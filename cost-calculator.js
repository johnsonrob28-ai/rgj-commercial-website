// Industrial occupancy cost calculator: pure calculation (tested in cost-calculator.test.mjs).
// All money in CAD. Rates are $/SF/year. Undiscounted totals; HST excluded.

export function computeOption(o) {
  const sf = num(o.size), rent = num(o.rent), tmi = num(o.tmi), term = num(o.term);
  if (!(sf > 0) || !(term > 0) || !(rent >= 0)) return null;
  const months = Math.round(term * 12);
  const free = Math.min(Math.max(0, Math.round(num(o.freeMonths))), months);
  const esc = num(o.escalation), escPct = o.escalationType !== 'dollar';
  const tmiGrowth = num(o.tmiGrowth) / 100;
  let totalNet = 0, totalTmi = 0;
  const years = [];
  for (let m = 0; m < months; m++) {
    const y = Math.floor(m / 12);
    const netRate = escPct ? rent * Math.pow(1 + esc / 100, y) : rent + esc * y;
    const tmiRate = tmi * Math.pow(1 + tmiGrowth, y);
    const net = m < free ? 0 : netRate * sf / 12;
    const add = tmiRate * sf / 12;
    totalNet += net; totalTmi += add;
    (years[y] ||= { year: y + 1, netRate, tmiRate, net: 0, tmi: 0 });
    years[y].net += net; years[y].tmi += add;
  }
  const allowance = num(o.allowance) * sf;
  const oneTime = num(o.fitOut) + num(o.moving);
  const total = totalNet + totalTmi + oneTime - allowance;
  const termYears = months / 12;
  return {
    name: (o.name || '').trim(),
    sf, months, freeMonths: free,
    monthlyYear1: (rent + tmi) * sf / 12,
    totalNet, totalTmi, oneTime, allowance, total,
    averageMonthly: total / months,
    allInPsf: total / sf / termYears,
    netEffectiveRent: (totalNet - allowance) / sf / termYears,
    years,
  };
}

export function compareOptions(options) {
  const results = options.map(computeOption);
  const valid = results.filter(Boolean);
  const best = valid.length > 1 ? Math.min(...valid.map(r => r.allInPsf)) : null;
  return results.map(r => r && { ...r, lowestAllIn: best !== null && Math.abs(r.allInPsf - best) < 1e-9 });
}

function num(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(String(v).replace(/[$,%\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
