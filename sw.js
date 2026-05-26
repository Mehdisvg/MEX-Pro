const CACHE = 'mex-pro-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/theme-pro.css',
  '/app.js',
  '/mex-auth.js',
  '/mex-features.js',
  '/mex-exercises.js',
  '/mex-exercise-details.js',
  '/theme-pro.css',
  '/mex-pro-screens.js',
  '/mex-profile.js',
  '/mex-nutrition.js',
  '/mex-activity.js',
  '/mex-pwa.js',
  '/data/tr-nutrition-bundle.js',
  '/data/exercises-bundle.js',
  '/data/exercise-details-bundle.js',
  '/data/tr-nutrition-bundle.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('/index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
