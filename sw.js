// Service Worker para MIX WOD - Temporizador
// - Con internet: siempre baja la versión más nueva de la app (así se actualiza sola).
// - Sin internet: usa la copia guardada, así funciona offline una vez instalada.

const CACHE_NAME = "mixwod-cache-v4";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const sameOrigin = new URL(event.request.url).origin === self.location.origin;
  // En archivos propios, saltea la caché HTTP del navegador para traer siempre lo último
  const network = sameOrigin
    ? fetch(event.request.url, { cache: "no-cache" })
    : fetch(event.request);

  event.respondWith(
    network
      .then((response) => {
        if (response && (response.status === 200 || response.type === "opaque")) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
