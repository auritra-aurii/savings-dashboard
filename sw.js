const CACHE = "fdr-v1";
const PAGE = "./dashboard.html";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(PAGE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Don't intercept Google Sheets requests — let them go direct
  if (e.request.url.includes("google.com")) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Serve page from cache instantly, update in background
      if (cached) {
        fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res));
        });
        return cached;
      }
      return fetch(e.request);
    })
  );
});
