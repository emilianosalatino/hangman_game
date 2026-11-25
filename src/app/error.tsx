"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Barrera de error a nivel de ruta.
 *
 * En modo desarrollo, el HMR de Next.js (Turbopack) a veces corrompe el
 * estado interno de React y los manejadores de eventos dejan de funcionar,
 * provocando un error al siguiente render. Esta barrera captura esos errores
 * y recarga la página automáticamente para recuperar la interactividad.
 *
 * Para evitar bucles de recarga infinita si el error es determinista (un bug
 * real), solo se auto-recarga si la última recarga fue hace más de 10 segundos.
 * Si los errores se repiten muy rápido, se muestra un botón manual.
 */
const CLAVE_ULTIMA_RECARGA = "ahorcado-ultima-recarga-ms";
const UMBRAL_RAPIDO_MS = 10_000;

function ultimaRecargaReciente(): boolean {
  try {
    const valor = sessionStorage.getItem(CLAVE_ULTIMA_RECARGA);
    if (!valor) return false;
    const ts = Number(valor);
    return Number.isFinite(ts) && Date.now() - ts < UMBRAL_RAPIDO_MS;
  } catch {
    return false;
  }
}

function marcarRecarga() {
  try {
    sessionStorage.setItem(CLAVE_ULTIMA_RECARGA, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (ultimaRecargaReciente()) return; // No auto-recargar en bucle.
    marcarRecarga();
    const t = setTimeout(() => {
      window.location.reload();
    }, 1200);
    return () => clearTimeout(t);
  }, [error]);

  const recargaRapida = ultimaRecargaReciente();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-rose-50 p-6 text-center">
      <div className="rounded-3xl border-2 border-orange-200 bg-white/90 p-8 shadow-sm">
        <h2 className="text-2xl font-black text-orange-600">
          ¡Uy! El juego se desconectó
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          {recargaRapida
            ? "Parece que hay un problema persistente. Pulsa el botón para recargar la página."
            : "Estamos recargando la página automáticamente para que vuelva a funcionar…"}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={() => {
              marcarRecarga();
              window.location.reload();
            }}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Recargar ahora
          </Button>
          <Button variant="outline" onClick={() => reset()}>
            Reintentar sin recargar
          </Button>
        </div>
      </div>
    </div>
  );
}
