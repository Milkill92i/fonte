const C = 'lafonte-table-v2';
const CORE = ['./table.html', './table-icon-192.png', './table-icon-512.png', './table.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord, cache en secours — et on ne touche JAMAIS aux requêtes
   vers d'autres domaines (Open Food Facts, CDN, polices) : elles passent en direct. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() =>
        caches.match(e.request).then(m => m || caches.match('./table.html'))
      )
  );
});
