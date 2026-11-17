// O site não é mais instalável: os aplicativos agora ficam em /cliente/ e /equipe/.
// Este arquivo apaga o service worker antigo da raiz e os arquivos guardados por ele.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => !/-(cliente|equipe)$/.test(k)).map((k) => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll())
    .then((cs) => cs.forEach((c) => c.navigate(c.url))));
});
