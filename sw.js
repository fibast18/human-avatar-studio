/* Human Avatar Studio v1.2.0: app shell only; never cache Worker AI calls. */
const CACHE='human-avatar-studio-shell-v1.2.0';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(Promise.all([caches.keys().then(names => Promise.all(names.filter(n => n.startsWith('human-avatar-studio-shell-') && n !== CACHE).map(n => caches.delete(n)))), self.clients.claim()])); });
self.addEventListener('fetch', event => {
 const request=event.request,url=new URL(request.url);
 if (request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}
  return response;
 }).catch(()=>caches.match(request).then(r=>r||caches.match('./index.html'))));
});
