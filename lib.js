// Pure, side-effect-free helpers shared by the app and the test suite.
// Exposed on window.LTCLib in the browser and via module.exports for Node tests.
(function (root, factory) {
  const lib = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  if (root) root.LTCLib = lib;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;

  // Parse a "YYYY-MM-DD" string as LOCAL midnight (not UTC). Using `new Date(str)`
  // treats it as UTC, which shifts the day for anyone west of GMT and causes
  // off-by-one errors in "days remaining". Returns a Date or null if invalid.
  function parseLocalDate(value) {
    if (value instanceof Date) return isNaN(value) ? null : value;
    if (typeof value !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) {
      const d = new Date(value);
      return isNaN(d) ? null : d;
    }
    const y = +m[1], mo = +m[2], da = +m[3];
    const d = new Date(y, mo - 1, da);
    // Reject overflow like 2023-02-30 rolling into March.
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return d;
  }

  // Add whole years to a date. A Feb-29 birthdate in a non-leap target year
  // lands on Mar 1 (JS default), which is the conventional behavior.
  function addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  // Break a remaining-life span into display parts. `now` is injectable for tests.
  function computeCountdown(birth, lifespanYears, now = new Date()) {
    const start = parseLocalDate(birth);
    const span = Number(lifespanYears);
    if (!start || !span || span <= 0) return null;

    const end = addYears(start, span);
    const remaining = Math.max(0, end - now);
    const totalSec = Math.floor(remaining / 1000);
    const days = Math.floor(totalSec / 86400);
    const rem = totalSec % 86400;
    const hh = Math.floor(rem / 3600);
    const mm = Math.floor((rem % 3600) / 60);
    const ss = rem % 60;

    const total = end - start;
    const elapsed = Math.max(0, now - start);
    const pct = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;

    return { days, hh, mm, ss, pct, ended: remaining === 0 };
  }

  // Days left until end-of-life, or until the 18th birthday for a child.
  function calcDaysLeft(birthdate, lifespanYears, opts = {}, now = new Date()) {
    const start = parseLocalDate(birthdate);
    if (!start) return 0;
    const end = (opts.isChild && opts.childMode === '18')
      ? addYears(start, 18)
      : addYears(start, Number(lifespanYears));
    return Math.max(0, Math.ceil((end - now) / DAY_MS));
  }

  // Fisher-Yates shuffle returning a NEW array. `rng` injectable for tests.
  function shuffle(arr, rng = Math.random) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // A non-repeating shuffled "deck": deals every item once before reshuffling,
  // and guarantees the first card of a new shuffle differs from the last dealt.
  function createDeck(items, rng = Math.random) {
    let deck = [];
    let i = 0;
    let lastDealt = null;
    function reshuffle() {
      deck = shuffle(items, rng);
      if (deck.length > 1 && deck[0] === lastDealt) {
        [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
      i = 0;
    }
    return {
      next() {
        if (!items.length) return null;
        if (i >= deck.length) reshuffle();
        lastDealt = deck[i++];
        return lastDealt;
      },
      size() { return items.length; }
    };
  }

  function isFutureDate(value, now = new Date()) {
    const d = parseLocalDate(value);
    return !!d && d.getTime() > now.getTime();
  }

  return { DAY_MS, parseLocalDate, addYears, clamp, computeCountdown, calcDaysLeft, shuffle, createDeck, isFutureDate };
});
