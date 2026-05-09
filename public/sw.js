// Kill-switch do Service Worker antigo.
// Remove caches e desregistra o SW para impedir shell/JS antigo e loops de reload.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    await Promise.all(windows.map((client) => {
      const url = new URL(client.url);
      url.searchParams.set('sw-cleanup', Date.now().toString());
      return client.navigate(url.toString());
    }));

    await self.registration.unregister();
  })());
});