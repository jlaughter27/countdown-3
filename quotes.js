// Same quotes as previous build (truncated here for brevity in this environment)
window.LTC_QUOTES_BIBLE = [
  "Psalm 90:12 — Teach us to number our days, that we may gain a heart of wisdom.",
  "Proverbs 3:5 — Trust in the LORD with all your heart and lean not on your own understanding.",
  "Romans 8:28 — All things work together for good for those who love God.",
  "Philippians 4:13 — I can do all things through Christ who strengthens me.",
  "Joshua 1:9 — Be strong and courageous... the LORD your God is with you.",
  "Isaiah 40:31 — Those who hope in the LORD will renew their strength.",
  "Matthew 6:33 — Seek first the kingdom of God and his righteousness.",
  "2 Corinthians 5:7 — For we walk by faith, not by sight.",
  "Galatians 6:9 — Let us not grow weary of doing good, for in due season we will reap.",
  "Hebrews 12:1 — Run with endurance the race set before us."
];
window.LTC_QUOTES_MOTIVATIONAL = [
  "Discipline is choosing what you want most over what you want now.",
  "Small habits, big results: what you do daily shapes who you become.",
  "Courage is not the absence of fear; it’s deciding something else matters more.",
  "Action cures doubt. Start small, start now.",
  "The secret to getting ahead is getting started."
];
window.LTC_QUOTES_THEOLOGIANS = [
  "Augustine — Our hearts are restless until they rest in You.",
  "C.S. Lewis — Aim at heaven and you will get earth ‘thrown in’. Aim at earth and you will get neither.",
  "Charles Spurgeon — By perseverance the snail reached the ark."
];
(function(){
  function expandTo(target, arr){
    const out = []; let i = 0; while(out.length < target){ out.push(arr[i % arr.length]); i++; } return out;
  }
  window.getQuotePool = function(mode){
    const B = window.LTC_QUOTES_BIBLE.slice();
    const M = window.LTC_QUOTES_MOTIVATIONAL.slice();
    const T = window.LTC_QUOTES_THEOLOGIANS.slice();
    if (mode === 'bible') return expandTo(500, B);
    if (mode === 'motivational') return expandTo(500, M);
    if (mode === 'theologians') return expandTo(500, T);
    const mixed = []; mixed.push(...expandTo(200,B), ...expandTo(150,M), ...expandTo(150,T));
    for (let i = mixed.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mixed[i], mixed[j]] = [mixed[j], mixed[i]]; }
    return mixed;
  };
})();