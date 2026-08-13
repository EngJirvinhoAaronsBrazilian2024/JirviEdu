const CACHE_NAME = 'jirvi-edu-v7';
const ASSET_CACHE = 'jirvi-edu-assets-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, ASSET_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Explicitly bypass caching for API, database, and auth endpoints
  const sensitivePaths = ['/rest/v1', '/auth/v1', '/realtime', '/storage/v1', '/api/'];
  if (
    url.hostname.includes('supabase') || 
    sensitivePaths.some(path => url.pathname.includes(path))
  ) {
    return;
  }

  // 3. Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 4. Stale-while-revalidate for static assets
  if (!url.protocol.startsWith('http')) return;

  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ico)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(ASSET_CACHE).then(cache => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          // ignore network errors if offline
        });
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Default fallback for other GET requests
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request);
    })
  );
});
