const CACHE_NAME = "ltc-cache-v4";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./quotes.js",
  "./idb.min.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

// Stale-while-revalidate for snappy updates
self.addEventListener("fetch", (evt) => {
  const req = evt.request;
  evt.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        const copy = networkResp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
