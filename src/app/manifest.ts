import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA.
 * Next.js (App Router) sirve este manifiesto en /manifest.webmanifest y
 * añade automáticamente la etiqueta <link rel="manifest"> al <head>.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Ahorcado - Juego para niños",
    short_name: "Ahorcado",
    description:
      "Juego del ahorcado en español con 50 palabras pensadas para niños de 8 a 10 años.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ed",
    theme_color: "#ea580c",
    lang: "es",
    categories: ["games", "education", "kids"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
