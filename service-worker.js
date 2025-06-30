self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('japan2025').then(function(cache) {
      return cache.addAll(['index.html', 'style.css', 'app.js']);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
