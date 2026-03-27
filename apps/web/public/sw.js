const CACHE_NAME = "maphari-portal-v3";
const OFFLINE_URL = "/offline.html";

// Resources to precache (static assets only — NOT navigation HTML).
// HTML pages are always fetched fresh from the network so Turbopack/webpack
// chunk hashes in the <script> tags are never stale.
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Delete every old cache version (including v1 which had "/" pre-cached).
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET and non-http requests
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;
  // Skip API / gateway requests — always network-first
  if (event.request.url.includes("/api/") || event.request.url.includes("/gateway/")) return;
  // Skip Next.js build chunks — never cache; always fetch fresh from dev/prod server
  if (event.request.url.includes("/_next/")) return;

  // Navigation requests (HTML pages): network-first.
  // This guarantees the browser always receives up-to-date HTML whose
  // embedded chunk hashes match the currently running build.  Falling back
  // to a cached page with stale hashes causes ChunkLoadErrors.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (icons, manifest, offline page): cache-first with
  // network fallback.  These files do not contain build-specific hashes.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => undefined);
    })
  );
});
