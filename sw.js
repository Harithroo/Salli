self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
    // if this is NOT our origin, do nothing special (let it load normally)
    if (!e.request.url.startsWith(self.location.origin)) return;

    // otherwise do network‑first for our own assets
    e.respondWith(
        fetch(e.request)
            .catch(() => caches.match(e.request))
    );
});