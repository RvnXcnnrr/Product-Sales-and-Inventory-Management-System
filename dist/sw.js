// Service Worker completely disabled to prevent refresh issues
console.log('Service Worker disabled to fix refresh issues')

// This service worker does absolutely nothing but unregister itself

self.addEventListener('install', function(event) {
  console.log('SW: Installing no-op service worker')
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  console.log('SW: Activating no-op service worker')
  // Unregister this service worker
  self.registration.unregister().then(() => {
    console.log('SW: Unregistered')
  })
  event.waitUntil(self.clients.claim())
})

// Don't cache anything, just pass through
self.addEventListener('fetch', function(event) {
  // Do nothing, let all requests pass through normally
})
