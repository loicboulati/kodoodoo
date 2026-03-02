// Kodoodoo Service Worker v1.0
var CACHE_NAME = 'kodoodoo-v1772182051';
var ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation - mise en cache des ressources
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      console.log('Cache ouvert');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation - nettoyage des anciens caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - servir depuis le cache si disponible (offline first)
self.addEventListener('fetch', function(e){
  // Ne pas intercepter les requetes Supabase
  if(e.request.url.indexOf('supabase.co') >= 0){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Mettre en cache les nouvelles ressources
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline : retourner la page principale
        return caches.match('/index.html');
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(e){
  var data = {};
  if(e.data){
    try { data = e.data.json(); } catch(err) { data = { title: 'Kodoodoo', body: e.data.text() }; }
  }
  var titre = data.title || 'Kodoodoo 🦘';
  var options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'ouvrir', title: 'Ouvrir' },
      { action: 'fermer', title: 'Fermer' }
    ]
  };
  e.waitUntil(self.registration.showNotification(titre, options));
});

// Clic sur notification
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  if(e.action === 'fermer') return;
  e.waitUntil(
    clients.openWindow(e.notification.data || '/')
  );
});
