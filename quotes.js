// Curated quote pools. Each category is a deduplicated list; the app deals them
// from a non-repeating shuffled deck (see lib.createDeck), so there's no need to
// pad the arrays — every quote is seen once before any repeats.
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.LTC_QUOTES_BIBLE = api.bible;
    root.LTC_QUOTES_MOTIVATIONAL = api.motivational;
    root.LTC_QUOTES_THEOLOGIANS = api.theologians;
    root.getQuotePool = api.getQuotePool;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const bible = [
    "Psalm 90:12 — Teach us to number our days, that we may gain a heart of wisdom.",
    "Proverbs 3:5 — Trust in the LORD with all your heart and lean not on your own understanding.",
    "Romans 8:28 — All things work together for good for those who love God.",
    "Philippians 4:13 — I can do all things through Christ who strengthens me.",
    "Joshua 1:9 — Be strong and courageous; the LORD your God is with you wherever you go.",
    "Isaiah 40:31 — Those who hope in the LORD will renew their strength.",
    "Matthew 6:33 — Seek first the kingdom of God and his righteousness.",
    "2 Corinthians 5:7 — For we walk by faith, not by sight.",
    "Galatians 6:9 — Let us not grow weary of doing good, for in due season we will reap.",
    "Hebrews 12:1 — Run with endurance the race set before us.",
    "Psalm 23:1 — The LORD is my shepherd; I shall not want.",
    "Psalm 46:10 — Be still, and know that I am God.",
    "Psalm 118:24 — This is the day the LORD has made; let us rejoice and be glad in it.",
    "Jeremiah 29:11 — For I know the plans I have for you, plans to give you a hope and a future.",
    "Matthew 11:28 — Come to me, all who are weary, and I will give you rest.",
    "John 3:16 — For God so loved the world that he gave his only Son.",
    "Romans 12:2 — Be transformed by the renewing of your mind.",
    "1 Corinthians 13:13 — And now these three remain: faith, hope and love. But the greatest of these is love.",
    "Ephesians 2:10 — We are God's handiwork, created in Christ Jesus to do good works.",
    "Philippians 4:6 — Do not be anxious about anything, but in everything, by prayer, present your requests to God.",
    "Colossians 3:23 — Whatever you do, work at it with all your heart, as working for the Lord.",
    "James 1:5 — If any of you lacks wisdom, let him ask God, who gives generously.",
    "1 Peter 5:7 — Cast all your anxiety on him because he cares for you.",
    "Micah 6:8 — Act justly, love mercy, and walk humbly with your God.",
    "Lamentations 3:22-23 — His mercies are new every morning; great is your faithfulness.",
    "Psalm 39:4 — Show me, LORD, my life's end and the number of my days; let me know how fleeting my life is.",
    "Ecclesiastes 3:1 — For everything there is a season, and a time for every matter under heaven.",
    "James 4:14 — What is your life? You are a mist that appears for a little while and then vanishes.",
    "2 Timothy 4:7 — I have fought the good fight, I have finished the race, I have kept the faith.",
    "Psalm 27:1 — The LORD is my light and my salvation — whom shall I fear?"
  ];

  const motivational = [
    "Discipline is choosing what you want most over what you want now.",
    "Small habits, big results: what you do daily shapes who you become.",
    "Courage is not the absence of fear; it's deciding something else matters more.",
    "Action cures doubt. Start small, start now.",
    "The secret to getting ahead is getting started.",
    "You will never always be motivated. You must learn to be disciplined.",
    "The best time to plant a tree was twenty years ago. The second best time is now.",
    "Done is better than perfect.",
    "Energy and persistence conquer all things. — Benjamin Franklin",
    "It always seems impossible until it's done. — Nelson Mandela",
    "What we fear doing most is usually what we most need to do.",
    "A year from now you may wish you had started today.",
    "Fall seven times, stand up eight.",
    "Comparison is the thief of joy. — Theodore Roosevelt",
    "Do the hard things while they are easy; do the great things while they are small. — Lao Tzu",
    "Your future is created by what you do today, not tomorrow.",
    "Don't count the days; make the days count. — Muhammad Ali",
    "Slow progress is still progress.",
    "Motivation gets you going; habit keeps you growing.",
    "The obstacle is the way.",
    "How we spend our days is, of course, how we spend our lives. — Annie Dillard",
    "Dream big. Start small. Act now.",
    "Be so busy improving yourself that you have no time to criticize others.",
    "The cave you fear to enter holds the treasure you seek. — Joseph Campbell",
    "Either you run the day or the day runs you. — Jim Rohn"
  ];

  const theologians = [
    "Augustine — Our hearts are restless until they rest in You.",
    "C.S. Lewis — Aim at heaven and you will get earth thrown in. Aim at earth and you will get neither.",
    "Charles Spurgeon — By perseverance the snail reached the ark.",
    "C.S. Lewis — You are never too old to set another goal or to dream a new dream.",
    "C.S. Lewis — There are far better things ahead than any we leave behind.",
    "A.W. Tozer — What comes into our minds when we think about God is the most important thing about us.",
    "Dietrich Bonhoeffer — The first service one owes to others consists in listening to them.",
    "Corrie ten Boom — Worry does not empty tomorrow of its sorrow; it empties today of its strength.",
    "Jonathan Edwards — Resolved, to live with all my might, while I do live.",
    "Charles Spurgeon — A good character is the best tombstone.",
    "Thomas à Kempis — At the day of judgment we shall not be asked what we have read, but what we have done.",
    "Augustine — He who is full of love is full of God himself.",
    "John Calvin — There is not one blade of grass that does not declare the glory of God.",
    "Blaise Pascal — There is a God-shaped vacuum in the heart of every person.",
    "George Müller — The beginning of anxiety is the end of faith; the beginning of true faith is the end of anxiety.",
    "Martin Luther — Pray, and let God worry.",
    "John Wesley — Do all the good you can, in all the ways you can, as long as ever you can.",
    "Oswald Chambers — Trust God and do the next thing.",
    "Brother Lawrence — We ought not to be weary of doing little things for the love of God.",
    "C.S. Lewis — Humility is not thinking less of yourself, but thinking of yourself less."
  ];

  function getQuotePool(mode) {
    if (mode === 'bible') return bible.slice();
    if (mode === 'motivational') return motivational.slice();
    if (mode === 'theologians') return theologians.slice();
    return bible.concat(motivational, theologians); // "mixed"
  }

  return { bible, motivational, theologians, getQuotePool };
});
