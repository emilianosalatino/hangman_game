"use client";

import { useEffect } from "react";

/**
 * Barrera de error global.
 *
 * Captura errores que ocurren en el propio layout raíz (fuera del alcance de
 * error.tsx). Igual que la barrera de ruta, auto-recarga para recuperar la
 * interactividad cuando el HMR del modo dev corrompe React, con la misma
 * protección contra bucles de recarga.
 *
 * Nota: global-error.tsx reemplaza completamente el <html>/<body>, así que
 * debe renderizar su propia estructura y NO depender del layout raíz.
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

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    if (ultimaRecargaReciente()) return;
    marcarRecarga();
    const t = setTimeout(() => {
      window.location.reload();
    }, 1200);
    return () => clearTimeout(t);
  }, [error]);

  const recargaRapida = ultimaRecargaReciente();

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "linear-gradient(to bottom, #fffbeb, #fff1f2)",
          color: "#334155",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              borderRadius: "24px",
              border: "2px solid #fed7aa",
              background: "rgba(255,255,255,0.9)",
              padding: "32px",
              maxWidth: "440px",
            }}
          >
            <h2 style={{ color: "#ea580c", fontSize: "24px", margin: 0 }}>
              ¡Uy! El juego se desconectó
            </h2>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "#475569" }}>
              {recargaRapida
                ? "Pulsa el botón para recargar la página."
                : "Recargando automáticamente para que vuelva a funcionar…"}
            </p>
            <button
              onClick={() => {
                marcarRecarga();
                window.location.reload();
              }}
              style={{
                marginTop: "20px",
                background: "#f97316",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                padding: "10px 20px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recargar ahora
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
