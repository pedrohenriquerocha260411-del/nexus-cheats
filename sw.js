// Nexus Cheats - Service Worker v5.0
const CACHE = 'nexus-v5';

// Instala o SW — não faz cache do Firebase, só do app
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]).catch(() => {});
    })
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Firebase sempre vai pra rede, resto usa cache
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase, Google APIs — SEMPRE rede (nunca cache)
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('gstatic.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // App shell — cache first, rede como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
