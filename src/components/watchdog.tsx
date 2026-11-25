"use client";

import { useEffect } from "react";

/**
 * Watchdog de hidratación.
 *
 * En modo desarrollo, el HMR de Next.js (Turbopack) puede corromper React de
 * forma silenciosa: la página sigue visible pero los botones pierden sus
 * manejadores onClick y dejan de responder. Las barreras de error NO capturan
 * esto (no hay un error de render, solo se "despega" React).
 *
 * Este componente revisa cada 3 segundos si un botón de letra sigue teniendo
 * su manejador onClick de React. Si detecta que React se desconectó (varias
 * comprobaciones consecutivas fallidas), recarga la página automáticamente para
 * recuperarla, con protección contra bucles de recarga.
 *
 * No recarga durante el brevísimo lapso entre la carga y la hidratación inicial,
 * porque ahí es normal que los manejadores aún no estén adjuntos.
 */
const CLAVE_ULTIMA_RECARGA = "ahorcado-ultima-recarga-ms";
const UMBRAL_ANTI_BUCLE_MS = 5_000;

function reactVivo(): boolean {
  const btn = document.querySelector<HTMLButtonElement>(
    'button[aria-label^="Letra"]'
  );
  if (!btn) return true; // Sin botones en pantalla: no decidir (no recargar).
  const propKey = Object.keys(btn).find((k) => k.startsWith("__reactProps"));
  return propKey ? !!btn[propKey].onClick : false;
}

function puedeRecargar(): boolean {
  try {
    const valor = sessionStorage.getItem(CLAVE_ULTIMA_RECARGA);
    if (!valor) return true;
    const ts = Number(valor);
    return !Number.isFinite(ts) || Date.now() - ts > UMBRAL_ANTI_BUCLE_MS;
  } catch {
    return false;
  }
}

function recargarAhora() {
  try {
    sessionStorage.setItem(CLAVE_ULTIMA_RECARGA, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export function Watchdog() {
  useEffect(() => {
    let hidratadoAlgunaVez = false;
    let fallasConsecutivas = 0;
    const FALAS_PARA_RECARGAR = 2; // ~6 s seguidos sin React.

    const id = setInterval(() => {
      const vivo = reactVivo();
      if (vivo) {
        hidratadoAlgunaVez = true;
        fallasConsecutivas = 0;
        return;
      }
      fallasConsecutivas += 1;
      // Solo recargar si ya se había hidratado antes (evita recargar durante
      // el lapso inicial de carga) o si pasó suficiente tiempo sin hidratar.
      if (
        (hidratadoAlgunaVez || fallasConsecutivas >= FALAS_PARA_RECARGAR) &&
        fallasConsecutivas >= FALAS_PARA_RECARGAR &&
        puedeRecargar()
      ) {
        recargarAhora();
      }
    }, 3000);

    return () => clearInterval(id);
  }, []);

  return null;
}
