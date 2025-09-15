// PWA Service Worker para TROMOT PRO
const VERSION = 'v3.0.0';
const STATIC_CACHE = `tromot-pro-static-${VERSION}`;
const RUNTIME_CACHE = `tromot-pro-runtime-${VERSION}`;
const IMAGE_CACHE = `tromot-pro-images-${VERSION}`;

// Recursos essenciais para cache estático - EXPANDIDO PARA GARANTIR INSTALAÇÃO
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
  '/src/main.tsx',
  '/src/App.css',
  '/index.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', VERSION);
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assumir controle de todas as páginas
      self.clients.claim()
    ])
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) return;

  // Navegação - Network First com fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache da página se válida
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache ou página inicial
          return caches.match(request) || caches.match('/');
        })
    );
    return;
  }

  // Assets estáticos - Cache First
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff')) {
    
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Imagens - Cache First com cache separado
  if (request.destination === 'image' ||
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API calls - Network First
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('supabase')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache apenas GET requests bem-sucedidos
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          if (request.method === 'GET') {
            return caches.match(request);
          }
          throw new Error('Network error and no cache available');
        })
    );
    return;
  }

  // Outras requisições - Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Mensagens do cliente (para forçar atualização)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Force update requested');
    self.skipWaiting();
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
    badge: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/lovable-uploads/69f15a00-b5c3-4777-ae5b-5285cf57e763.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TROMOT PRO', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});