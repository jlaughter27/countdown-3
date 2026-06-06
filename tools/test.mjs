// Zero-dependency test runner for the pure logic in lib.js and quotes.js.
// Run: `node tools/test.mjs`
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lib = require(join(root, 'lib.js'));
const quotes = require(join(root, 'quotes.js'));

let passed = 0, failed = 0;
const fails = [];
function test(name, fn){
  try { fn(); passed++; }
  catch (e){ failed++; fails.push(`${name}: ${e.message}`); }
}
function eq(a, b, msg){
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg || 'expected equal'} — got ${A}, want ${B}`);
}
function ok(v, msg){ if (!v) throw new Error(msg || 'expected truthy'); }

// A seeded RNG so shuffle/deck tests are deterministic.
function seeded(seed){ let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// —— parseLocalDate ——
test('parseLocalDate parses YMD at local midnight', () => {
  const d = lib.parseLocalDate('2000-01-15');
  eq([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()], [2000, 0, 15, 0], 'local midnight');
});
test('parseLocalDate rejects invalid + overflow', () => {
  ok(lib.parseLocalDate('not-a-date') === null, 'garbage');
  ok(lib.parseLocalDate('2023-02-30') === null, 'overflow Feb 30');
  ok(lib.parseLocalDate('') === null, 'empty');
  ok(lib.parseLocalDate(null) === null, 'null');
});
test('parseLocalDate passes through valid Date', () => {
  const d = new Date(2010, 5, 1);
  ok(lib.parseLocalDate(d) === d, 'passthrough');
});

// —— addYears ——
test('addYears adds whole years', () => {
  const d = lib.addYears(new Date(2000, 0, 1), 25);
  eq(d.getFullYear(), 2025, 'year');
});

// —— computeCountdown ——
test('computeCountdown returns null on bad input', () => {
  ok(lib.computeCountdown(null, 80) === null, 'no birth');
  ok(lib.computeCountdown('2000-01-01', 0) === null, 'zero lifespan');
});
test('computeCountdown math is correct', () => {
  const now = new Date(2020, 0, 1, 0, 0, 0);      // born 2000-01-01, 80yr lifespan
  const c = lib.computeCountdown('2000-01-01', 80, now);
  // end = 2080-01-01; remaining = 60 years from 2020-01-01.
  const expectedDays = Math.floor((new Date(2080,0,1) - now) / 86400000);
  eq(c.days, expectedDays, 'days');
  eq([c.hh, c.mm, c.ss], [0, 0, 0], 'hms at midnight');
  eq(c.pct.toFixed(1), '25.0', 'percent lived (20/80)');
  ok(c.ended === false, 'not ended');
});
test('computeCountdown clamps when life is over', () => {
  const c = lib.computeCountdown('1900-01-01', 80, new Date(2020, 0, 1));
  eq([c.days, c.hh, c.mm, c.ss], [0, 0, 0, 0], 'all zero');
  eq(c.pct, 100, 'pct capped at 100');
  ok(c.ended === true, 'ended');
});

// —— calcDaysLeft ——
test('calcDaysLeft full-life vs until-18', () => {
  const now = new Date(2020, 0, 1);
  const full = lib.calcDaysLeft('2015-01-01', 80, {}, now);
  const child = lib.calcDaysLeft('2015-01-01', 80, { isChild: true, childMode: '18' }, now);
  eq(child, Math.ceil((new Date(2033,0,1) - now) / 86400000), 'until 18 (2015+18)');
  ok(full > child, 'full life longer than to-18');
});
test('calcDaysLeft never negative', () => {
  eq(lib.calcDaysLeft('1900-01-01', 50, {}, new Date(2020, 0, 1)), 0, 'past');
});

// —— shuffle ——
test('shuffle keeps the same multiset', () => {
  const src = [1, 2, 3, 4, 5];
  const out = lib.shuffle(src, seeded(7));
  eq(out.slice().sort(), src.slice().sort(), 'same elements');
  eq(src, [1, 2, 3, 4, 5], 'source not mutated');
});

// —— createDeck ——
test('createDeck deals every item once before repeating', () => {
  const items = ['a', 'b', 'c', 'd'];
  const deck = lib.createDeck(items, seeded(3));
  const firstRound = [deck.next(), deck.next(), deck.next(), deck.next()];
  eq(firstRound.slice().sort(), items.slice().sort(), 'full coverage in one round');
});
test('createDeck avoids back-to-back repeats across reshuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const deck = lib.createDeck(items, seeded(11));
  let prev = null;
  for (let i = 0; i < 200; i++){
    const q = deck.next();
    ok(q !== prev, `repeat at ${i}`);
    prev = q;
  }
});
test('createDeck handles empty pool', () => {
  const deck = lib.createDeck([]);
  ok(deck.next() === null, 'empty deck yields null');
});

// —— isFutureDate ——
test('isFutureDate', () => {
  const now = new Date(2020, 0, 1);
  ok(lib.isFutureDate('2030-01-01', now) === true, 'future');
  ok(lib.isFutureDate('2010-01-01', now) === false, 'past');
});

// —— quotes ——
test('getQuotePool returns the right pools', () => {
  ok(quotes.getQuotePool('bible').length === quotes.bible.length, 'bible');
  ok(quotes.getQuotePool('motivational').length === quotes.motivational.length, 'mot');
  const mixed = quotes.getQuotePool('mixed');
  eq(mixed.length, quotes.bible.length + quotes.motivational.length + quotes.theologians.length, 'mixed sum');
});
test('no duplicate quotes within any category', () => {
  for (const cat of ['bible', 'motivational', 'theologians']){
    const arr = quotes.getQuotePool(cat);
    eq(new Set(arr).size, arr.length, `duplicates in ${cat}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed){ console.error('\nFailures:\n - ' + fails.join('\n - ')); process.exit(1); }
