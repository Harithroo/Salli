// IMPORTANT:
// Use network-first so new deploys are picked up immediately (no "clear site data" needed),
// while still supporting offline fallback via Cache Storage.

const CACHE_PREFIX = 'salli-cache-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const scope = self.registration?.scope || self.location.origin + '/';
const urlForScope = (path) => new URL(path, scope).toString();

const ASSETS_TO_CACHE = [
  urlForScope('./'),
  urlForScope('index.html'),
  urlForScope('style.css'),
  urlForScope('manifest.json'),
  urlForScope('app.js'),
  urlForScope('script.js'),
  urlForScope('libs/umbrella.min.js'),
  urlForScope('icons/icon-192.png'),
  urlForScope('icons/icon-512.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(ASSETS_TO_CACHE);
      } catch {
        await Promise.all(
          ASSETS_TO_CACHE.map(async (assetUrl) => {
            try {
              await cache.add(assetUrl);
            } catch {
              // ignore
            }
          })
        );
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkRequest = new Request(request, { cache: 'no-store' });
    const response = await fetch(networkRequest);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(networkFirst(request));
});
