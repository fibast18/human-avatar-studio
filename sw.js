/* Human Avatar Studio v1.0.0: light app-shell cache. 3D libraries/models and microphone may require internet. */
const CACHE='human-avatar-studio-shell-v1.0.0';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('human-avatar-studio-shell-')&&n!==CACHE).map(n=>caches.delete(n)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return response}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
