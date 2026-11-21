// Este app foi substituído pelo HiAdv (https://hiadv.com.br/).
// Limpa os arquivos guardados no aparelho, se desliga e leva quem estiver aberto para o HiAdv.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter((k) => /-(equipe|hiadv)(-fixos)?$/.test(k)).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach((c) => c.navigate('https://hiadv.com.br/').catch(() => {}));
  })());
});
