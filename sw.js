// Service worker: permite instalar o site como aplicativo e abrir mais rápido.
// Nunca guarda dados de clientes; só arquivos do próprio site.
const VERSAO = 'lanhi-v6-2026-11-13';
const ESSENCIAIS = ['./', 'cliente.html', 'icon-192.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAIS)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(png|jpg|webp|avif)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((resp) => {
      if (resp.ok) { const cp = resp.clone(); caches.open(VERSAO).then((c) => c.put(req, cp)); }
      return resp;
    })));
    return;
  }
  e.respondWith(fetch(req).then((resp) => {
    if (resp.ok && resp.type === 'basic') { const cp = resp.clone(); caches.open(VERSAO).then((c) => c.put(req, cp)); }
    return resp;
  }).catch(() => caches.match(req).then((r) => r || caches.match(/cliente\.html$/.test(url.pathname) ? 'cliente.html' : './'))));
});
