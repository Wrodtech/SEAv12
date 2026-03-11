const CACHE_NAME = 'site-assistant-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',        // your main HTML file (rename if needed)
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  // add any other static assets (CSS, JS files) – but everything is inline in the HTML
];

// Install event – cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// Fetch – serve from cache first, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Cache hit
        }
        // Otherwise fetch from network
        return fetch(event.request).then(response => {
          // Optionally cache new requests (like API calls) – not needed here
          return response;
        });
      })
      .catch(() => {
        // Fallback for offline (optional)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});