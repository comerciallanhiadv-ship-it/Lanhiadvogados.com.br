// Service worker do app Lanhi Advogados Equipe: abre rápido e funciona com internet fraca.
// Nunca guarda dados de clientes; só os arquivos do próprio app.
const VERSAO = 'lanhi-20261119-1938-equipe';
const FIXO = 'lanhi-arquivos-equipe-fixos';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(['./', 'icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(fetch('./', { cache: 'no-store' }).then((r) => r.text()).then((t) => caches.open(FIXO).then((c) => c.keys().then((ks) => Promise.all(ks.filter((k) => t.indexOf(new URL(k.url).pathname.split('/').slice(-2).join('/')) < 0).map((k) => c.delete(k)))))).catch(() => {}));
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.endsWith('-equipe') && k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  // Arquivos com o conteúdo no nome (js/…, css/…) nunca mudam: vêm direto do aparelho.
  if (/\/(js|css)\/[\w-]+\.[0-9a-f]{10}\.(js|css)$/.test(url.pathname)) {
    e.respondWith(caches.open(FIXO).then((c) => c.match(req).then((r) => r || fetch(req).then((resp) => { if (resp.ok) c.put(req, resp.clone()); return resp; }))));
    return;
  }
  e.respondWith(fetch(req).then((resp) => {
    if (resp.ok && resp.type === 'basic') { const cp = resp.clone(); caches.open(VERSAO).then((c) => c.put(req, cp)); }
    return resp;
  }).catch(() => caches.match(req).then((r) => r || caches.match('./'))));
});
