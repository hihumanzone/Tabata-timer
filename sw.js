const CACHE_NAME = 'tabata-timer-v1';
const STATIC_CACHE_NAME = 'tabata-static-v1';
const DYNAMIC_CACHE_NAME = 'tabata-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/ui.js',
  './js/state.js',
  './js/config.js',
  './js/timer.js',
  './js/workout-manager.js',
  './js/user-data-manager.js',
  './js/event-listeners.js',
  './js/modal.js',
  './js/notifications.js',
  './js/dropdown.js',
  './js/audio.js',
  './js/viewport-manager.js',
  './js/pwa-manager.js',
  './js/file-manager.js',
  './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle static assets with Cache First strategy
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(fetchResponse => {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
              return fetchResponse;
            });
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        })
    );
    return;
  }

  // Handle external resources (media, etc.) with Network First strategy
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other same-origin requests with Network First strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Background sync for data backup (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'backup-data') {
    event.waitUntil(
      // This could be implemented to sync user data when back online
      console.log('Background sync: Data backup requested')
    );
  }
});

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './icons/icon-192x192.png',
      badge: './icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: './icons/icon-192x192.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Tabata Timer', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.open(cacheName).then(cache => {
            return cache.keys().then(keys => keys.length);
          });
        })
      );
    }).then(sizes => {
      const totalSize = sizes.reduce((sum, size) => sum + size, 0);
      event.ports[0].postMessage({ cacheSize: totalSize });
    });
  }
});