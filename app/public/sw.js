// Bykneo Production PWA Service Worker — v2 (Web Push enabled)
const CACHE_NAME = 'bykneo-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/socket.io/')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Web Push: show native OS notification ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '🏍️ New Ride Request!', body: 'Open Bykneo to accept.' };
  }

  const title   = data.title   || '🏍️ New Ride Request!';
  const options = {
    body:               data.body    || 'A rider is waiting nearby.',
    icon:               data.icon    || '/favicon.ico',
    badge:              data.badge   || '/favicon.ico',
    tag:                data.tag     || 'bykneo-ride',
    requireInteraction: data.requireInteraction !== false,  // stays until tapped
    vibrate:            data.vibrate || [200, 100, 200, 100, 400],
    silent:             false,
    data: {
      rideId:   data.rideId   || '',
      fare:     data.fare     || 0,
      distance: data.distance || 0,
      pickup:   data.pickup   || '',
      url:      self.registration.scope   // PWA root URL
    },
    actions: [
      { action: 'accept', title: '✅ Accept Ride', icon: '/favicon.ico' },
      { action: 'ignore', title: '❌ Ignore',      icon: '/favicon.ico' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Handle notification tap / action button ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action } = event;
  const { url, rideId } = event.notification.data || {};

  // If driver tapped "Ignore" — just close
  if (action === 'ignore') return;

  // For "Accept" tap or direct tap on the notification body: open/focus the PWA
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If PWA tab already open, focus it
      const existing = windowClients.find(
        (c) => c.url.startsWith(self.registration.scope) && 'focus' in c
      );
      if (existing) {
        existing.focus();
        // Pass the rideId so the app can highlight the incoming request
        if (rideId) {
          existing.postMessage({ type: 'RIDE_INCOMING', rideId });
        }
        return;
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url || self.registration.scope);
      }
    })
  );
});
