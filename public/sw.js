/* PSORE V4.2.2 - service worker de désactivation des anciens caches PWA */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.navigate(client.url));
  })());
});
self.addEventListener('fetch', () => {});
