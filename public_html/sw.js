/**
 * Prayaas Gurukul — Service Worker (Phase 1)
 * Caches app shell assets for fast loading.
 */

const CACHE_NAME = 'prayaas-gurukul-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './assets/css/theme.css',
  './assets/css/components.css',
  './assets/js/app.js',
  './assets/img/logo.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/maskable-512.png',
  './assets/img/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache live API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy for static app shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});