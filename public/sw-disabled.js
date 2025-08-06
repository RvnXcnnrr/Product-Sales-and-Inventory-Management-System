// Service Worker disabled for development
console.log('Service Worker disabled for debugging')

// Clear any existing caches
self.addEventListener('install', function(event) {
  console.log('SW: Install event - clearing caches')
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('SW: Deleting cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  console.log('SW: Activate event')
  event.waitUntil(self.clients.claim())
})

// Don't cache anything, just pass through
self.addEventListener('fetch', function(event) {
  // Do nothing, let all requests pass through normally
})
