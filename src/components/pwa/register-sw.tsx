"use client";

import { useEffect } from "react";

/**
 * Registra el service worker para habilitar la PWA (instalable en móvil/
 * escritorio). El SW (/sw.js) es pass-through y no caches nada, así que es
 * seguro también en modo desarrollo con HMR.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    // Registro en diferido para no competir con la hidratación inicial.
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Silencioso: si falla el registro, la app web sigue funcionando. */
      });
    };
    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
