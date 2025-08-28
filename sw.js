const CACHE_NAME = 'tabata-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/audio.js',
  '/js/config.js',
  '/js/dropdown.js',
  '/js/event-listeners.js',
  '/js/modal.js',
  '/js/notifications.js',
  '/js/state.js',
  '/js/timer.js',
  '/js/ui.js',
  '/js/user-data-manager.js',
  '/js/viewport-manager.js',
  '/js/workout-manager.js',
  '/js/media-store.js',
  '/manifest.webmanifest',
  '/offline.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.protocol === 'chrome-extension:' || url.protocol === 'ms:') return;
  
  if (e.request.method === 'GET' && url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('/offline.html');
      }))
    );
    return;
  }

  if (e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return resp;
      }))
    );
  }
});
