/* ============================================================
   SERVICE WORKER — Despensa Familiar
   Estratégia: Cache-First com fallback para network
   ============================================================ */

const CACHE_NAME    = 'despensa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/src/styles/variables.css',
  '/src/styles/base.css',
  '/src/styles/components.css',
  '/src/styles/responsive.css',
  '/src/app.js',
  '/src/core/Config.js',
  '/src/core/StateManager.js',
  '/src/core/Utils.js',
  '/src/services/StorageService.js',
  '/src/services/CompressionService.js',
  '/src/services/ShareService.js',
  '/src/components/FormComponent.js',
  '/src/components/ListComponent.js',
  '/src/components/HistoryModal.js',
  '/src/components/ToastManager.js',
];

// ── Instalação ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.warn('[SW] Erro ao cachear:', err))
      .then(() => self.skipWaiting())
  );
});

// ── Ativação — limpa caches antigos ───────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch — Cache First ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Não intercepta requisições externas (fonts, CDN)
  const url = event.request.url;
  if (url.includes('fonts.googleapis.com') || url.includes('unpkg.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cacheia apenas respostas OK do mesmo origen
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback offline: retorna index.html para navegação
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('', { status: 408, statusText: 'Offline' });
        });
    })
  );
});