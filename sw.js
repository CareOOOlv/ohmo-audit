/* OHMO 冰奶门店稽查 PWA Service Worker
 * 版本策略：更新后请递增 CACHE 版本号（v1 → v2），旧缓存自动清理。
 * 页面导航网络优先（云端记录保持最新），本地静态资源缓存优先（离线可稽查）。 */
const CACHE = 'ohmo-audit-v1';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/html2canvas.min.js',
  './assets/jspdf.min.js',
  './assets/signature_pad.min.js',
  './assets/ohmo-logo-sign.jpg',
  './assets/ohmo-slogan-sign.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return;
  }
  // 云端记录 API（tcloudbase.com）走网络，不做缓存
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
    )
  );
});
