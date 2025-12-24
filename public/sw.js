const CACHE_NAME = 'cocktailverse-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/logo.png',
  '/assets/logooscuro.png',
  '/assets/cocktail_mockup.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.map((name) => (name !== CACHE_NAME ? caches.delete(name) : null))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isApiRequest = request.url.includes('/api/');
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && !isApiRequest) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (response.ok && !isApiRequest) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached || caches.match('/index.html'));
    }),
  );
});
