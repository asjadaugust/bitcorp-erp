// Service Worker for Bitcorp ERP - Daily Reports PWA
// Implements offline-first capability with IndexedDB caching and background sync

// IMPORTANT: Increment version to force cache refresh
const CACHE_VERSION = 'bitcorp-erp-v2.1.0-dev';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Development mode: Disable caching
const DEVELOPMENT_MODE =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
];

// API routes that can be cached
const API_CACHE_ROUTES = [
  '/api/equipment',
  '/api/operators',
  '/api/projects',
  '/api/reports',
  '/api/tipos-equipo',
  '/api/precalentamiento-config',
  '/api/vales-combustible',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  // In development mode, skip caching during install
  if (DEVELOPMENT_MODE) {
    console.log('[SW] Development mode - skipping cache, force updating');
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache
          .addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: 'no-cache' })))
          .catch((err) => {
            console.warn('[SW] Failed to cache some static assets:', err);
            // Don't fail installation if some assets fail
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith('bitcorp-erp-') &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // In development mode, always fetch from network (no caching)
  if (DEVELOPMENT_MODE) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        // Only use cache as absolute fallback
        return caches.match(request).then((response) => {
          return response || fetch(request);
        });
      })
    );
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // For daily report submissions, use background sync
  if (request.method === 'POST' && url.pathname === '/api/reports') {
    return handleReportSubmission(request);
  }

  // For GET requests, try network first, fallback to cache
  if (request.method === 'GET') {
    try {
      // Force network request by bypassing browser cache
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        cache: 'no-store',
      });

      // Cache successful responses
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      console.log('[SW] Network request failed, checking cache:', error);
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        console.log('[SW] Returning cached response');
        return cachedResponse;
      }

      // Return offline response
      return new Response(
        JSON.stringify({
          success: false,
          offline: true,
          message: 'You are offline. Data will sync when connection is restored.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // For other methods, just try network
  return fetch(request);
}

// Cache-first strategy for static assets (except index.html)
async function handleStaticRequest(request) {
  const url = new URL(request.url);

  // Network-first for index.html to ensure app updates are seen immediately
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;
      throw error;
    }
  }

  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url, error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/index.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }

    throw error;
  }
}

// Handle report submission with background sync
async function handleReportSubmission(request) {
  try {
    // Try to send immediately
    const response = await fetch(request.clone());

    if (response.ok) {
      return response;
    }

    // If failed, store for background sync
    await storeFailedRequest(request);

    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        message: 'Report saved offline. Will sync when connection is restored.',
        queued: true,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.log('[SW] Report submission failed, storing for sync:', error);

    // Store for background sync
    await storeFailedRequest(request);

    return new Response(
      JSON.stringify({
        success: true,
        offline: true,
        message: 'You are offline. Report saved and will be submitted when connection is restored.',
        queued: true,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Store failed request for background sync
async function storeFailedRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  // Store in IndexedDB (implementation in sync-manager.ts)
  self.registration.sync.register('sync-reports').catch((err) => {
    console.log('[SW] Background sync registration failed:', err);
  });

  // Send message to client to store in IndexedDB
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'STORE_OFFLINE_REQUEST',
      data: requestData,
    });
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

// Sync pending reports from IndexedDB
async function syncPendingReports() {
  console.log('[SW] Syncing pending reports...');

  // Request pending reports from client
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_PENDING_REPORTS',
    });
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bitcorp ERP';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-96x96.png',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[SW] Service worker loaded');
