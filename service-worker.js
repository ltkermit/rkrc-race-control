// RKRC Race Control - Service Worker v1.8.7

const CACHE_NAME = 'rkrc-race-control-v1.8.7';
const RUNTIME_CACHE = 'rkrc-runtime-v1.8.7';

const urlsToCache = [
  '/',
  '/index.html',
  '/steward.html',
  '/nosteward.html',
  '/instructions.html',
  '/changelog.html',
  '/css/style.css?v=1.8.7',
  '/js/live.js?v=1.8.7',
  '/js/drivers.js?v=1.8.7',
  '/js/script.js?v=1.8.7',
  '/js/noSleep.min.js',
  '/manifest.json',
  '/img/logo-v4-no-tag.png',
  '/img/favicon.ico',
  // Shared beep sounds
  '/audio/beep.mp3',
  '/audio/start-beep.mp3',
  // American voice
  '/audio/america/startengines.mp3',
  '/audio/america/yellowon.mp3',
  '/audio/america/yellowoff.mp3',
  '/audio/america/redon.mp3',
  '/audio/america/redoff.mp3',
  '/audio/america/end.mp3',
  '/audio/america/restart.mp3',
  '/audio/america/getready.mp3',
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
  '/audio/europe/e-startengines.mp3',
  '/audio/europe/e-yellowon.mp3',
  '/audio/europe/e-yellowoff.mp3',
  '/audio/europe/e-redon.mp3',
  '/audio/europe/e-redoff.mp3',
  '/audio/europe/e-end.mp3',
  '/audio/europe/e-restart.mp3',
  '/audio/europe/e-getready.mp3',
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
  '/audio/merica/n-startengines.mp3',
  '/audio/merica/n-yellowon.mp3',
  '/audio/merica/n-yellowoff.mp3',
  '/audio/merica/n-redon.mp3',
  '/audio/merica/n-redoff.mp3',
  '/audio/merica/n-end.mp3',
  '/audio/merica/n-restart.mp3',
  '/audio/merica/n-getready.mp3',
  '/audio/merica/n-30-seconds.mp3',
  '/audio/merica/n-1-minute.mp3',
  '/audio/merica/n-2-minute.mp3',
  '/audio/merica/n-3-minute.mp3',
  '/audio/merica/n-4-minute.mp3',
  '/audio/merica/n-5-minute.mp3',
  '/audio/merica/n-6-minute.mp3',
  '/audio/merica/n-7-minute.mp3',
  '/audio/merica/n-8-minute.mp3',
  '/audio/merica/n-9-minute.mp3',
  // Dee Liffy voice
  '/audio/dee/dee-startengines.wav',
  '/audio/dee/dee-yellowon.wav',
  '/audio/dee/dee-yellowoff.wav',
  '/audio/dee/dee-redon.wav',
  '/audio/dee/dee-redoff.wav',
  '/audio/dee/dee-end.wav',
  '/audio/dee/dee-restart.wav',
  '/audio/dee/dee-getready.wav',
  '/audio/dee/dee-30-seconds.wav',
  '/audio/dee/dee-1-minute.wav',
  '/audio/dee/dee-2-minute.wav',
  '/audio/dee/dee-3-minute.wav',
  '/audio/dee/dee-4-minute.wav',
  '/audio/dee/dee-5-minute.wav',
  '/audio/dee/dee-6-minute.wav',
  '/audio/dee/dee-7-minute.wav',
  '/audio/dee/dee-8-minute.wav',
  '/audio/dee/dee-9-minute.wav',
  // DJT voice
  '/audio/djt/djt-startengines.wav',
  '/audio/djt/djt-yellowon.wav',
  '/audio/djt/djt-yellowoff.wav',
  '/audio/djt/djt-redon.wav',
  '/audio/djt/djt-redoff.wav',
  '/audio/djt/djt-end.wav',
  '/audio/djt/djt-restart.wav',
  '/audio/djt/djt-getready.wav',
  '/audio/djt/djt-30-seconds.wav',
  '/audio/djt/djt-1-minute.wav',
  '/audio/djt/djt-2-minute.wav',
  '/audio/djt/djt-3-minute.wav',
  '/audio/djt/djt-4-minute.wav',
  '/audio/djt/djt-5-minute.wav',
  '/audio/djt/djt-6-minute.wav',
  '/audio/djt/djt-7-minute.wav',
  '/audio/djt/djt-8-minute.wav',
  '/audio/djt/djt-9-minute.wav',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' bypasses the HTTP cache so a stale copy is never stored
      .then(cache => cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const whitelist = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.map(name => !whitelist.includes(name) && caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request.clone()).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
