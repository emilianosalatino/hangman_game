/* Service worker de la PWA "El Ahorcado".
 *
 * Es intencionalmente mínimo y SIN caché: en modo desarrollo (Next.js dev con
 * HMR) cachear rompería la recarga en caliente. Su única función es existir y
 * responder a 'fetch' para que el navegador considere la app instalable.
 *
 * En un build de producción se podría añadir precaching de los chunks estáticos,
 * pero como aquí trabajamos en dev, lo dejamos en modo pass-through.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Solo gestionar GETs; dejar que el navegador haga el resto.
  if (event.request.method !== "GET") return;
  // Pass-through: sirve siempre la versión fresca de la red.
  event.respondWith(fetch(event.request));
});
