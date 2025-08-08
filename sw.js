self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Pre-cache essential assets for offline use
const CACHE_NAME = 'salli-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => {
        console.error('Failed to cache assets:', err);
      })
  );
});

self.addEventListener('fetch', e => {
    // if this is NOT our origin, do nothing special (let it load normally)
    if (!e.request.url.startsWith(self.location.origin)) return;

    // otherwise do network‑first for our own assets
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Optionally update cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});