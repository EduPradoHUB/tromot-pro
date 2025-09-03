const CACHE_NAME = 'tromot-pro-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png'
];

// Immediately claim clients and skip waiting
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        // Fetch from network and cache important resources
        return fetch(event.request).then(response => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache important resources
          const responseToCache = response.clone();
          const url = event.request.url;
          
          if (url.includes('.js') || url.includes('.css') || url.includes('/manifest.json')) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        });
      })
  );
});