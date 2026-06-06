const CACHE_NAME = "ltc-cache-v6";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./lib.js",
  "./app.js",
  "./quotes.js",
  "./idb.min.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache assets individually so one missing/304 file can't abort the
      // whole install (cache.addAll is all-or-nothing and silently kills
      // offline support if any URL fails).
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch((err) => {
            console.warn("[sw] failed to cache", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin GETs, with an offline navigation
// fallback so the app shell still loads with no network.
self.addEventListener("fetch", (evt) => {
  const req = evt.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin

  evt.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => {
          // Offline: fall back to the cached shell for navigations.
          if (req.mode === "navigate") return caches.match("./index.html");
          return cached;
        });
      return cached || network;
    })
  );
});
