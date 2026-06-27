const CACHE_NAME = 'silacalc-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/logo.png',
  '/icon.png',
  '/beam-block-real.jpg',
  '/beam-block-finished.jpg',
  '/beam-block-system.png',
  '/silatech-logo.svg',
  '/robots.txt',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Avoid intercepting chrome-extension or external third-party tracking URLs
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Next.js dev server or hot-reload files should not be cached
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.includes('hot-update')) {
    return;
  }

  // Network-First for main pages and routes, falling back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cachedResponse) => cachedResponse || caches.match('/')))
    );
    return;
  }

  // Cache-First for static assets (fonts, images, scripts, stylesheets)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, but fetch and update cache in background (Stale-While-Revalidate)
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
            }
          })
          .catch(() => {/* Ignore network failure for background fetch */});
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});
