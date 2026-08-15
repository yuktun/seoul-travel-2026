const CACHE='seoul-travel-v1.39';
const ASSETS=['./','./index.html','./styles.css?v=1.39','./app.js?v=1.39','./manifest.webmanifest?v=1.39','./app-icon-192.png','./app-icon-512.png','./apple-touch-icon.png'];
const FIREBASE_SDK=[
  'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async cache=>{
  await cache.addAll(ASSETS);
  await Promise.all(FIREBASE_SDK.map(url=>cache.add(url).catch(()=>null)));
}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url),sameOrigin=url.origin===self.location.origin,isFirebaseSdk=FIREBASE_SDK.includes(url.href);
  if(!sameOrigin&&!isFirebaseSdk)return;
  if(e.request.mode==='navigate'){
    e.respondWith(caches.match('./index.html').then(cached=>{
      const fresh=fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy))}return response}).catch(()=>cached);
      return cached||fresh;
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy))}return response})));
});
