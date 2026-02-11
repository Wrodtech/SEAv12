// Service Worker for Site Engineering Assistant PWA
const CACHE_NAME = 'site-engineer-v1.2';
const CACHE_VERSION = '1.2.0';

// Files to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw-register.js',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For same-origin requests, try cache first with network fallback
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              // Don't cache if not a valid response
              if (!networkResponse || 
                  networkResponse.status !== 200 || 
                  networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clone the response to cache it
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('[Service Worker] Caching new resource:', event.request.url);
                });

              return networkResponse;
            })
            .catch(() => {
              // If both cache and network fail, return offline page
              if (event.request.headers.get('accept').includes('text/html')) {
                return caches.match('/index.html');
              }
              
              // For other requests, return a generic offline response
              return new Response('You are offline. This resource is not available offline.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-calculations') {
    event.waitUntil(syncCalculations());
  }
});

// Periodic sync for updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    console.log('[Service Worker] Periodic sync for updates');
    event.waitUntil(checkForUpdates());
  }
});

// Sync calculations when back online
function syncCalculations() {
  return new Promise((resolve) => {
    console.log('[Service Worker] Syncing calculations...');
    // In a real app, you would sync with a server here
    resolve();
  });
}

// Check for app updates
function checkForUpdates() {
  return fetch('/version.json')
    .then(response => response.json())
    .then(data => {
      if (data.version !== CACHE_VERSION) {
        console.log('[Service Worker] New version available:', data.version);
        // Notify clients about update
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: data.version
            });
          });
        });
      }
    })
    .catch(() => {
      console.log('[Service Worker] Could not check for updates');
    });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Site Engineering Assistant';
  const options = {
    body: data.body || 'New update available',
    icon: 'assets/icon-192x192.png',
    badge: 'assets/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    const urlsToCache = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});