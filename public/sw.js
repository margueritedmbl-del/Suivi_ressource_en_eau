const CACHE='psore-v3-sig-1';
const STATIC=[
  '/', '/cartographie',
  '/data/hydrographie/grand_bassin.geojson',
  '/data/hydrographie/sous_bassins.geojson',
  '/data/decisionnel/communes_projet_enabel.geojson',
  '/data/decisionnel/restaurations.geojson',
  '/data/decisionnel/piezometres_ptcs.geojson'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    const copy=response.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return response;
  }).catch(()=>caches.match('/cartographie'))));
});
