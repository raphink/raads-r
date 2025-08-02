const CACHE_NAME = 'raads-r-v1.0.1';
const urlsToCache = [
  './',
  './index.html',
  './report.html',
  './manifest.json',
  './report.css',
  './report.js',
  './en.json',
  './fr.json',
  './es.json',
  './it.json',
  './de.json',
  // Icons
  './icons/icon-16x16.png',
  './icons/icon-32x32.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './favicon.ico',
  // External CDN resources (cached for offline use)
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.5/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache resources:', err);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // For API calls to the backend, allow network first
        if (event.request.url.includes('analyze') || event.request.url.includes('stream')) {
          return fetch(event.request).catch(() => {
            // If network fails for API calls, could return a custom offline response
            return new Response(JSON.stringify({
              error: 'This feature requires an internet connection'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }
        
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for when the app comes back online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    // Could implement queued report generation here
    console.log('Background sync triggered');
  }
});

// Push notifications (for future features)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
