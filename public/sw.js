// public/sw.js
const CACHE_NAME = 'ilp-static-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/styles.css'
];

// install
self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// activate
self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});

// fetch: network-first for navigation, cache-first for others
self.addEventListener('fetch', evt => {
  const req = evt.request;
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    evt.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  evt.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return res;
      }).catch(() => {
        return new Response('', { status: 404 });
      });
    })
  );
});
