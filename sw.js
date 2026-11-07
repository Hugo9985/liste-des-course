const CACHE = 'courses-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/config.js', '/icon-192.png'];

// --- Push (Firebase Cloud Messaging) ---
try {
  importScripts('/config.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp(self.APP.firebase);
  firebase.messaging().onBackgroundMessage((p) => {
    const d = p.data || {};
    self.registration.showNotification(d.title || '🔴 Article urgent', {
      body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png',
      tag: d.tag || 'urgent', data: { url: '/' }
    });
  });
} catch (e) { console.warn('FCM indisponible', e); }

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) =>
    l.length ? l[0].focus() : clients.openWindow('/')));
});

// --- Cache hors-ligne (coquille de l'app) ---
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request).then((m) => m || caches.match('/'))));
});
