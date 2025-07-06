// Service Worker para PWA
const CACHE_NAME = 'dp300-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.svg'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Todos os arquivos estão em cache');
        // Força a ativação imediata
        return self.skipWaiting();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Skip para requisições não-GET
  if (event.request.method !== 'GET') return;
  
  // Skip para URLs que não devemos cachear
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' ||
      url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.pathname.includes('/api/') ||
      url.pathname.includes('browser-sync')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          console.log('Service Worker: Servindo do cache:', event.request.url);
          return response;
        }
        
        // Senão, busca da rede e adiciona ao cache
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone a resposta
            const responseToCache = response.clone();

            // Só cachea se for uma URL válida
            if (event.request.url.startsWith('http')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.log('Error caching:', error);
                });
            }

            return response;
          })
          .catch(() => {
            // Se offline e não tem cache, retorna página offline básica
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativado e controlando todas as páginas');
      return self.clients.claim();
    })
  );
});

// Notification para updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
