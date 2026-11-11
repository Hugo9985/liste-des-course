// Service Worker v16 : application utilisable hors-ligne.
// - Pages (navigation)         : réseau d'abord (3,5 s max), sinon copie en cache -> mises à jour immédiates en ligne.
// - Fichiers statiques locaux   : Stale-While-Revalidate (réponse instantanée + mise à jour en arrière-plan).
// - Bibliothèque supabase-js    : Cache-First (version figée sur jsDelivr, ses dépendances sont pré-chargées).
// - Jamais en cache             : API Supabase / Groq / Open Food Facts (les données sont gardées par l'app dans IndexedDB).
const VERSION = 'v16';
const STATIC = `courses-static-${VERSION}`, CDN = `courses-cdn-${VERSION}`;
const SHELL = ['/', '/index.html', '/config.js', '/manifest.json', '/icon-192.png', '/icon-512.png'];
const MODULES = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'];
const skip = (u) => /\.supabase\.co$/.test(u.hostname) || u.hostname.endsWith('groq.com') || (/open(food|beauty|products)facts\.org$/.test(u.hostname));

// Pré-charge un module ES et, récursivement, les modules qu'il importe (le « +esm » de jsDelivr importe des chemins absolus /npm/...).
async function precacheModule(url, seen = new Set(), depth = 0) {
  if (seen.has(url) || depth > 3) return; seen.add(url);
  try {
    const cache = await caches.open(CDN);
    let res = await cache.match(url, { ignoreVary: true });
    if (!res) { res = await fetch(url, { mode: 'cors' }); if (!res.ok) return; await cache.put(url, res.clone()); }
    const text = await res.clone().text(), origin = new URL(url).origin, re = /(?:from|import)\s*\(?\s*["'](\/[^"']+)["']/g, deps = []; let m;
    while ((m = re.exec(text))) deps.push(origin + m[1]);
    await Promise.all(deps.map((d) => precacheModule(d, seen, depth + 1)));
  } catch (_) { /* hors-ligne pendant l'installation : le cache d'exécution complètera plus tard */ }
}
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    const seen = new Set(); await Promise.all(MODULES.map((m) => precacheModule(m, seen)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== STATIC && k !== CDN).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name), hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  try { const res = await fetch(req); if (res && res.ok) cache.put(req, res.clone()); return res; } catch (_) { return Response.error(); }
}
async function swr(req, name, e) {
  const cache = await caches.open(name), hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || Response.error();
}
async function networkFirst(req) {
  const cache = await caches.open(STATIC);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))]);
    if (res && res.ok) cache.put('/index.html', res.clone());
    return res;
  } catch (_) {
    return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
  }
}
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (skip(url)) return;                                                   // données : jamais gérées ici
  if (url.hostname === 'cdn.jsdelivr.net') return e.respondWith(cacheFirst(req, CDN));
  if (url.origin !== self.location.origin) return;                         // images externes, etc. : comportement normal du navigateur
  if (req.mode === 'navigate') return e.respondWith(networkFirst(req));
  e.respondWith(swr(req, STATIC, e));
});

// Notifications Web Push
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || '🔴 Article urgent', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || 'urgent', data: { url: '/' },
    vibrate: d.urgent ? [200, 100, 200, 100, 200] : [80, 50, 80], requireInteraction: !!d.urgent
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => l.length ? l[0].focus() : clients.openWindow('/')));
});
