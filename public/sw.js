const CACHE_VERSION = 'v3';
const STATIC_CACHE = `navykus-static-${CACHE_VERSION}`;
const IMAGES_CACHE = `navykus-images-${CACHE_VERSION}`;
const LOCALES_CACHE = `navykus-locales-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const expectedCaches = [STATIC_CACHE, IMAGES_CACHE, LOCALES_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !expectedCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Listen for SKIP_WAITING message from the page (user confirms update)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: cache-first for static, network-first for API, stale-while-revalidate for locales
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension://
  if (request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.origin !== self.location.origin) return;

  // API calls: always hit the network so CMS updates and empty startup responses are not cached.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503, statusText: 'Service Unavailable' })));
    return;
  }

  // Locales: Stale While Revalidate
  if (url.pathname.startsWith('/locales/')) {
    event.respondWith(staleWhileRevalidate(request, LOCALES_CACHE));
    return;
  }

  // Images: Cache First
  if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
    return;
  }

  // Static assets (JS, CSS)
  if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|ico|json)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages / navigation: Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // If offline and no cache for navigation, return offline page
    if (request.mode === 'navigate') {
      return (await caches.match('/')) || new Response('', { status: 503, statusText: 'Service Unavailable' });
    }
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a transparent placeholder for images
    if (request.url.match(/\.(svg|png|jpg|jpeg|webp)$/)) {
      return new Response('', { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}
