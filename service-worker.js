// RKRC Race Control - Service Worker
// Version 1.7.0

const CACHE_NAME = 'rkrc-race-control-v1.7.0';
const RUNTIME_CACHE = 'rkrc-runtime-v1.7.0';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/steward.html',
  '/nosteward.html',
  '/instructions.html',
  '/css/style.css',
  '/js/script.js',
  '/js/noSleep.min.js',
  '/img/logo-v4-no-tag.png',
  '/img/favicon.ico',
  // Beep sounds (shared)
  '/audio/beep.mp3',
  '/audio/start-beep.mp3',
  // American voice (default)
  '/audio/america/start-engines.mp3',
  '/audio/america/yellow-on.mp3',
  '/audio/america/yellow-off.mp3',
  '/audio/america/red-on.mp3',
  '/audio/america/red-off.mp3',
  '/audio/america/end.mp3',
  '/audio/america/restart.mp3',
  '/audio/america/get-ready.mp3',
  '/audio/america/30-seconds.mp3',
  '/audio/america/1-minute.mp3',
  '/audio/america/2-minute.mp3',
  '/audio/america/3-minute.mp3',
  '/audio/america/4-minute.mp3',
  '/audio/america/5-minute.mp3',
  '/audio/america/6-minute.mp3',
  '/audio/america/7-minute.mp3',
  '/audio/america/8-minute.mp3',
  '/audio/america/9-minute.mp3',
  // European voice
  '/audio/europe/e-start-engines.mp3',
  '/audio/europe/e-yellow-on.mp3',
  '/audio/europe/e-yellow-off.mp3',
  '/audio/europe/e-red-on.mp3',
  '/audio/europe/e-red-off.mp3',
  '/audio/europe/e-end.mp3',
  '/audio/europe/e-restart.mp3',
  '/audio/europe/e-get-ready.mp3',
  '/audio/europe/e-30-seconds.mp3',
  '/audio/europe/e-1-minute.mp3',
  '/audio/europe/e-2-minute.mp3',
  '/audio/europe/e-3-minute.mp3',
  '/audio/europe/e-4-minute.mp3',
  '/audio/europe/e-5-minute.mp3',
  '/audio/europe/e-6-minute.mp3',
  '/audio/europe/e-7-minute.mp3',
  '/audio/europe/e-8-minute.mp3',
  '/audio/europe/e-9-minute.mp3',
  // NASCAR voice
  '/audio/merica/n-start-engines.mp3',
  '/audio/merica/n-yellow-on.mp3',
  '/audio/merica/n-yellow-off.mp3',
  '/audio/merica/n-red-on.mp3',
  '/audio/merica/n-red-off.mp3',
  '/audio/merica/n-end.mp3',
  '/audio/merica/n-restart.mp3',
  '/audio/merica/n-get-ready.mp3',
  '/audio/merica/n-30-seconds.mp3',
  '/audio/merica/n-1-minute.mp3',
  '/audio/merica/n-2-minute.mp3',
  '/audio/merica/n-3-minute.mp3',
  '/audio/merica/n-4-minute.mp3',
  '/audio/merica/n-5-minute.mp3',
  '/audio/merica/n-6-minute.mp3',
  '/audio/merica/n-7-minute.mp3',
  '/audio/merica/n-8-minute.mp3',
  '/audio/merica/n-9-minute.mp3'
];

// Install event - cache all resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for runtime
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.log('[ServiceWorker] Fetch failed:', error);
          // Could return a custom offline page here if desired
          throw error;
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Skip waiting message received');
    self.skipWaiting();
  }
});

console.log('[ServiceWorker] Service Worker loaded');
