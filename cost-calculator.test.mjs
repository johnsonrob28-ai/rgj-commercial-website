import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOption, compareOptions } from './cost-calculator.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

test('free rent, allowance and one-time costs', () => {
  const r = computeOption({ size: '10,000', rent: 10, tmi: 5, term: 1, freeMonths: 2, allowance: 1, fitOut: 5000, moving: 5000 });
  close(r.totalNet, 83333.33);
  close(r.totalTmi, 50000);
  close(r.total, 133333.33);
  close(r.allInPsf, 13.3333);
  close(r.netEffectiveRent, 7.3333);
  close(r.monthlyYear1, 12500);
  close(r.averageMonthly, 11111.11);
});

test('percentage and dollar escalations', () => {
  close(computeOption({ size: 1000, rent: 10, term: 2, escalation: 3 }).totalNet, 20300);
  close(computeOption({ size: 1000, rent: 10, term: 2, escalation: 0.5, escalationType: 'dollar' }).totalNet, 20500);
  close(computeOption({ size: 1000, rent: 0, tmi: 5, tmiGrowth: 10, term: 2 }).totalTmi, 10500);
});

test('incomplete options are skipped and the cheapest is flagged', () => {
  const [a, b, c] = compareOptions([
    { size: 1000, rent: 12, tmi: 4, term: 5 },
    { size: 1000, rent: 11, tmi: 4, term: 5 },
    { size: '', rent: 10, term: 5 },
  ]);
  assert.equal(c, null);
  assert.equal(a.lowestAllIn, false);
  assert.equal(b.lowestAllIn, true);
});
