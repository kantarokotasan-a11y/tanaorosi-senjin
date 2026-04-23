const CACHE='inv-app-v15';
const FILES=['./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  const url=new URL(req.url);
  const isHTML=req.mode==='navigate'||req.destination==='document'||url.pathname.endsWith('.html')||url.pathname.endsWith('/');
  
  if(isHTML){
    e.respondWith(
      fetch(req).then(resp=>{
        if(resp.ok){
          const clone=resp.clone();
          caches.open(CACHE).then(c=>c.put(req,clone));
        }
        return resp;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  
  e.respondWith(
    caches.match(req).then(r=>r||fetch(req).then(resp=>{
      if(resp.ok&&req.method==='GET'){
        const clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(req,clone));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
