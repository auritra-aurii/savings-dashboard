const CACHE_NAME = "savings-v1";

// On install — cache the app shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(["./dashboard.html", "./icon.png"])
    )
  );
  self.skipWaiting();
});

// On activate — clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On fetch:
// - For Google Sheets CSV requests: network first, cache on success, fallback to cache
// - For everything else: cache first, then network
self.addEventListener("fetch", e => {
  const url = e.request.url;

  if (url.includes("docs.google.com")) {
    // Data requests: try network, save to cache, fall back to cache if offline
    e.respondWith(
      fetch(e.request.clone())
        .then(res => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // App shell: cache first
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
