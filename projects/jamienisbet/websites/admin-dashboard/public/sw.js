// Consultancy JN — service worker.
//
// Deliberately minimal: this is an owner-only, live dashboard reading Stripe and
// the database per request, so caching authenticated pages would risk serving
// stale or wrong-session data. The worker exists to make the app installable and
// to show a friendly offline page for navigations when the network is gone — it
// does NOT cache app responses.

const CACHE = "cjn-shell-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }))
      await self.skipWaiting()
    })()
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  // Only handle top-level navigations: try the network, fall back to the offline
  // page when it fails. Everything else goes straight to the network untouched.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const cache = await caches.open(CACHE)
          const offline = await cache.match(OFFLINE_URL)
          return offline ?? Response.error()
        }
      })()
    )
  }
})
